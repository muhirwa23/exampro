# TrustExam Pro product spec (v1, pilot scope)

Agents: read only the section your task names. Section numbers are stable; tasks reference them as `SPEC §n`.

## §1 Users and roles
| Role | Where | Can |
|---|---|---|
| Org Owner | Web | Everything in the org, billing, settings, retention |
| Admin | Web | Create exams, invite candidates, see results |
| Reviewer | Web | Open integrity reports, decide, add notes |
| Senior Reviewer | Web | Everything a Reviewer can, plus decide appeals and escalations |
| Candidate | Desktop app (+ a web page for result and appeal) | Take an assigned exam, see own result and integrity summary, appeal |
| Platform Admin | Internal web | Manage orgs, denylist, support (later) |

One person can belong to several orgs. Candidates have no password: they use a one-time exam code from their invite.

## §2 Domain model (Prisma names)
- `Organization` (id, name, country, dataRegion, retentionMediaDays=30, retentionReportDays=365, faceMatchEnabled=false)
- `User` (id, email, name, passwordHash) · `Membership` (userId, organizationId, role)
- `Exam` (id, orgId, title, instructions, durationSec, passMarkPct, windowStart, windowEnd, securityLevel: STANDARD|LOCKDOWN, idCheck: NONE|VENDOR|MANUAL, cameraRequired, shuffleQuestions, shuffleOptions, status: DRAFT|PUBLISHED|CLOSED)
- `Question` (id, examId, type: MCQ|MULTI|TRUE_FALSE|SHORT|ESSAY|FILE, prompt (rich text), options JSON, correct JSON, points, order, poolTag)
- `Candidate` (id, orgId, email, phone, name, externalRef)
- `Invitation` (id, examId, candidateId, examCode (hashed, 8 chars shown), channel: EMAIL|WHATSAPP|SMS, status: SENT|OPENED|SYSTEM_CHECK_PASSED|STARTED|SUBMITTED|EXPIRED, accommodations JSON, sentAt, openedAt)
- `SystemCheck` (id, invitationId, os, osVersion, cpuArch, cameraOk, micOk, bandwidthKbps, blockingApps JSON, passed, createdAt)
- `Attempt` (id, invitationId, deviceKeyFingerprint, startedAt, submittedAt, lastHeartbeatAt, state: IN_PROGRESS|DISCONNECTED|SUBMITTED|ABANDONED, score, scorePct)
- `Answer` (id, attemptId, questionId, value JSON, clientSavedAt, serverSavedAt, version)
- `IntegrityEvent` (id, attemptId, type, severity: INFO|LOW|MEDIUM|HIGH, occurredAt, durationSec, details JSON, evidenceIds[])
- `Evidence` (id, attemptId, kind: SNAPSHOT_CAMERA|SNAPSHOT_SCREEN|CLIP_AUDIO|CLIP_VIDEO|ID_DOC|SELFIE, storageKey, sha256, sizeBytes, createdAt, deleteAfter)
- `IdentityCheck` (id, attemptId, method: VENDOR|MANUAL, vendorRef, result: PASS|FAIL|REVIEW, matchScore)
- `RiskAssessment` (id, attemptId, score 0-100, band: LOW|MEDIUM|HIGH, reasons JSON [{eventType, weight, count, explanation}], version)
- `ReviewDecision` (id, attemptId, reviewerId, decision: ACCEPT|RETAKE|REJECT|ESCALATE, note, evidenceViewed bool, createdAt)
- `Appeal` (id, attemptId, message, status: OPEN|UPHELD|DENIED, decidedBy, decidedAt)
- `Consent` (id, attemptId, noticeVersion, biometricConsent bool, acceptedAt, ipHash)
- `AuditLog` (id, orgId, actorType, actorId, action, targetType, targetId, metadata JSON, createdAt)
- `ExamRules` (id, examId, version, json, signature): the signed rules the desktop app downloads (§7)

## §3 HR web app flows
1. **Sign up / sign in**: email + password, email verification, password reset, org creation, invite teammates by email with a role.
2. **Exam builder**: create exam (settings above), add questions of all 6 types, reorder, import questions from CSV, preview as candidate, publish. Published exams are read-only except window end date.
3. **Invite candidates**: single form or CSV upload (name, email, phone, externalRef). Choose email and/or WhatsApp. Invite includes: exam name, window, device requirements (Windows 10+/macOS 13+, camera, stable internet), download links, exam code. Resend and revoke.
4. **Readiness tracking**: table per exam with invitation status, system check result (with blocking apps), last activity. Filter "not ready". Bulk resend.
5. **Results**: table sorted by risk band then score; columns: candidate, score, pass/fail, risk band, top reason, review status. Bulk accept LOW risk.
6. **Integrity report** (§6) and decision: accept, request retake, reject, escalate. Reject requires that at least one evidence item was opened and a note of 20+ characters.
7. **Share outcome**: candidate receives an email with a link to their result page.
8. **Settings**: org profile, members, retention days, face matching on/off (with warning text), default exam settings, audit log viewer, data export.

