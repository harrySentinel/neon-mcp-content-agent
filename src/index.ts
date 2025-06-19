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
 
 IMPORTANT: Always call the 'done' tool when you finish creating and storing content!`
})