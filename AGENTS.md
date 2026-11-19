# Repository guidance

`opencode-loaded` is a source-only OpenCode TUI plugin. OpenCode loads `src/index.ts`
(server), `src/tui.tsx` (TUI) and `src/rpc.ts` (contract) directly; there is no
build step and `dist/` is not part of the repository.

## Commands

- `npm run typecheck` — strict TypeScript check, must stay clean.
- `npm test` — unit tests via Node's native TypeScript stripping (Node 22+).
- `npm run check` — runs both typecheck and tests.

Run both after any code change and before committing.

## Layout

- `src/index.ts` — request hook and RPC implementation, runs in the server instance.
- `src/tui.tsx` — footer slots, badge, `/loaded` command, runs in the TUI instance.
- `src/rpc.ts` — evidence contract between the two instances.
- `src/instructions.ts` — `AGENTS.md` / `CLAUDE.md` discovery and content verification.
- `src/permissions.ts` — exact port of OpenCode core's wildcard matcher, permission
  evaluation and skill availability filter (references `@opencode/plugin` 2.3.2).
- `src/labels.ts` — badge labels and `{count}` templates.
- `test/` — unit tests for the pure modules.

## Rules

- Do not add a bundler or a `dist/` directory: source-only is intentional here.
- Do not approximate core semantics. Port the exact algorithm and cite the core
  file and version in a comment.
- Keep inspection non-invasive: a failure while counting or verifying must never
  break the model request or the TUI.
- Use `ctx.storage` to pass verified data between the server and TUI instances;
  module-level maps do not survive that boundary.
- Use Conventional Commits. Author and committer must be `not-eexto <eexto@aol.com>`.
- Update `README.md` and `CHANGELOG.md` for user-visible changes.

## OpenCode Plugin Compatibility

This plugin is compatible with all [official OpenCode installation methods](https://opencode.ai/docs/plugins/):

- Via `opencode.jsonc` (global or project config)
- Via `opencode plugin add` CLI (npm, GitHub, git)
- Via `.opencode/plugins/` directory discovery
- Via explicit local path in config

The plugin exports multiple entry points:
- `.` / `./server` — server-side request hook
- `./tui` — TUI component (footer slots, `/loaded` command)
- `./rpc` — shared types/contract between server and TUI