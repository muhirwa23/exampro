# Architecture

## Repo layout
```
trustexam-pro/
  AGENTS.md  CLAUDE.md  .agents/rules/
  apps/
    api/                 NestJS (modules: auth, orgs, exams, invitations, attempts, events, evidence, risk, reviews, notifications, retention, audit)
    web/                 Next.js HR app (+ candidate result/appeal pages under /r/[token])
    desktop/
      src/               React candidate screens (Vite, inside Tauri)
      src/lib/native.ts  typed wrappers for Tauri commands (+ mock for browser dev)
      src-tauri/         Tauri 2 shell: commands, windows, updater, permissions
  crates/
    te-core/             session, device key, local SQLite store, sync, heartbeats, event queue, uploader
    te-rules/            signed rules download + verification + evaluation
    te-platform/         trait SecurityPlatform + shared types
    te-platform-windows/ secure desktop lockdown, window affinity scan, WGC capture, devices
    te-platform-macos/   kiosk presentation options, CGWindowList scan, ScreenCaptureKit, IOKit
    te-platform-mock/    scripted fake for Linux CI and UI development
  packages/
    contracts/           openapi.yaml, events/*.schema.json, errors.ts, generated/ (ts + rust)
    ui/                  shared React components
    config/              eslint, tsconfig, tailwind presets
  workers/               Python services (phase 9)
  e2e/                   Playwright
  infra/                 docker-compose.yml, Dockerfiles, deploy notes
  docs/                  SPEC, ARCHITECTURE, PLAN, REVIEW, adr/
```

## Contracts
- `packages/contracts/openapi.yaml` is the single source of truth for HTTP. NestJS controllers must match it (checked in CI by `pnpm contracts:check`, which diffs the spec generated from Nest decorators against the file).
- TS client: `openapi-typescript` + `openapi-fetch` into `generated/ts`.
- Rust types: `typify` from the JSON schemas and `progenitor` (or hand-written reqwest calls using typify types) into `generated/rust` as crate `te-contracts`.
- Events (`events/*.schema.json`) are shared by desktop (Rust and webview) and API.

## Desktop platform interface
```rust
pub trait SecurityPlatform: Send + Sync {
    fn os_info(&self) -> OsInfo;
    fn enter_lockdown(&self, cfg: &LockdownConfig) -> Result<LockdownGuard>; // guard exits on drop
    fn scan(&self, rules: &Rules) -> Result<ScanReport>;    // processes, windows, displays, cameras, vm, usb
    fn watch(&self, rules: &Rules, tx: EventSender) -> Result<WatchHandle>; // live change events
    fn capture_screen(&self, max_px: u32) -> Result<Jpeg>;
    fn close_app(&self, pid: u32) -> Result<()>;            // only apps listed in ScanReport
}
```
`te-core` only depends on the trait. `src-tauri` picks the implementation with `cfg(target_os)`; the `mock` feature forces `te-platform-mock` for Linux and UI work.

Lockdown approach: Windows runs the exam window on a separate desktop (`CreateDesktop`/`SwitchDesktop`, as Safe Exam Browser does) and watches for focus changes; macOS uses `NSApplication` presentation options (hide Dock and menu bar, disable process switching, force quit, session termination) with a full-screen window. No hooks, drivers or injection.

## Data flow during an exam
1. App downloads signed rules, runs `scan`, blocks or nudges.
2. During exam: answers → SQLite → sync batches → `POST /attempts/{id}/answers`. Events → queue → `POST /attempts/{id}/events`. Evidence → `POST /attempts/{id}/evidence/presign` → direct PUT to S3.
3. Heartbeats every 15 s (signed). Server marks missed heartbeats.
4. Submit → API enqueues `score-attempt` → `assess-risk` → `build-report` jobs (BullMQ) → notify org.

## Environments
- Local: `pnpm docker:up` (Postgres, Redis, SeaweedFS as local S3, Mailpit). Seed script creates a demo org, admin `admin@demo.test`, one exam, invites with fixed codes.
- Staging and production: containers for api and web (Fly.io, Render or a VPS with Docker; pick per data region), managed Postgres and S3-compatible storage. Desktop update feed served from storage behind a CDN.

## CI (GitHub Actions)
- `ci.yml` on every PR: install, lint, typecheck, unit tests, API integration tests with Postgres service, `contracts:check`, `cargo clippy` + `cargo test` on ubuntu (mock), Playwright on web.
- `desktop.yml`: build Tauri on `windows-latest` and `macos-latest`, run platform crate tests; signing and notarization only on tags (secrets added by the human).
