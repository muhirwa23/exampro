# PR review checklist

Used by Claude Code and by Codex code review. Comment only on real problems; group nits into one comment.

## Must block the PR
- A query or endpoint not scoped by `organizationId`, or a missing cross-org access test.
- Input from HTTP, IPC or files used without validation.
- A person's state change without an `AuditLog` row.
- Secrets, tokens, answers, images or full emails in logs or commits.
- The desktop app sending anything beyond events, matches, answers and evidence (see AGENTS.md privacy rules), or a new way for the server to make the app run commands.
- Automatic rejection, emotion inference or AI-writing detection added to scoring.
- Tests deleted, skipped or weakened; CI steps disabled.
- Types hand-written where `packages/contracts` generates them; contract changed without regenerating.
- Edits outside the folders the task owns, without explanation.

## Should fix
- Missing tests for the new behaviour or the error path.
- UI without empty, loading or error states, or not keyboard usable.
- Text not going through i18n.
- Files over about 300 lines or functions over about 50 that could split cleanly.
