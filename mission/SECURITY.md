# SECURITY (Operational Checklist)

## Non-negotiables
- **No secrets in git.** Use `.env` + `.gitignore` + GitHub Secrets.
- Assume anything pasted into chat is burned.
- Prefer least-privilege accounts (separate automation accounts).

## Credential storage
- Local dev: environment variables, not source code.
- CI/deploy: GitHub Actions Secrets.
- Rotate immediately if leaked.

## Email automation (Proton)
- Use **Proton Bridge**; never store Proton account password.
- Store Bridge SMTP creds in local env vars on the host running the mailer.

## Web automation
- Avoid brittle UI automation for core ops.
- If browser automation is required, use an attached relay tab and do not store passwords.

## Customer data
- Collect minimum necessary data.
- Restrict access to job photos/addresses.
- Keep audit logs for edits to jobs/invoices.
