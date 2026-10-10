# TrustExam Pro

Secure exams for hiring and certification: an HR web app, a candidate desktop app (Windows and macOS) and an API. Start with `AGENTS.md`, then `docs/`.

## Setup
Needs Node 22, pnpm 10 (`corepack enable`), Docker, and Rust stable (plus [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for the desktop app).

```sh
pnpm install
pnpm docker:up                       # Postgres, Redis, S3, Mailpit
cp apps/api/.env.example apps/api/.env
pnpm dev                             # web :3000, api :4000/health, desktop UI :1420
pnpm lint && pnpm typecheck && pnpm test && cargo test --workspace
pnpm --filter @trustexam/desktop tauri:dev   # native desktop window
```
