import { BaseMessage } from "@langchain/core/messages";

export const GraphState = {
    messages: {
        value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
        default: (): BaseMessage[] => [],
    },
};