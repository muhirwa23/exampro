# AGENTS.md: TrustExam Pro

Read this first. It applies to every agent (Claude Code, Codex, Antigravity). Keep it under 12,000 characters; details live in `docs/`.

## Product in one paragraph
TrustExam Pro is a secure exam platform for hiring and certification. HR admins use a **web app** to build exams, invite candidates and review integrity reports. Candidates take every exam in a **desktop app** (Windows and macOS) that locks the computer, shows the exam and collects integrity evidence. AI only **flags** risk with reasons and evidence; a **human reviewer decides**. Full spec: `docs/SPEC.md`. Architecture: `docs/ARCHITECTURE.md`. Current work: `docs/PLAN.md`.

## Repo map and owners
| Path | What | Owner agent |
|---|---|---|
| `packages/contracts/` | OpenAPI spec, event JSON schemas, generated TS and Rust types | Claude Code |
| `apps/api/` | NestJS API, Prisma, PostgreSQL, BullMQ jobs | Codex |
| `workers/` | Python analysis services (later phases) | Codex |
| `apps/web/` | Next.js HR web app | Antigravity |
| `packages/ui/` | Shared React components (web and desktop) | Antigravity |
| `apps/desktop/src/` | React screens of the candidate app | Antigravity |
| `apps/desktop/src-tauri/`, `crates/` | Tauri 2 app, Rust core, per-OS security modules | Claude Code |
| `e2e/` | Playwright tests | Antigravity |
| `infra/`, `.github/`, `docs/` | Docker, CI, docs | Claude Code |

Only edit folders your task names. If you must change a folder owned by another agent, stop and say so in the PR description instead.

## Stack (do not change without an ADR in `docs/adr/`)
- Monorepo: pnpm workspaces + Turborepo. Node 22 LTS. TypeScript strict everywhere.
- API: NestJS, Prisma, PostgreSQL 16, Redis + BullMQ, S3-compatible storage (MinIO locally), Zod for runtime validation at the edges.
- Web: Next.js App Router, Tailwind, shadcn/ui, TanStack Query, generated API client from `packages/contracts`.
- Desktop: Tauri 2, Rust stable, tokio, reqwest (rustls), rusqlite, serde, ring. React screens shared with web via `packages/ui`.
- Tests: Vitest (TS), Jest only if NestJS needs it, `cargo test`, Playwright for e2e.
- Python (later): 3.12, FastAPI, uv, pytest.

## Commands
```
pnpm install
pnpm dev               # web + api + desktop UI with local stack
pnpm docker:up         # postgres, redis, minio, mailpit
pnpm lint && pnpm typecheck && pnpm test
pnpm contracts:gen     # regenerate TS + Rust types from packages/contracts
cargo test --workspace # Rust; uses the mock platform on Linux
pnpm e2e               # Playwright
```
A task is not done until `pnpm lint`, `pnpm typecheck`, `pnpm test` and (if Rust changed) `cargo clippy --workspace -- -D warnings` and `cargo test --workspace` pass.

## How to work
1. Read the task, `docs/PLAN.md`, and the spec section it names. Do not read the whole repo.
2. For tasks bigger than a few files, write a short plan first (files to touch, approach, tests) and wait for approval if your tool supports it.
3. Contracts first: if the API or an event shape changes, update `packages/contracts/` and run `pnpm contracts:gen` before code that uses it. Never hand-write types that are generated.
4. Write tests with the code. New endpoint: unit test + one integration test against the real DB. New screen: component test + Playwright happy path. New Rust check: unit test against the mock platform.
5. Run the "Done when" commands from the task. Fix failures; do not skip, weaken or delete tests.
6. One task = one branch = one PR. Branch: `<agent>/<short-task>` (e.g. `codex/exam-crud`). Conventional commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`).
7. PR description: what changed, how to test, screenshots for UI, anything left undone, and the `docs/PLAN.md` item it closes.
8. Tick the item in `docs/PLAN.md` in the same PR.
9. If something in the spec is unclear, choose the simplest option that fits the spec, note it under "Assumptions" in the PR, and continue.

## Code rules
- Small files and functions. No dead code, no commented-out code, no TODOs without a PLAN.md item.
- Validate every external input (HTTP body, query, desktop IPC, uploaded file) with Zod (TS) or serde + explicit checks (Rust).
- Every DB query is scoped by `organizationId`. Multi-tenant leaks are the worst bug we can ship. Add a test that another org cannot read the data.
- Every state change by a person (create exam, invite, decide on a report, delete data) writes an `AuditLog` row.
- Errors: typed error codes from `packages/contracts/errors`. No stack traces to clients.
- Logs: structured JSON, never log answers, images, tokens, ID documents or emails in full.
- Money, time: store UTC timestamps, durations in seconds, money in minor units.
- Accessibility: every web and desktop screen is keyboard usable with labels; WCAG 2.2 AA colors.
- i18n: all user-facing text through the i18n helper (English first; French and Swahili later).

## Security and privacy rules (non-negotiable)
- No kernel drivers, keyboard hooks, code injection, packers or obfuscation in the desktop app.
- The desktop app sends only: answers, integrity **events**, snapshots and short clips around events, and denylist **matches** (never a full process list, file names, browsing history or keystrokes).
- No remote command channel into the desktop app. The server can only send per-exam rules (signed JSON).
- Secrets only via env vars; `.env.example` lists them. Never commit secrets or real candidate data.
- Passwords: argon2id. Sessions: httpOnly, Secure, SameSite=Lax cookies. Candidate app: short-lived tokens bound to a device key.
- Biometric face **matching** is off by default and needs explicit consent plus a non-biometric alternative (human compares ID photo).
- Never add: emotion/stress detection, AI-writing detection in the risk score, or any automatic rejection. Risk score is advisory; only a reviewer can reject.
- Media is encrypted at rest, served via short-lived signed URLs, deleted by retention jobs.

## Design rules (web and desktop UI)
- Calm, trustworthy, plain language. Candidate screens explain what is checked and why before checking it.
- Use `packages/ui` components; add new shared ones there, not inside an app.
- Every list has empty, loading and error states.

## Definition of done
Code + tests + passing commands + updated PLAN.md + PR description with how to test. UI tasks also need screenshots or a browser recording. Rust platform tasks also list what was tested on a real Windows or Mac machine, or say "needs human test on <OS>".

## Code Review
When reviewing a PR (Codex code review or any agent), use `docs/REVIEW.md`. Focus on tenancy scoping, input validation, audit logging, candidate data privacy, desktop app data minimisation and test quality. Ignore formatting; CI handles it.
