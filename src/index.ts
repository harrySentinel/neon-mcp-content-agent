import {
    createAgent,
    createNetwork,
    createTool,
    gemini
} from "@inngest/agent-kit";
import { createServer } from "@inngest/agent-kit/server";

import dotenv from "dotenv";
import { z } from "zod";

// Loading environment variables
dotenv.config();

const PORT = process.env.PORT || 3010;


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
        network?.state.kv.set("word_count", word_count);
        network?.state.kv.set("summary", summary);
        
        console.log(`Content completed: ${title} (${word_count} words)`);
        console.log(`Summary: ${summary}`);

        return `Content creation finished!
        Title: "${title}"
        Words: ${word_count}
        Summary: ${summary}`;
    },
})

const contentCreatorAgent = createAgent({
    name: "content-creator",
    description:
    "Creates high-quality content by researching topics and storing in database",
    system:`You are a professional content creation assistant.
 
 Your workflow:
 1. 🔍 Research the topic using your web search capabilities to gather current information
 2. 🗄️ Check existing database tables and create new ones if needed (use SQL)
 3. ✍️ Generate high-quality, engaging content based on your research
 4. 💾 Store the content and metadata in the database using SQL
 5. ✅ Call the 'done' tool when finished
 
 Recommended database schema to create:
 CREATE TABLE IF NOT EXISTS content_pieces (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  topic VARCHAR(255),
  content_type VARCHAR(100) DEFAULT 'blog_post',
  word_count INTEGER,
  keywords TEXT[],
  research_summary TEXT,
  created_at TIMESTAMP DEFAULT NOW()
 );
 
 CREATE TABLE IF NOT EXISTS research_sources (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content_pieces(id),
  source_title VARCHAR(255),
  source_summary TEXT,
  relevance_score INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT NOW()
 );
 
 Content Creation Guidelines:
 - Write engaging, informative content
 - Include practical tips and actionable advice
 - Use proper headings and structure
 - Aim for the requested word count
 - Make content SEO-friendly with relevant keywords
 
 IMPORTANT: Always call the 'done' tool when you finish creating and storing content!`,

  model: gemini({
    model: "gemini-2.0-flash-lite",
    apiKey: process.env.GEMINI_API_KEY,
  }),

  tools: [doneTool],

  mcpServers:[
    {
        name:"neon",
        transport:{
            type:"streamable-http",
            url: neonServerUrl,
        },
    },
  ],
});

const contentCreationNetwork = createNetwork({
    name: "content-creation-assistant",
    agents: [contentCreatorAgent],
    router: ({ network }) => {
        const isCompleted = network?.state.kv.get("completed");

        if(!isCompleted) {
            console.log(
                "Task in progress - continuing with content creator agent"
            );
            return contentCreatorAgent;
        }

        console.log("Task completed - stopping execution");
        return undefined; // Stop execution when done
    },

    defaultModel: gemini({
        model:"gemini-2.0-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
    })
})


const server = createServer({
    networks: [contentCreationNetwork],
});

server.listen(PORT, ()=> {
  console.log("🚀 Content Creation Assistant running on http://localhost:3010");
  console.log("🗄️ Connected to Neon PostgreSQL via MCP");
  console.log("");
  console.log("📋 Setup Instructions:");
  console.log(
    "1. Make sure you have SMITHERY_API_KEY and GEMINI_API_KEY in your environment"
  );
  console.log(
    "2. Run: npx inngest-cli@latest dev -u http://localhost:3010/api/inngest"
  );
  console.log("3. Open: http://localhost:8288");
  console.log("");
  console.log("💡 Try this prompt:");
  console.log(
    "'Create a comprehensive blog post about sustainable urban gardening for beginners. Make it 1000 words with practical tips and include SEO keywords.'"
  );
  console.log("");
  console.log("🔍 What the agent will do:");
  console.log("- Research sustainable urban gardening using web search");
  console.log("- Create database tables for content storage");
  console.log("- Generate comprehensive blog post content");
  console.log("- Store content with metadata in Neon database");
  console.log("- Provide completion summary with word count");
})