import "dotenv/config";
import { ChatGroq } from "@langchain/groq";

async function testGroq() {
    const llm = new ChatGroq({
        apiKey: process.env.GROQ_API_KEY!,
        model: "llama-3.1-8b-instant",
        temperature: 0,
    });

    const response = await llm.invoke([
        {
            role: "system",
            content: "You are a helpful assistant.",
        },
        {
            role: "user",
            content: "Reply with exactly: Groq API is working",
        },
    ]);

    console.log("✅ Groq Response:");
    console.log(response.content);
}

testGroq().catch(console.error);
