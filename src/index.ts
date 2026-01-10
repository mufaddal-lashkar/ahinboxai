// index.ts (type: module)
import dns from "dns";

dns.setDefaultResultOrder("ipv4first");
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import open from 'open';
import readline from 'readline';
import { google } from 'googleapis';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { graph } from "./agent.ts";

config();

// -------------------- PATH SETUP --------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
];

const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// -------------------- FILTER CONFIG --------------------
const filterConfig = {
    from: [
        // 'no-reply@classroom.google.com',
        'donlashkarwala@gmail.com',
        'joeljsamuel5@gmail.com',
    ],
    subjectIncludes: ['krish'],
    bodyIncludes: ['krish'],
    // subjectIncludes: ['internship', 'resume', 'job'],
    // bodyIncludes: ['apply', 'form', 'deadline'],
};

// -------------------- AUTH --------------------
async function authenticate() {
    const credentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_PATH, 'utf8')
    );

    const { client_secret, client_id, redirect_uris } =
        credentials.installed;

    const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
    );

    if (fs.existsSync(TOKEN_PATH)) {
        oAuth2Client.setCredentials(
            JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'))
        );
        return oAuth2Client;
    }

    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });

    console.log('🔗 Authorize this app:', authUrl);
    await open(authUrl);

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const code: string = await new Promise((resolve) => {
        rl.question('🔑 Enter the code: ', resolve);
    });

    rl.close();

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));

    return oAuth2Client;
}

// -------------------- FILTER LOGIC --------------------
function emailMatchesFilters(email: {
    from: string;
    subject: string;
    body: string;
}) {
    const fromMatch = filterConfig.from.some((f) =>
        email.from.includes(f)
    );

    const subjectMatch = filterConfig.subjectIncludes.some((k) =>
        email.subject.toLowerCase().includes(k.toLowerCase())
    );

    const bodyMatch = filterConfig.bodyIncludes.some((k) =>
        email.body.toLowerCase().includes(k.toLowerCase())
    );

    return fromMatch || subjectMatch || bodyMatch;
}

// -------------------- READ EMAILS --------------------
async function readEmails() {
    const auth = await authenticate();
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'is:unread',
    });

    const messages = res.data.messages || [];

    if (messages.length === 0) {
        console.log('📭 No new unread emails');
        return;
    }

    // console.log(`📥 Found ${messages.length} unread emails`);

    // Array to store filtered emails
    const matchedEmails: { from: string; subject: string; body: string }[] = [];

    for (const msg of messages) {
        const message = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
        });

        const headers = message.data.payload?.headers || [];

        // const id = msg.id

        const subject =
            headers.find((h) => h.name === 'Subject')?.value || '';

        const from =
            headers.find((h) => h.name === 'From')?.value || '';

        const body = message.data.snippet || '';

        const email = { from, subject, body };

        if (emailMatchesFilters(email)) {
            matchedEmails.push(email); // store in array
        }

        // Mark as read
        await gmail.users.messages.modify({
            userId: 'me',
            id: msg.id!,
            requestBody: {
                removeLabelIds: ['UNREAD'],
            },
        });
    }

    // Log all matched emails at once
    if (matchedEmails.length > 0) {
        // console.log('--------------------------');
        // console.log(`📧 Matched Emails (${matchedEmails.length})`);
        // console.log(matchedEmails);
        // console.log('--------------------------\n');

        return matchedEmails
    } else {
        console.log('📭 No emails matched your filters');
        return false
    }
}


// -------------------- CRON --------------------
console.log('🚀 Gmail listener started (cron every 1 minute)');

cron.schedule('*/1 * * * *', async () => {
    console.log('⏰ Checking emails...');
    try {
        const matchedEmails = await readEmails();
        console.log("Matched Emails :: ", matchedEmails)
        if (matchedEmails) {
            const SYSTEM_PROMPT = `You are a deterministic execution agent.

YOU MUST FOLLOW THESE RULES EXACTLY.
NO EXCEPTIONS.

--------------------------------
TOOL CALL RULES (ABSOLUTE)
--------------------------------

1. You MUST call the tool "classify_email" EXACTLY ONCE.
2. You are STRICTLY FORBIDDEN from calling "classify_email" again under ANY circumstance.
3. You MUST NOT loop, retry, re-check, or re-evaluate any decision.
4. You MUST NOT think, plan, or reason after receiving a tool response.

--------------------------------
DECISION RULES
--------------------------------

After receiving the result from "classify_email", follow these rules:

- If the result is "informational":
  → You MUST call the tool "summary_generated" exactly once.

- If the result is "urgent":
  → You MUST call the tool "send_urgent_reply" exactly once.

- If the result is "cta_data":
  → You MUST call the tool "send_static_data" exactly once.

- If the result is "cta_form":
  → You MUST END immediately.
  → DO NOT call any tool.
  → DO NOT take any action.

--------------------------------
EXECUTION FLOW (FINAL & IRREVERSIBLE)
--------------------------------

START
→ Call classify_email (ONCE)
→ Read tool output
→ informational → call summary_generated → STOP
→ urgent → call send_urgent_reply → STOP
→ cta_data → call send_static_data → STOP
→ cta_form → END (no action)

This flow is FINAL and MUST be followed EXACTLY.
`;
            for (const email of matchedEmails) {
                await graph.invoke({
                    messages: [
                        {
                            role: "system",
                            content: SYSTEM_PROMPT,
                        },
                        {
                            role: "user",
                            content: `
Subject: ${email.subject}
Body: ${email.body}
From: ${email.from}
`,
                        },
                    ],
                });

            }
        }
    } catch (err) {
        console.error('❌ Cron error:', err);
    }
});