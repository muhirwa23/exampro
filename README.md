# TrustExam Pro

TrustExam Pro is a secure assessment platform for hiring and certification. HR teams will use a web app; candidates will use a desktop app. Integrity signals are advisory and require human review. See [the product specification](docs/SPEC.md), [architecture](docs/ARCHITECTURE.md), and [build plan](docs/PLAN.md).

## Prerequisites

- Node.js 22 LTS
- pnpm 12.6.0 (Corepack can select the version pinned in `package.json`)
- Rust stable and the operating-system prerequisites documented by [Tauri](https://v2.tauri.app/start/prerequisites/) to build the native desktop shell

## Getting started

```sh
pnpm install
pnpm dev
```

The development command starts the HR web shell (port 3000), API shell (port 3001), and candidate UI preview (port 1420). The native candidate app can be started with `pnpm --filter @trustexam/desktop-ui dev:native` after the Rust/Tauri prerequisites are installed.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

The current repository is the P0-01 monorepo foundation: these apps and crates are buildable shells, not completed exam, identity, monitoring, or review workflows. Later phases in `docs/PLAN.md` add those capabilities.
