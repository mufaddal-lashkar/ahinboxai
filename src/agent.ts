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
export const graph = new StateGraph<GraphStateType>({ channels: GraphState })
    .addNode("agent", agent)
    .addNode("tool", toolExecutor)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldCallTool)
    .addEdge("tool", "agent")
    .compile();
