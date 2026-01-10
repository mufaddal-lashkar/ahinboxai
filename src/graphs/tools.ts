import "dotenv/config";
import { tool } from "@langchain/core/tools";
import * as z from "zod";
import { ChatGroq } from "@langchain/groq";
import { sendEmailReply } from "../utils/sendEmail.ts";

/* ===============================
   1. GROQ MODEL
================================ */
const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "openai/gpt-oss-120b",
    temperature: 0,
});

function messageContentToString(content: any): string {
    if (typeof content === "string") {
        return content;
    }

    if (Array.isArray(content)) {
        return content
            .map((c) => {
                if (typeof c === "string") return c;
                if ("text" in c) return c.text;
                return "";
            })
            .join("");
    }

    return "";
}

function messageContentToStringtwo(content: any): string {
    if (typeof content === "string") return content;

    if (Array.isArray(content)) {
        return content
            .map((c) => {
                if (typeof c === "string") return c;
                if ("text" in c) return c.text;
                return "";
            })
            .join("");
    }

    return "";
}



/* ===============================
   2. EMAIL TOOLS (STUBS)
================================ */

export const classifyEmail = tool(
    async ({ subject, body }) => {
        console.log("📧 TOOL: classifyEmail");
        console.log({ subject, body });

        const response = await llm.invoke([
            {
                role: "system",
                content: `You are a deterministic email classification engine.

You MUST follow the rules EXACTLY.
If you break any rule, the output is considered INVALID.

--------------------------------
MANDATORY DECISION LOGIC (DO NOT SKIP)
--------------------------------

IMPORTANT:
You MUST analyze BOTH the email SUBJECT and the email BODY together.
If urgency or action appears in EITHER the subject OR the body, it MUST affect the final decision.

--------------------------------

1️⃣ FIRST CHECK — URGENCY (HIGHEST PRIORITY)

Read the email SUBJECT and BODY carefully.

If EITHER the subject OR the body contains ANY of the following:
- A deadline or time limit
- A warning, reminder, or final notice
- A consequence, loss, penalty, or risk
- Pressure or urgency language such as:
  urgent, asap, immediately, today, within X hours/days,
  final, last chance, reminder,
  suspended, blocked, rejected, cancelled,
  failure to comply, will be removed, will be lost

THEN you MUST output:
urgent

STOP. Do NOT continue further checks.

--------------------------------

2️⃣ SECOND CHECK — ACTION REQUIRED (CTA)

If AND ONLY IF step 1 is NO:

Check BOTH subject AND body for ANY request that requires the user to DO something, including:
- Sending resume, CV, portfolio, or documents
- Uploading files or certificates
- Filling or submitting any Google Form or online form
- Replying with information
- Completing any task or instruction

Even if the request is polite, optional, or friendly,
it MUST be classified as CTA.

If YES, you MUST output:
cta

STOP. Do NOT continue.

--------------------------------

3️⃣ FINAL CHECK — INFORMATION

If BOTH step 1 and step 2 are NO:

This means:
- No urgency
- No action required
- Only informational content

You MUST output:
information

--------------------------------
OUTPUT FORMAT RULES (ABSOLUTE)
--------------------------------
- Output EXACTLY ONE WORD
- Allowed outputs ONLY:
urgent
cta
information

- NO punctuation
- NO explanation
- NO additional text
- NO quotes
- NO spaces
- NO new lines

--------------------------------
ENFORCEMENT RULE (CRITICAL)
--------------------------------
If the email mentions ANY action AND ANY time constraint or risk
in EITHER subject OR body,
you MUST choose:
urgent

--------------------------------
EXAMPLES (FOLLOW EXACTLY)
--------------------------------

Subject: Resume Submission – Deadline Tomorrow
Body: Please submit your resume by tomorrow to proceed.
Output:
urgent

Subject: Document Verification
Body: Kindly share your documents for verification.
Output:
cta

Subject: Upcoming College Seminar
Body: This email is to inform you about the upcoming AI seminar.
Output:
information

Subject: Final Reminder
Body: Fill the form or your application will be rejected.
Output:
urgent

Subject: Meeting Schedule
Body: Here are the meeting details for next week.
Output:
information

--------------------------------
Now classify the following email:
`,
            },
            {
                role: "user",
                content: `Subject:
${subject}

Body:
${body}`
            },

        ]);
        console.log("Tool response : ", response.content)

        return response.content;
    },
    {
        name: "classify_email",
        description:
            "Classify email as informational, cta, or urgent",
        schema: z.object({
            subject: z.string(),
            body: z.string(),
        }),
    }
);


export const summarizeEmail = tool(
    async ({ subject, body, from }) => {
        console.log("📝 TOOL: summarizeEmail");
        console.log({ subject, body });

        const response = await llm.invoke([
            {
                role: "system",
                content: `You are a helpful personal assistant.

Your task:
Read the given email SUBJECT and BODY and generate a concise summary.

--------------------------------
SUMMARY RULES (MANDATORY)
--------------------------------

- Summarize BOTH the subject and the body together
- The summary must be written as if you are informing the user about their email
- Tone: professional, clear, assistant-style (like “Here’s what this email is about”)
- Use simple language

--------------------------------
LENGTH RULES
--------------------------------

- Minimum: 1 sentence
- Maximum: 2 sentences
- Do NOT exceed 2 sentences

--------------------------------
CONTENT RULES
--------------------------------

- Capture the main purpose of the email
- Mention any important request or key information if present
- Do NOT add opinions
- Do NOT invent details
- Do NOT repeat the subject verbatim unless necessary

--------------------------------
OUTPUT RULES (ABSOLUTE)
--------------------------------

- Output ONLY the summary text
- NO bullet points
- NO headings
- NO quotes
- NO emojis
- NO extra explanation

--------------------------------
Now summarize the following email.
`,
            },
            {
                role: "user",
                content: `Subject:
${subject}

Body:
${body}`
            },

        ]);
        console.log("Tool response : ", response.content)

        const summaryText = messageContentToString(response.content);

        await toolsByName.send_telegram.invoke({
            summary: summaryText,
            subject: subject,
            from: from
        });
        return true;
    },
    {
        name: "summarize_email",
        description:
            "Summarize informational email in 1-2 sentences",
        schema: z.object({
            subject: z.string(),
            body: z.string(),
            from: z.string()
        }),
    }
);

