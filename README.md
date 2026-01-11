# 📬 Autonomous AI Email Agent (Inbox AI)

**Inbox AI** is a true autonomous email decision-making system that reads, understands, classifies, and acts on emails **without human intervention**.

Unlike traditional email clients that only notify users, Inbox AI **executes actions deterministically** using an agentic workflow powered by LangGraph and LLMs.

---

## 🚨 Problem Statement

Modern professionals receive hundreds of emails daily — job updates, deadlines, document requests, urgent messages, and informational content.

Manually handling emails:
- ⏳ Wastes time
- ❌ Causes missed deadlines
- 💤 Leads to delayed responses
- 🧠 Creates mental overload

Existing email tools do not think or act autonomously.  
They notify — but they **don’t decide**.

**Problem:**  
There is no system that can autonomously read emails, understand intent, decide actions, and execute responses without human involvement.

---

## 💡 Proposed Solution

Inbox AI is an **Autonomous AI Email Agent** that:

- Reads unread Gmail emails automatically
- Filters relevant emails using rules
- Uses an AI agent to classify intent
- Executes exactly one deterministic action
- Works continuously in the background via cron jobs

No dashboards.  
No approvals.  
No human-in-the-loop.

---

## 🧠 Core Strategy — Agentic Design

Inbox AI follows a strict deterministic agent flow:

1. Fetch unread emails
2. Apply rule-based filtering
3. Pass email to AI agent
4. Agent classifies the email **once**
5. Exactly **one action** is executed
6. Execution stops immediately

### Guarantees
- ✅ Predictable behavior
- ✅ Zero hallucinated actions
- ✅ Safe automation
- ❌ No loops, retries, or re-evaluation

---

## 🧰 Tech Stack

### Backend & Runtime
- Node.js (TypeScript)
- ES Modules
- node-cron

### AI & Agent Framework
- LangGraph
- LangChain
- Groq Cloud API
- `openai/gpt-oss-120b`

### APIs & Integrations
- Gmail API (read / modify emails)
- Telegram Bot API
- SMTP / Email utilities

### Utilities
- Zod
- dotenv

---

## ✨ Key Features

### 📥 Gmail Listener
- Reads unread emails every minute
- Automatically marks processed emails as read

### 🔍 Smart Filtering
- Filter by sender, subject keywords, and body keywords
- Prevents unnecessary AI calls

### 🤖 Autonomous AI Agent
Classifies emails into:
- `information`
- `urgent`
- `cta_data`
- `cta_form`

### ⚙️ Deterministic Decision Engine
- One classification
- One action
- No retries or loops

### 📲 Telegram Summaries
- 1–2 sentence summaries for informational emails
- Delivered directly to Telegram

### 🚨 Urgent Email Auto-Reply
- Sends professional assurance replies
- Acknowledges urgency
- No false promises

### 📄 Automatic Resume Sending
- Detects resume requests
- Sends resume attachment automatically

---

## 🚫 AI Agent Role (Very Important)

The AI agent is **NOT a chatbot**.

It is a constrained decision executor:
- Must call `classify_email` once
- Must execute exactly one action
- Must stop immediately after action
- Cannot self-correct or rethink

### Why This Matters
- Prevents runaway automation
- Ensures reliability
- Makes the system production-safe

---

## 🔁 Agent Workflow

1. **Cron Trigger**  
   Runs every 1 minute

2. **Gmail Fetch**  
   Reads last 10 unread emails and extracts:
   - From
   - Subject
   - Body snippet

3. **Filter Layer**  
   Only relevant emails proceed

4. **LangGraph Execution**
