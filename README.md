# opencode-loaded

[![CI](https://github.com/not-eexto/opencode-loaded/actions/workflows/ci.yml/badge.svg)](https://github.com/not-eexto/opencode-loaded/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-plugin-blue)](https://opencode.ai)

OpenCode plugin that shows, directly in the TUI, which instruction files, skills, agents, commands, references, MCP servers and plugins are loaded for the current location and session.

```
1 instruction, 44 skills, 19 agents, 3 plugins
```

[Features](#features) · [Installation](#installation) · [What it shows](#what-it-shows) · [Configuration](#configuration) · [How the counts are computed](#how-the-counts-are-computed) · [Development](#development) · [License](#license)

## Features

- **Home footer** (`home.footer.status`): full summary, full words. No session is selected here, so all discovered skills are shown.
- **Session footer** (`prompt.footer.status`): compact summary (`1 instr · 30 skills · 19 agents`) that drops trailing groups until it fits, because that row is shared with the working directory and the key hints. Skills are filtered for the session's agent and the badge refreshes immediately when the agent changes with Shift+Tab.
- **`/loaded`** (alias `/assets`): pick a group, then inspect the entries. It uses the same agent as the last session shown. The second list shows paths: full for instruction files, shortened to fit for skills and references.
- **Verified instructions**: a file counts only when its text is actually present in a request, not merely because it exists on disk.

## Installation

Clone the repository into the OpenCode plugin directory:

```sh
git clone https://github.com/not-eexto/opencode-loaded.git ~/.config/opencode/plugins/opencode-loaded
```

Restart OpenCode and check `opencode plugin list`: the plugin should report
`server+tui+rpc: active`. OpenCode loads the TypeScript sources directly, so
there is no build step.

With explicit options:

```json
{
  "plugins": [
    {
      "package": "opencode-loaded",
      "options": { "badge": ["instructions", "skills"], "suffix": "loaded" }
    }
  ]
}
```

## What it shows

Run `/loaded` (or `/assets`) to open a two-step dialog: first choose a group,
then browse its entries.

| Group | Source |
| --- | --- |
| instructions | `AGENTS.md` / `CLAUDE.md` discovery plus the `instructions` entries of the configuration |
| skills | the location registry, filtered by the session agent's permissions |
| agents, commands, references, MCP | the location registries |
| plugins | registered plugins, built-ins excluded |

Instruction files are the only group that can lie if taken from the filesystem
alone, so they are **verified**: once a session has issued at least one request,
a file counts only if its text is actually present in the request's system
parts. Before that first request the list is discovery only, and the dialog
labels it `unverified`.

## Configuration

| Option | Default | Meaning |
| --- | --- | --- |
| `badge` | `instructions, skills, agents, plugins` | groups in the badge, in order |
| `separator` | `", "` | separator of the full badge |
| `full` | `true` | full words (`3 instructions`) instead of short labels (`3 instr`) |
| `labels` | none | per-group override; `{count}` is replaced by the number, otherwise the text is appended after it |
| `prefix` / `suffix` | none | text around the badge, e.g. `suffix: "loaded"` |
| `width` | `32` | character budget of the compact session badge; trailing groups are dropped until it fits |

For a minimal badge, use templates:

```json
{
  "plugins": [
    {
      "package": "opencode-loaded",
      "options": {
        "badge": ["instructions", "skills", "agents"],
        "labels": { "instructions": "{count}i", "skills": "{count}s", "agents": "{count}a" }
      }
    }
  ]
}
```

That renders `1i, 30s, 19a`.

## How the counts are computed

The skill count is not cosmetic: OpenCode itself drops skills whose `skill`
permission evaluates to `deny` before writing the request's skill guidance. The
plugin reproduces that exactly — same wildcard matcher, last matching rule wins,
`agent.permissions` followed by `session.permissions`, default `ask` is not a
deny — so a session using `honest` reports 30 skills while `device-expert`
reports 34 out of the same 44 discovered.

Changing agent with Shift+Tab emits `session.agent.selected`; the plugin listens
for it and recomputes the badge immediately, without waiting for a new request.

Two implementation details worth knowing:

- the request metadata (`metadata.experimental.instructions`) lists built-in sources (`core/*`) only, not files, which is why verification works on content instead;
- the request hook and the RPC surface are separate plugin instances, so the verified list travels through the plugin's storage.

## Development

```sh
npm run typecheck
npm test
npm run check   # both of the above
```

Node.js 22 or newer is required for the tests' native TypeScript stripping.

```
src/index.ts         request hook + RPC method (server side)
src/tui.tsx          footer slots, badge, /loaded command
src/rpc.ts           evidence contract between the two sides
src/instructions.ts  discovery, configuration expansion, content verification
src/permissions.ts   OpenCode-compatible wildcard matching and rule evaluation
src/labels.ts        badge labels and `{count}` templates
test/                unit tests for the pure modules
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup and conventions,
and [CHANGELOG.md](CHANGELOG.md) for the release history.

## Requirements

- OpenCode with TUI plugin support (`@opencode/plugin` 2.3.x)
- `solid-js` and `@opentui/*` are provided by the host

## License

[MIT](LICENSE)