export const sendTelegramSummary = tool(
    async ({ summary, subject, from }) => {
        console.log("📨 TOOL: sendTelegramSummary");
        console.log({ summary });
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: `
📬 New Email Summary

👤 From:
${from}

📝 Subject:
${subject}

📄 Summary:
${summary}
`.trim()
            }),
        });

        const data = await response.json();
        console.log("Telegram response:", data);
    },
    {
        name: "send_telegram",
        description:
            "Send email summary to user on Telegram",
        schema: z.object({
            summary: z.string(),
            subject: z.string(),
            from: z.string()
        }),
    }
);

export const sendUrgentReply = tool(
    async ({ from, subject, body }) => {
        console.log("🚨 TOOL: sendUrgentReply");
        console.log({ from });

        const response = await llm.invoke([
            {
                role: "system",
                content: `You are an automated email response generator.

Your task is to write a professional assurance reply for an URGENT email.

You will be given:
- The original email SUBJECT
- The original email BODY

--------------------------------
OBJECTIVE
--------------------------------
Generate a calm, professional assurance email that:
- Clearly acknowledges the received email
- Confirms the email has been noted on an urgent basis
- Assures the sender that the user will contact them soon
- Sounds human, polite, and trustworthy
- Does NOT promise exact timelines
- Does NOT add any new information not present in the original email

--------------------------------
CONTENT RULES (MANDATORY)
--------------------------------
1. You MUST directly address the purpose of the received email.
2. You MUST acknowledge urgency without repeating alarming language.
3. You MUST clearly state that the user has been informed.
4. You MUST assure a follow-up response soon.
5. Tone must be:
   - Professional
   - Calm
   - Respectful
   - Reassuring
6. Do NOT:
   - Ask questions
   - Include emojis
   - Include disclaimers
   - Include signatures with names unless provided
   - Mention automation or AI
   - Mention internal processes

--------------------------------
EMAIL STRUCTURE
--------------------------------
- Subject:
  - Must begin with "Re:"
  - Must be relevant to the original subject
- Body:
  - 2–4 short paragraphs
  - Clear acknowledgment
  - Clear assurance
  - Professional closing

--------------------------------
OUTPUT FORMAT (ABSOLUTE)
--------------------------------
You MUST output a VALID JSON object.

Allowed keys ONLY:
- "subject"
- "body"

Rules:
- No markdown
- No explanation
- No extra text
- No comments
- No trailing commas
- Proper JSON escaping

--------------------------------
EXAMPLE OUTPUT FORMAT
--------------------------------
{
  "subject": "Re: <email subject>",
  "body": "<email body text>"
}

--------------------------------
Now generate an assurance email reply for the following email.
`,
            },
            {
                role: "user",
                content: `Subject:
${subject}

Body:
${body}`
            },

        ]);

        const rawText = messageContentToStringtwo(response.content);
        let parsed: { subject: string; body: string };
        try {
            parsed = JSON.parse(rawText);
        } catch (err) {
            console.error("❌ Failed to parse email JSON:", rawText);
            throw err;
        }

        await sendEmailReply({ subject: parsed.subject, body: parsed.body, to: from })
        console.log("Tool response : ", response.content)
    },
    {
        name: "send_urgent_reply",
        description:
            "Send assurance reply for urgent email",
        schema: z.object({
            from: z.string(),
            subject: z.string(),
            body: z.string(),
        }),
    }
);

export const classifyCta = tool(
    ({ body }) => {
        console.log("🧾 TOOL: classifyCta");
        console.log({ body });
        ;
    },
    {
        name: "classify_cta",
        description:
            "Classify the cta email into fillformdraft or sendstaticdata",
        schema: z.object({
            body: z.string(),
        }),
    }
);

export const fillFormDraft = tool(
    ({ formLink }) => {
        console.log("🧾 TOOL: fillFormDraft");
        console.log({ formLink });
        return "form_draft_saved";
    },
    {
        name: "fill_form",
        description:
            "Fill Google Form using user data and save as draft",
        schema: z.object({
            formLink: z.string(),
        }),
    }
);

export const sendStaticDocument = tool(
    ({ documentName }) => {
        console.log("📎 TOOL: sendStaticDocument");
        console.log({ documentName });
        return "document_sent";
    },
    {
        name: "send_static_data",
        description:
            "Send requested static document via email",
        schema: z.object({
            documentName: z.string(),
        }),
    }
);

/* ===============================
   EXPORTS
================================ */

export const tools = [
    classifyEmail,
    summarizeEmail,
    sendTelegramSummary,
    sendUrgentReply,
    fillFormDraft,
    sendStaticDocument,
];

export const toolsByName = {
    classify_email: classifyEmail,
    summarize_email: summarizeEmail,
    send_telegram: sendTelegramSummary,
    send_urgent_reply: sendUrgentReply,
    fill_form: fillFormDraft,
    send_static_data: sendStaticDocument,
};

export const llmWithTools = llm.bindTools(tools);
