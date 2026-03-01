# Mission Control (Repo Ops)

This folder contains the operating system for this monorepo: mission docs, catalog, security/IP registers, and health scripts.

## Commands

### Dev Doctor (WSL health check)
```bash
mission/dev_doctor.sh
```

### Bootstrap
```bash
mission/bootstrap_wsl.sh
```

### Release smoke
```bash
mission/release.sh milo-ops
```

## Policy
- No secrets committed.
- Track external assets in `mission/IP_REGISTER.md`.
- Prefer PRs to main.
