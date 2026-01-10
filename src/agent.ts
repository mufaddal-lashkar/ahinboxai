import "dotenv/config";
import { GraphState } from "./graphs/state.ts";
import { llmWithTools, toolsByName } from "./graphs/tools.ts";
import { shouldCallTool } from "./graphs/router.ts";
import { StateGraph } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

/* ===============================
   STATE TYPE
================================ */
type GraphStateType = {
    messages: BaseMessage[];
};

/* ===============================
   TOOL NAME TYPE (IMPORTANT)
================================ */
type ToolName = keyof typeof toolsByName;

/* ===============================
   AGENT NODE
================================ */
async function agent(
    state: GraphStateType
): Promise<Partial<GraphStateType>> {
    const response = await llmWithTools.invoke(state.messages);
    return { messages: [response] };
}

/* ===============================
   TOOL EXECUTOR NODE
================================ */
async function toolExecutor(
    state: GraphStateType
): Promise<Partial<GraphStateType>> {
    const lastMessage = state.messages[state.messages.length - 1] as any;

    if (!lastMessage?.tool_calls?.length) {
        return { messages: [] };
    }

    const toolCall = lastMessage.tool_calls[0];

    const toolName = toolCall.name as ToolName;
    const tool = toolsByName[toolName] as any;

    const result = await tool.invoke(toolCall.args);
    return {
        messages: [
            {
                role: "tool",
                tool_call_id: toolCall.id,
                content: String(result),
            } as any,
        ],
    };
}

/* ===============================
   BUILD GRAPH
================================ */
const graph = new StateGraph<GraphStateType>({ channels: GraphState })
    .addNode("agent", agent)
    .addNode("tool", toolExecutor)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldCallTool)
    .addEdge("tool", "agent")
    .compile();

/* ===============================
   RUN MULTI-EMAIL TEST
================================ */
async function run() {
    const SYSTEM_PROMPT = `
You are a deterministic execution agent.

YOU MUST FOLLOW THESE RULES EXACTLY.

--------------------------------
TOOL CALL RULES (ABSOLUTE)
--------------------------------

1. You MUST call the tool "classify_email" EXACTLY ONCE.
2. You are FORBIDDEN from calling "classify_email" again under ANY circumstance.
3. After receiving the result of "classify_email":
   - If the result is "informational", you MUST call "summary_generated".
   - If the result is "cta", you MUST call "",
   - If the result is "urgent", you must call "send_urgent_reply".
4. You MUST NOT repeat, retry, loop, or re-evaluate.
5. You MUST NOT think or plan again after the tool result.

--------------------------------
EXECUTION FLOW (FINAL)
--------------------------------

START
→ Call classify_email (ONCE)
→ Read tool output
→ If informational → Call summary_generated
→ Else → STOP

This flow is FINAL and IRREVERSIBLE.
`;


    const emails = [
        // {
        //     subject: "Send Resume",
        //     body: "Please send your resume and portfolio.",
        //     from: "hr@company.com",
        // },
        // {
        //     subject: "Weekly Newsletter",
        //     body: "Here is your weekly tech roundup Newsletter.",
        //     from: "news@site.com",
        // },
        {
            subject: "Final Reminder",
            body: "Pay ur fees before the deadline which is 20/01/26.",
            from: "joeljsamuel5@gmail.com",
        },
    ];

    for (const email of emails) {
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

run();
