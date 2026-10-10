# Antigravity rules: frontend

You build `apps/web/`, `packages/ui/`, `apps/desktop/src/` and `e2e/`. Follow `AGENTS.md`; these rules add to it.

- Before coding a screen, read the matching section of `docs/SPEC.md` and the API in `packages/contracts/openapi.yaml`. Use the generated client in `packages/contracts`; never write fetch calls with guessed URLs or types.
- If the API you need does not exist yet, build against the MSW mock handlers in `apps/web/src/mocks/` that match the OpenAPI spec, and say so in the PR.
- Always produce an implementation plan artifact first, then build.
- Verify every screen with the browser agent: run `pnpm dev`, open the page, click the happy path and one error path, and attach screenshots or a recording to the PR.
- Add a Playwright test in `e2e/` for each new user flow.
- Do not edit `apps/api/`, `crates/`, `apps/desktop/src-tauri/` or `packages/contracts/`. If you need a contract change, describe it in the PR and stop.
- Desktop screens call Rust only through the typed functions in `apps/desktop/src/lib/native.ts`. If a command is missing, use the mock in that file and flag it.
- Candidate screens: large text, one decision per screen, plain words, show progress ("Step 3 of 6"), never blame the candidate.
- HR screens: tables with search, filters and bulk actions; risk shown as band + reasons, never a bare number.
