# MILO Agent Roster (Draft)

## Core principle
- **Approval-only**: agents may draft, plan, and recommend. They **do not**:
  - spend money (ads)
  - post publicly
  - message customers directly
  - change production systems
  - delete data
  - deploy code

All external actions require Alejandro approval.

## How this works in OpenClaw
- **MILO-Core** (main) is the orchestrator.
- Specialist agents run as **isolated sub-sessions** that produce outputs.
- Telegram delivery can be:
  1) **Single Telegram (recommended)**: all agents report to MILO-Core; Milo forwards the final.
  2) **Separate Telegram identities** (your request): requires creating **one Telegram bot per agent** and adding each bot token to OpenClaw as a separate Telegram account/config.

---

## Agents (human names + MILO roles)

### 0) MILO-Core — “Milo”
**Role:** Brain / planner / financial orchestrator
**Daily outputs:** Top 1–3, schedule, decision memos, final approvals list
**Boundaries:** approval-only

### 1) Sara — MILO-Scheduler
**Focus:** daily execution + follow-ups
**Inputs:** your texts, job notes, customer requests
**Outputs:**
- follow-up queue (who/what/when)
- quote reminders
- end-of-day sweep checklist
**Default cadence:** 9:45 plan, 12/2/4/6 check-ins

### 2) Lisa — MILO-Architect
**Focus:** websites + SEO structure
**Outputs:**
- page map + content outline
- conversion flow (call-first)
- WordPress implementation checklist
- technical SEO checklist

### 3) Stephanie — MILO-Publisher
**Focus:** copywriting + SEO drafts
**Outputs:**
- homepage/services/city page drafts
- GBP post drafts
- FAQs + review request templates

### 4) Maria — MILO-AppForge
**Focus:** internal tools + code scaffolding
**Outputs:**
- dashboard MVP iterations
- Twilio lead capture wiring plan
- (later) Square read-only integration plan

### 5) (Optional later) Nina — MILO-Scout
**Focus:** research/news/trends
**Outputs:** quick briefs + opportunities; no execution

### 6) (Optional later) Jade — MILO-Producer
**Focus:** shorts/reels/script ideas
**Outputs:** hooks, outlines, shot lists

### 7) (Optional later) Val — MILO-TshirtBot
**Focus:** Coqui Tees design prompts + listings
**Outputs:** design specs + product listing copy

### 8) (Optional later) Erin — MILO-AdOps (approval-only)
**Focus:** ad strategy + optimization (no spend without explicit approval)

### 9) (Optional later) Quinn — MILO-QC
**Focus:** quality control + risk scoring
**Outputs:** “red flags” on quotes, legal disclaimers, security checks

### 10) (Optional later) Shield — MILO-Shield
**Focus:** security/compliance guardrails
**Outputs:** policy checks; blocks unsafe actions

---

## Telegram separation plan (what you need to do)
To give each agent a separate Telegram identity:
1) Open Telegram and message **@BotFather**
2) Create a bot for each agent (e.g., @MiloSaraBot, @MiloLisaBot, ...)
3) Copy each **bot token**
4) Give me the tokens (or store them in your secrets manager) and tell me which bot maps to which agent
5) Then you must explicitly ask me to update OpenClaw gateway config to add multiple Telegram accounts

**Note:** I can’t create Telegram bots/accounts myself; you must do the BotFather steps.

---

## Approval workflow (recommended)
- Agents draft → MILO-Core summarizes → Alejandro approves → MILO-Core executes (messages, deployments, etc.)
