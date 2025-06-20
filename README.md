# ➣ AI Content Creation Assistant

An intelligent content creation system that combines AI research, content generation, and database storage into one seamless workflow. Built with Inngest Agent Kit, Google Gemini AI, and Neon PostgreSQL.

![Content-creation-flow](https://github.com/user-attachments/assets/260b69b9-741f-486d-8d39-bd77429c17e4)
![invoke function](https://github.com/user-attachments/assets/89c19423-a391-420c-b072-10705f6239a8)
![neon db img](https://github.com/user-attachments/assets/6c568c7d-adff-4654-856a-bda726ae6dab)

## ✨ Features

- 🧠 **AI-Powered Research**: Automatically researches topics using web search and MCP servers
- ✍️ **Smart Content Generation**: Creates high-quality, SEO-friendly blog posts with proper structure
- 🗄️ **Database Integration**: Stores content, metadata, and research sources in Neon PostgreSQL
- 📊 **Analytics**: Tracks word counts, keywords, and content performance
- 🔄 **Automated Workflow**: End-to-end content creation with minimal human intervention
- 🌐 **Web Search Integration**: Gathers current information for accurate, up-to-date content
- 📝 **Structured Output**: Proper headings, sections, and formatting

## 🏗️ Architecture

```
User Prompt → AI Agent → Web Research → Content Generation → Database Storage → Completion Report
```

### Core Components

- **Inngest Agent Kit**: Orchestrates the AI workflow
- **Google Gemini 2.0**: Powers the content creation and research
- **Neon PostgreSQL**: Stores all content and metadata
- **MCP Servers**: Provides external data integration
- **Custom Tools**: SQL execution, connection testing, and completion tracking

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Neon PostgreSQL account
- Google Gemini API key
- Smithery API key (for MCP integration)

## ➣ Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/ai-content-creator.git
cd ai-content-creator
npm install
```

### 2. Install Required Dependencies

```bash
npm install pg @inngest/agent-kit dotenv zod
```

### 3. Environment Setup

Create a `.env` file:

```env
# Required API Keys
SMITHERY_API_KEY=your_smithery_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration
NEON_DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# Server Configuration
PORT=3010
```

### 4. Get Your API Keys

**Neon Database URL:**
- Sign up at [Neon Console](https://console.neon.tech)
- Create a new project
- Copy the connection string from your dashboard

**Google Gemini API:**
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy the key to your `.env` file

**Smithery API:**
- Sign up at [Smithery.ai](https://smithery.ai)
- Generate an API key for MCP integration

### 5. Start the Application

```bash
# Start the content creation server
npm start

# In another terminal, start Inngest dev server
npx inngest-cli@latest dev -u http://localhost:3010/api/inngest
```

### 6. Access the Interface

Open your browser to:
- **Inngest Dashboard**: http://localhost:8288
- **API Server**: http://localhost:3010

## ➣ Usage Examples

### Basic Content Creation

```
Create a comprehensive blog post about sustainable urban gardening for beginners. 
Make it 1000 words with practical tips and include SEO keywords.
```

### Technical Content

```
Write a detailed guide about setting up a home automation system with Raspberry Pi. 
Include step-by-step instructions, required components, and troubleshooting tips. 
Target 1500 words.
```

### Marketing Content

```
Create an engaging article about the benefits of remote work for small businesses. 
Include statistics, case studies, and actionable advice. Make it SEO-optimized for 
'remote work benefits' keyword.
```

## ➣ How It Works

### 1. **Research Phase**
- AI agent receives your content request
- Searches the web for current, relevant information
- Gathers data from multiple sources via MCP servers

### 2. **Database Setup**
- Creates required database tables automatically
- Sets up proper schema for content and research storage

### 3. **Content Generation**
- Analyzes research data
- Generates structured, engaging content
- Optimizes for SEO and readability
- Includes proper headings and sections

### 4. **Storage & Completion**
- Stores content in Neon PostgreSQL
- Saves metadata (word count, keywords, topics)
- Links research sources to content
- Provides completion summary

## 📊 Database Schema

### Content Pieces Table
```sql
CREATE TABLE content_pieces (
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
```

### Research Sources Table
```sql
CREATE TABLE research_sources (
    id SERIAL PRIMARY KEY,
    content_id INTEGER REFERENCES content_pieces(id),
    source_title VARCHAR(255),
    source_summary TEXT,
    relevance_score INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🛠️ Configuration

### Agent Configuration

The AI agent can be customized by modifying the system prompt in the code:

```javascript
const contentCreatorAgent = createAgent({
    name: "content-creator",
    system: `Your custom instructions here...`,
    model: gemini({
        model: "gemini-2.0-flash-lite",
        apiKey: process.env.GEMINI_API_KEY,
    }),
    tools: [doneTool, runSQLTool, testConnectionTool],
});
```

### Custom Tools

You can add custom tools by extending the `createTool` function:

```javascript
const customTool = createTool({
    name: "custom_tool",
    description: "Your custom tool description",
    parameters: z.object({
        // Define your parameters
    }),
    handler: async (params) => {
        // Your custom logic
    },
});
```

## 🔍 Monitoring & Debugging

### Logs

The application provides detailed logging:

```
🔗 Connected to Neon MCP server
🗄️ Executing SQL: CREATE TABLE IF NOT EXISTS content_pieces...
🔌 Connected to Neon database
✅ SQL executed successfully
🔌 Database connection closed
📝 Title: Sustainable Urban Gardening Guide
📊 Word Count: 1247
📋 Summary: Comprehensive guide covering container gardening, soil selection, and plant care
```

### Error Handling

Common issues and solutions:

**Database Connection Errors:**
- Verify `NEON_DATABASE_URL` is correct
- Check network connectivity
- Ensure SSL configuration is proper

**API Key Issues:**
- Double-check all API keys in `.env`
- Verify key permissions and quotas
- Test individual API endpoints

## 🚦 API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/api/inngest` | POST | Inngest webhook endpoint |
| `/health` | GET | Health check endpoint |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- All API keys are stored in environment variables
- Database connections use SSL encryption
- Input validation with Zod schemas
- Proper error handling to prevent data leaks

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ➣ Acknowledgments

- [Inngest](https://inngest.com) for the amazing agent orchestration framework
- [Neon](https://neon.tech) for the excellent PostgreSQL platform
- [Google](https://ai.google.dev) for the powerful Gemini AI model
- [Smithery](https://smithery.ai) for MCP server integration

---

⭐ **Star this repository if you find it helpful!**

Built with ❤️ by [Aditya Srivastava](https://github.com/harrySentinel)
