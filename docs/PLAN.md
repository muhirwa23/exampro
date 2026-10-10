# Build plan tracker

Agents tick items in the PR that finishes them. IDs are stable; prompts reference them. Owner: CC = Claude Code, CX = Codex, AG = Antigravity, ME = human.

## Phase 0: Bootstrap
- [ ] P0-01 CC Monorepo (pnpm, Turborepo, shared config), apps and crates skeletons that build
- [ ] P0-02 CC Local stack: docker-compose (Postgres, Redis, MinIO, Mailpit), `.env.example`, seed script stub
- [ ] P0-03 CC Contracts package: openapi.yaml skeleton, events schemas from SPEC §5, codegen for TS and Rust, `contracts:check`
- [ ] P0-04 CC CI: ci.yml and desktop.yml (build only)
- [ ] P0-05 ME Turn on Codex code review; add branch protection (CI green + 1 review)

## Phase 1: Backend core
- [ ] P1-01 CX Prisma schema for SPEC §2 + migrations + seed
- [ ] P1-02 CX Auth: sign up, verify email, sign in, reset, sessions, org creation
- [ ] P1-03 CX Memberships, roles guard, invite teammates
- [ ] P1-04 CX Audit log module + interceptor + query endpoint
- [ ] P1-05 CX Exams and questions CRUD, publish rules, CSV question import
- [ ] P1-06 CX Candidates, invitations, exam codes, resend/revoke
- [ ] P1-07 CX Notifications adapters (email, WhatsApp console) + invite templates
- [ ] P1-08 CC Contract review of phase 1 endpoints; fix drift

## Phase 2: HR web app
- [ ] P2-01 AG App shell, auth pages, org switcher, layout, i18n setup
- [ ] P2-02 AG Exam list and exam builder (all 6 question types), preview as candidate
- [ ] P2-03 AG Invite candidates (form + CSV) and readiness table
- [ ] P2-04 AG Settings: members, org, retention, face matching toggle, audit log viewer
- [ ] P2-05 AG Playwright e2e for sign up → create exam → invite

## Phase 3: Desktop core
- [ ] P3-01 CC te-platform trait + mock implementation
- [ ] P3-02 CC te-core: device key, SQLite store, API client, answer sync, heartbeats, event queue
- [ ] P3-03 CC te-rules: signed rules fetch + Ed25519 verify; API side rules signing (with CX)
- [ ] P3-04 CX Candidate API: exam code sign-in, device registration, attempt start/resume, answer sync, heartbeat, submit, system check
- [ ] P3-05 CC Tauri shell: commands, native.ts contract, window, updater stub
- [ ] P3-06 AG Candidate screens: system check, sign in, rules/privacy, exam UI, submit, what next (against mock)
- [ ] P3-07 CC Wire screens to real commands; offline/resume test

## Phase 4: Security modules
- [ ] P4-01 CC Windows: secure desktop lockdown + focus watch
- [ ] P4-02 CC Windows: scan (processes with signer, capture-hidden windows, remote desktop, displays, cameras, VM, USB) + watch
- [ ] P4-03 CC macOS: kiosk lockdown + permissions flow
- [ ] P4-04 CC macOS: scan + watch (CGWindowList sharing state, NSWorkspace apps, displays, AVFoundation devices, IOKit USB, VM)
- [ ] P4-05 CC Screen capture (WGC / ScreenCaptureKit), close-app action
- [ ] P4-06 ME Test against Cluely-type overlay, AnyDesk, TeamViewer, OBS Virtual Camera, Parallels/VirtualBox on real machines

## Phase 5: Monitoring and evidence
- [ ] P5-01 AG Camera check + MediaPipe face presence / multiple faces in webview, nudges UI
- [ ] P5-02 CC Event pipeline: nudge before flag, evidence capture ±5 s, presigned upload with retry
- [ ] P5-03 CX Events and evidence API, S3 storage, encryption, signed URLs
- [ ] P5-04 CX Heartbeat checks server side, AGENT_INTEGRITY_FAIL, HEARTBEAT_MISSED

## Phase 6: Scoring, review and reports
- [ ] P6-01 CX Scoring job (auto-marked types), essay/short manual marking API
- [ ] P6-02 CX Risk assessment job (SPEC §6) with versioned weights, accommodations
- [ ] P6-03 CX Review decisions, reject rules, appeals, outcome emails
- [ ] P6-04 CX ID verification adapter (vendor + manual route) + webhook
- [ ] P6-05 AG Results table, integrity report page, evidence viewer, decision panel, manual marking
- [ ] P6-06 AG Candidate result and appeal page; senior reviewer appeal queue
- [ ] P6-07 AG ID and selfie capture screens in desktop app

## Phase 7: Privacy and hardening
- [ ] P7-01 CX Retention jobs, exports (PDF/JSON), candidate data export/delete
- [ ] P7-02 CX Consent records, notice versions, biometric consent gating
- [ ] P7-03 CC Security pass: threat model doc, rate limits, CSP, dependency audit, secrets scan, desktop permissions minimised
- [ ] P7-04 AG Accessibility pass (axe in e2e) and French translation
- [ ] P7-05 CC Load test 500 concurrent candidates (k6) and fix hot paths

## Phase 8: Release and pilot
- [ ] P8-01 CC Signed builds: Windows (OV cert), macOS (Developer ID + notarization), auto-update feed
- [ ] P8-02 CC Staging + production deploy, backups, monitoring (Sentry, uptime)
- [ ] P8-03 ME External security review of desktop app
- [ ] P8-04 ME Pilot with design partners; collect issues into PLAN.md

## Phase 9: After pilot
- [ ] P9-01 Phone as second camera via QR code
- [ ] P9-02 Verification follow-up questions generated from candidate answers
- [ ] P9-03 Answer similarity across candidates (Python worker)
- [ ] P9-04 Audio second-voice detection
- [ ] P9-05 SSO, ATS integrations, audit exports
- [ ] P9-06 Billing: session credits and plans
