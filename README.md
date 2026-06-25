# ArmorIQ — Guarded AI Agent with MCP Support

> SWE Intern Assignment — A full-stack AI agent security platform with real-time policy enforcement via the Model Context Protocol (MCP).

---

## Overview

An AI agent that communicates with MCP servers to execute tools, with a policy/guardrails layer sitting between the agent and those servers — deciding in real time what the agent is and isn't allowed to do.

---

## Architecture

```
MCP Assignment/
├── backend/           ← NestJS (API + Agent + Policy Engine)
├── frontend/          ← Next.js (Chat UI + Admin Dashboard)
└── notes-mcp-server/  ← Custom MCP server (5 notes tools)
```

```
User (Chat)
    ↓
Agent Service (NestJS)
    ↓
Policy Engine ← reads guardrail_rules from DB
    ↓
MCP Client
    ↓
MCP Servers (notes-mcp-server + context7)
    ↓
Tool Result → back to LLM → response to user
```

---

## Features

### AI Agent
- Powered by Groq (Llama 3) with full tool-use loop
- Connects to MCP servers via stdio (custom) and SSE (remote)
- Live tool discovery — no hardcoded tool lists

### Policy / Guardrails Engine
- **BLOCK** — permanently deny specific tools
- **APPROVAL** — require human approval before execution
- **INPUT_VALIDATION** — allow tool only if inputs match a condition
- **TOKEN_BUDGET** — block tool calls once conversation exceeds token limit
- In-memory rule caching with instant invalidation via WebSocket

### Admin Dashboard
- Password-protected `/admin` route
- **Guardrails tab** — set policy per tool (Allow / Block / Needs Approval)
- **Logs tab** — every tool call attempt with status
- **Approvals tab** — approve or deny pending requests
- Rule changes propagate to running agent instantly without restart

### Custom MCP Server
- Exposes 5 tools: `create_note`, `list_notes`, `read_note`, `edit_note`, `delete_note`
- Notes persisted in `notes.json`
- Plug-and-play — no agent-side code changes needed to add it

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | NestJS (TypeScript) |
| Frontend | Next.js + Tailwind CSS |
| Database | PostgreSQL + Prisma ORM |
| LLM | Groq (Llama 3.3 70B) |
| MCP SDK | @modelcontextprotocol/sdk |
| Real-time | Socket.IO |
| Custom MCP | Node.js + TypeScript + Zod |

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL running locally
- Groq API key (free at console.groq.com)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/mcp-assignment.git
cd "MCP Assignment"
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# fill in your values
npx prisma migrate dev
npx prisma generate
npm run start:dev
```

### 3. Custom MCP Server

```bash
cd notes-mcp-server
npm install
npm run build
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/armoriq"
GROQ_API_KEY="gsk_..."
GROQ_MODEL="llama-3.3-70b-versatile"
ADMIN_PASSWORD="armoriq123"
PORT=3001
```

---

## API Endpoints

### Agent
| Method | Endpoint | Description |
|---|---|---|
| POST | `/agent/chat` | Send message to AI agent |

### Rules
| Method | Endpoint | Description |
|---|---|---|
| GET | `/rules` | List all rules |
| POST | `/rules` | Create a rule |
| PATCH | `/rules/:id` | Update a rule |
| PATCH | `/rules/:id/toggle` | Toggle rule on/off |
| DELETE | `/rules/:id` | Delete a rule |

### Logs & Approvals
| Method | Endpoint | Description |
|---|---|---|
| GET | `/logs` | List tool call logs |
| GET | `/approvals` | List pending approvals |
| PATCH | `/approvals/:id/approve` | Approve a tool call |
| PATCH | `/approvals/:id/reject` | Reject a tool call |

---

## Guardrail Rule Examples

```json
{ "toolName": "delete_note", "ruleType": "BLOCK", "isActive": true }
{ "toolName": "create_note", "ruleType": "APPROVAL", "isActive": true }
{ "toolName": "read_file", "ruleType": "INPUT_VALIDATION", "condition": "path:/sandbox/", "isActive": true }
{ "toolName": "*", "ruleType": "TOKEN_BUDGET", "condition": "10000", "isActive": true }
```
