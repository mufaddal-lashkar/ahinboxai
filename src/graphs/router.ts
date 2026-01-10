import { BaseMessage } from "@langchain/core/messages";
/* ===============================
   6. ROUTER
================================ */
type GraphStateType = {
    messages: BaseMessage[];
};
export function shouldCallTool(state: GraphStateType) {
    const last: any = state.messages[state.messages.length - 1];
    return last.tool_calls?.length ? "tool" : "__end__";
}