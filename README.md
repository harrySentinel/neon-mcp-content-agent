# content-agent-mcp

This project is an experimental AI-powered content generation pipeline built with:

- **Neon MCP Server** – for implementing the Model Context Protocol (MCP)
- **Inngest AgentKit** – to orchestrate agent functions as serverless events
- **Gemini API** – as the LLM for generating text-based content
- **Database integration** – to store generated content for later use

The goal is to explore agent-based architectures for generating structured content, such as blog posts, summaries, or other text formats, with contextual memory and task orchestration.

---

## 🧩 Tech Stack

- **MCP (Model Context Protocol)** via [Neon MCP Server](https://github.com/neonsecret/mcp-server)
- **Inngest AgentKit** for event-driven agent workflows
- **Gemini API** (Google) as the large language model
- **Database** (can be PostgreSQL, Supabase, MongoDB, etc.)
- Built with **TypeScript**

---

## 🧠 Features

- Set up a local MCP server for managing context, tools, and agent state
- Use Inngest to trigger and manage content creation events
- Call Gemini API to generate relevant content
- Store generated content to a database for further use/display

---

## 🚀 Setup Instructions

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/content-agent-mcp
cd content-agent-mcp
