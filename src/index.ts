import {
    createAgent,
    createNetwork,
    createTool,
    gemini
} from "@inngest/agent-kit";

import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();


const neonServerUrl=`https://server.smithery.ai/neon/mcp?api_key=${process.env.SMITHERY_API_KEY}&profile=international-ladybug-KAgGBh`

console.log("connected to Neon MCP server");

const doneTool = createTool({
    name: "done",
    description: "Call this tool when content creation is finished",
    parameters: z.object({
        title: z.string().describe("Title of the created content"),
        word_count: z.number().describe("How many words in the content"),
        summary: z.string().describe("Brief summary pf what was created"),
    }),
    handler: async ({ title, summary, word_count}, {network}) => {
        console.log("Search Done called");

        network?.state.kv.set("completed", true);
        network?.state.kv.set("title", title);
        network?.state.kv.set("title", word_count);
        network?.state.kv.set("title", summary);
        
        console.log(`Content completed: ${title} (${word_count} words)`);
        console.log(`Summary: ${summary}`);

        return `Content creation finished!
        Title: "${title}"
        Words: ${word_count}
        Summary: ${summary}`;
    },
})