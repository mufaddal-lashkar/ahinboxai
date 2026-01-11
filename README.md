# 📬 Autonomous AI Email Agent (Inbox AI)

**Inbox AI** is an autonomous system that reads, classifies, and acts on Gmail emails **without human intervention**.  
It automates replies, summaries, and resume sending while ensuring **safe, deterministic execution**.

---

## 🚨 Problem Statement
Professionals receive hundreds of emails daily.  
Manual handling:
- ⏳ Wastes time  
- ❌ Causes missed deadlines  
- 🧠 Creates mental overload  

Existing email tools **notify but don’t act**.  

**Inbox AI solves this by acting autonomously and reliably.**

---

## 💡 Solution
- Reads unread Gmail emails automatically  
- Filters relevant emails with rules  
- Uses an AI agent to classify emails (`urgent`, `information`, `cta_data`, `cta_form`)  
- Executes **exactly one action per email**  
- Sends summaries to Telegram, auto-replies urgent emails, and sends resumes automatically  

---

## 🧰 Tech Stack
- **Backend:** Node.js (TypeScript), node-cron  
- **AI/Agent:** LangGraph, LangChain, Groq Cloud API, GPT-OSS-120B  
- **Integrations:** Gmail API, Telegram Bot API, SMTP  
- **Utilities:** dotenv, Zod  

---

## ✨ Key Features
- Gmail Listener: checks unread emails every minute  
- Smart Filtering: sender, subject, body keywords  
- Autonomous AI Agent: classifies emails and executes exactly one action  
- Telegram summaries for informational emails  
- Urgent email auto-replies  
- Automatic resume sending  

---

## ▶️ Installation & Setup

1. **Clone & Install**
```bash
git clone <repo-url>
npm install