## §4 Candidate desktop app flow
1. **Install** from invite link. Per-user install, no admin rights where the OS allows.
2. **System check** (any time before exam): OS version, camera, microphone, bandwidth, screen count, blocking apps. Result sent to server. Shows clear fix steps.
3. **Sign in** with exam code (+ email). App creates a device key pair (stored in OS keychain) and registers its public key.
4. **Rules and privacy notice**: plain list of what is checked and what is not (no files, no keystrokes, no browsing history). Checkbox to accept. Separate optional biometric consent if face matching is on; otherwise manual ID route.
5. **Identity**: photo of ID document + selfie (vendor SDK or manual capture).
6. **Security scan**: run checks (§5). Show each app to close by name with a "Close" button and "Scan again". Cannot continue while a HIGH blocking item remains.
7. **Exam in lockdown**: question navigation, flag for review, timer, autosave every answer locally (SQLite) then sync. Live nudges ("Your face is not visible", "Please stay in the exam window") before an event becomes a flag. On disconnect: keep working offline, resume sync; if the app closes, resume within `resumeGraceSec` (default 300) with the same device key.
8. **Submit**: confirm screen with unanswered count. Lockdown ends. "What happens next" screen.
9. **Result page** (web): score if org shares it, integrity summary (bands and reasons, no raw evidence), appeal form.

## §5 Integrity checks and event types
| Event type | Source | Default severity | Notes |
|---|---|---|---|
| `CAPTURE_HIDDEN_WINDOW` | Rust per-OS | HIGH | Windows: display affinity exclude-from-capture; macOS: window sharingState none |
| `REMOTE_DESKTOP_ACTIVE` | Rust | HIGH | AnyDesk, TeamViewer, RustDesk, Chrome Remote Desktop, RDP session |
| `VIRTUAL_CAMERA` | Rust + webview | HIGH | Device names (OBS, ManyCam, etc.) |
| `VIRTUAL_MACHINE` | Rust | MEDIUM | Vendor strings, not hypervisor flag alone |
| `EXTRA_DISPLAY` | Rust | MEDIUM | Count > 1 or display added mid-exam |
| `DENYLISTED_APP` | Rust | MEDIUM | Matched by signer/bundle ID + name, from rules |
| `USB_STORAGE_ADDED` | Rust | LOW | Mid-exam plug-in |
| `LOCKDOWN_EXIT_ATTEMPT` | Rust | MEDIUM | Focus loss or kiosk break attempt |
| `PASTE_BLOCKED` | Webview | MEDIUM | |
| `FACE_NOT_VISIBLE` | Webview (MediaPipe) | LOW | Only after > 10 s, after a nudge |
| `MULTIPLE_FACES` | Webview | MEDIUM | |
| `SECOND_VOICE` | Later (phase 9) | MEDIUM | |
| `NETWORK_DISCONNECT` | Rust | INFO | |
| `HEARTBEAT_MISSED` | Server | LOW | > 3 missed |
| `AGENT_INTEGRITY_FAIL` | Server | HIGH | Bad heartbeat signature or replay |
Every event has `occurredAt`, `durationSec`, `details`, and links to evidence captured ±5 s around it (snapshot of camera and screen).

## §6 Risk score and integrity report
- Score = sum of event weights capped at 100, weights from `RiskWeights` config (versioned). Default weights: HIGH 40 first + 15 each extra; MEDIUM 15 first + 5 extra; LOW 3 each, cap 15 total from LOW; INFO 0. Accommodations can zero specific event types per candidate.
- Band: LOW < 30 ≤ MEDIUM < 60 ≤ HIGH.
- Reasons: list of `{eventType, count, weight, explanation}` in plain English, sorted by weight.
- Report page: header (candidate, exam, score, band, identity result), reasons, timeline of events with evidence thumbnails, answers, decision panel, audit trail. Evidence opened is recorded.
- Never: AI-writing detection, emotion inference, automatic reject.

## §7 Exam rules (server → desktop)
Signed JSON (Ed25519, server key; public key built into the app) per exam version: required checks, denylist (name, signer, bundleId, severity, action: BLOCK|FLAG), snapshot intervals, nudge thresholds, resumeGraceSec, accommodations. The app refuses unsigned or expired rules.

## §8 Heartbeats and sync
Desktop sends a heartbeat every 15 s: attemptId, sequence number, monotonic time, hash of last answer batch, signed with the device key. Server rejects replays and gaps > 3 create `HEARTBEAT_MISSED`. Answers sync in batches with version numbers; server keeps latest version per question; conflicts resolved by highest version.

## §9 Retention and privacy
Nightly job deletes Evidence where `deleteAfter < now` and reports older than org retention. Exports (PDF/JSON of report) available before deletion. Candidate data request: org admin can export or delete a candidate's data; deletion is audited.

## §10 Notifications
Email (provider via adapter), WhatsApp (adapter), both with templates in `apps/api/src/notifications/templates`. Local dev uses Mailpit and a console WhatsApp adapter.

## §11 Non-functional
- 500 concurrent candidates per exam in pilot. API p95 < 300 ms for answer sync.
- Candidate app installer < 25 MB. Works on 1 Mbps with snapshots (no continuous video).
- Data region per org (EU, Africa) later; design storage keys with region prefix now.
