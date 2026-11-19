# Contributing

Thanks for helping improve `opencode-loaded`.

## Development setup

OpenCode loads the TypeScript sources directly, so there is no build step.

```sh
git clone https://github.com/not-eexto/opencode-loaded.git
ln -s "$(pwd)/opencode-loaded" ~/.config/opencode/plugins/opencode-loaded
```

Restart OpenCode (or reload plugins) and check that the plugin appears with
`opencode plugin list`. Local changes are picked up on plugin reload.

## Checks

Run both before opening a pull request:

```sh
npm run typecheck
npm test
```

Node.js 22 or newer is required because the tests use native TypeScript type
stripping. CI runs the same two commands on every push and pull request.

## Conventions

- Keep the server part (`src/index.ts`) and the TUI part (`src/tui.tsx`) separate;
  they run as different plugin instances and communicate through `src/rpc.ts` and storage.
- Mirror OpenCode core semantics instead of approximating them, especially for
  permissions and discovery rules. Reference the core version in a comment.
- Pure logic goes into its own module under `src/` with a colocated or `test/`
  unit test. Do not make the TUI component harder to test.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
  Commit author and committer must be `not-eexto <eexto@aol.com>`.
- Update `README.md` when options change and `CHANGELOG.md` for user-visible changes.

## Pull requests

Describe the behaviour change, how it was verified in a real TUI, and which
OpenCode version was used. Keep one concern per pull request.
