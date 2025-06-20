import {
    createAgent,
    createNetwork,
    createTool,
    gemini
} from "@inngest/agent-kit";
import { createServer } from "@inngest/agent-kit/server";
import { Client } from 'pg';
import dotenv from "dotenv";
import { z } from "zod";

// Loading environment variables
dotenv.config();

const PORT = process.env.PORT || 3010;

// Verify environment variables
if (!process.env.SMITHERY_API_KEY) {
    console.error("❌ SMITHERY_API_KEY is required!");
    process.exit(1);
}

if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is required!");
    process.exit(1);
}

if (!process.env.NEON_DATABASE_URL) {
    console.error("❌ NEON_DATABASE_URL is required!");
    console.error("   Get it from: https://console.neon.tech/app/projects");
    console.error("   Format: postgresql://user:password@host/database?sslmode=require");
    process.exit(1);
}

const neonServerUrl = `https://server.smithery.ai/neon/mcp?api_key=${process.env.SMITHERY_API_KEY}&profile=international-ladybug-KAgGBh`;

console.log("🔗 Connected to Neon MCP server");

const doneTool = createTool({
    name: "done",
    description: "Call this tool when content creation is finished",
    parameters: z.object({
        title: z.string().describe("Title of the created content"),
        word_count: z.number().describe("How many words in the content"),
        summary: z.string().describe("Brief summary of what was created"),
    }),
    handler: async ({ title, summary, word_count }, { network }) => {
        console.log("✅ Content creation completed!");

        network?.state.kv.set("completed", true);
        network?.state.kv.set("title", title);
        network?.state.kv.set("word_count", word_count);
        network?.state.kv.set("summary", summary);
        
        console.log(`📝 Title: ${title}`);
        console.log(`📊 Word Count: ${word_count}`);
        console.log(`📋 Summary: ${summary}`);

        return `Content creation finished!
Title: "${title}"
Words: ${word_count}
Summary: ${summary}`;
    },
});

// WORKING SQL tool for Neon database operations
const runSQLTool = createTool({
    name: "run_sql",
    description: "Executes SQL statements in the Neon PostgreSQL database. Use this to create tables, insert data, and query the database.",
    parameters: z.object({
        sql: z.string().describe("The SQL command to execute (CREATE TABLE, INSERT, SELECT, etc.)"),
    }),
    handler: async ({ sql }) => {
        const client = new Client({
            connectionString: process.env.NEON_DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {
            console.log("🗄️ Executing SQL:", sql.substring(0, 100) + "...");
            
            await client.connect();
            console.log("🔌 Connected to Neon database");
            
            const result = await client.query(sql);
            console.log("✅ SQL executed successfully");
            
            // Return different data based on query type
            if (sql.trim().toLowerCase().startsWith('select')) {
                return {
                    success: true,
                    rows: result.rows,
                    rowCount: result.rowCount
                };
            } else if (sql.trim().toLowerCase().startsWith('insert')) {
                return {
                    success: true,
                    message: `Inserted ${result.rowCount} row(s)`,
                    insertedId: result.rows[0]?.id || null
                };
            } else {
                return {
                    success: true,
                    message: `Command executed successfully. Affected ${result.rowCount || 0} row(s)`,
                    command: result.command
                };
            }

        } catch (error) {
            console.error("❌ SQL execution error:", error.message);
            return { 
                success: false,
                error: error.message,
                suggestion: "Check your SQL syntax and database connection"
            };
        } finally {
            try {
                await client.end();
                console.log("🔌 Database connection closed");
            } catch (closeError) {
                console.error("Error closing connection:", closeError.message);
            }
        }
    },
});

// Tool to test database connection
const testConnectionTool = createTool({
    name: "test_connection",
    description: "Test the database connection to ensure it's working",
    parameters: z.object({}),
    handler: async () => {
        const client = new Client({
            connectionString: process.env.NEON_DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });

        try {
            await client.connect();
            const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
            await client.end();
            
            return {
                success: true,
                message: "Database connection successful!",
                server_time: result.rows[0].current_time,
                postgres_version: result.rows[0].postgres_version.split(' ')[0]
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },
});

const contentCreatorAgent = createAgent({
    name: "content-creator",
    description: "Creates high-quality content by researching topics and storing in database",
    system: `You are a professional content creation assistant with database capabilities.

Your workflow:
1. 🔍 First, test the database connection using test_connection tool
2. 🗄️ Use run_sql tool to create the required database schema (tables)
3. 🔍 Research the topic using web search to gather current information  
4. ✍️ Generate high-quality, engaging content based on your research
5. 💾 Use run_sql tool to store the content and metadata in the database
6. ✅ Call the 'done' tool when finished

REQUIRED DATABASE SCHEMA - Create these tables first:

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
- Write engaging, informative content with proper structure
- Include practical tips and actionable advice
- Use proper headings (## for main sections, ### for subsections)
- Aim for the requested word count
- Make content SEO-friendly with relevant keywords
- Always store your content in the database before calling 'done'

IMPORTANT WORKFLOW:
1. First run test_connection to verify database works
2. Create the database schema using the CREATE TABLE statements above
3. Research and create your content
4. Insert the content into content_pieces table
5. Call the 'done' tool with accurate word count and summary

Example SQL for inserting content:
INSERT INTO content_pieces (title, content, topic, content_type, word_count, keywords, research_summary)
VALUES ('Your Title', 'Your content here...', 'topic', 'blog_post', 1000, ARRAY['keyword1', 'keyword2'], 'Research summary')
RETURNING id;

Always check the success field in SQL responses. If success is false, fix the error before proceeding.`,

    model: gemini({
        model: "gemini-2.0-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
    }),

    tools: [doneTool, runSQLTool, testConnectionTool],

    mcpServers: [
        {
            name: "neon",
            transport: {
                type: "streamable-http",
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

        if (!isCompleted) {
            console.log("🔄 Task in progress - continuing with content creator agent");
            return contentCreatorAgent;
        }

        console.log("🎉 Task completed - stopping execution");
        return undefined; // Stop execution when done
    },

    defaultModel: gemini({
        model: "gemini-2.0-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
    })
});

const server = createServer({
    networks: [contentCreationNetwork],
});

server.listen(PORT, () => {
    console.log("");
    console.log("🚀 Content Creation Assistant running on http://localhost:3010");
    console.log("🗄️ Connected to Neon PostgreSQL via proper database connection");
    console.log("");
    console.log("📋 Setup Instructions:");
    console.log("1. Add NEON_DATABASE_URL to your .env file");
    console.log("2. Run: npm install pg");
    console.log("3. Run: npx inngest-cli@latest dev -u http://localhost:3010/api/inngest");
    console.log("4. Open: http://localhost:8288");
    console.log("");
    console.log("💡 Try this prompt:");
    console.log("'Create a comprehensive blog post about sustainable urban gardening for beginners. Make it 1000 words with practical tips and include SEO keywords.'");
    console.log("");
    console.log("🔍 What the agent will do:");
    console.log("- Test database connection");
    console.log("- Create required database tables");
    console.log("- Research sustainable urban gardening using web search");
    console.log("- Generate comprehensive blog post content");
    console.log("- Store content with metadata in Neon database");
    console.log("- Provide completion summary with word count");
    console.log("");
    console.log("⚠️  IMPORTANT: Update your .env file with:");
    console.log("NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require");
});