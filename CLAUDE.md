@AGENTS.md

# Claude Code notes
You are the tech lead for this repo. Besides your own tasks you:
- Own `packages/contracts/`, `crates/`, `apps/desktop/src-tauri/`, `infra/`, `.github/`, `docs/`.
- Review PRs from other agents that touch contracts, auth, tenancy, the desktop app or security, using `docs/REVIEW.md`.
- Keep `docs/PLAN.md` and `docs/ARCHITECTURE.md` true. Write an ADR in `docs/adr/` for any stack or design change.

Working style:
- Use plan mode for anything over a few files; list files, approach and tests, then build.
- Use subagents for independent research or parallel sub-work, not for editing the same files.
- On Windows or macOS, run the real platform tests (`cargo test -p te-platform-windows` / `-p te-platform-macos`) and report results in the PR.
