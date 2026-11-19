# opencode-loaded

[![CI](https://github.com/not-eexto/opencode-loaded/actions/workflows/ci.yml/badge.svg)](https://github.com/not-eexto/opencode-loaded/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![OpenCode](https://img.shields.io/badge/OpenCode-plugin-blue)](https://opencode.ai)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](tsconfig.json)

OpenCode plugin that shows, directly in the TUI, which instruction files, skills, agents, commands, references, MCP servers and plugins are loaded for the current location and session.

```
1 instruction, 44 skills, 19 agents, 3 plugins
```

[Features](#features) · [Installation](#installation) · [What it shows](#what-it-shows) · [Configuration](#configuration) · [How the counts are computed](#how-the-counts-are-computed) · [Development](#development) · [Contributing](#contributing) · [License](#license)

## Features

- **Home footer** (`home.footer.status`): full summary, full words. No session is selected here, so all discovered skills are shown.
- **Session footer** (`prompt.footer.status`): compact summary (`1 instr · 30 skills · 19 agents`) that drops trailing groups until it fits, because that row is shared with the working directory and the key hints. Skills are filtered for the session's agent and the badge refreshes immediately when the agent changes with Shift+Tab.
- **`/loaded`** (alias `/assets`): pick a group, then inspect the entries. It uses the same agent as the last session shown. The second list shows paths: full for instruction files, shortened to fit for skills and references.
- **Verified instructions**: a file counts only when its text is actually present in a request, not merely because it exists on disk.
- **Source-only**: OpenCode loads TypeScript sources directly — no build step, no `dist/` directory.

## Installation

`opencode-loaded` works with all [official OpenCode plugin installation methods](https://opencode.ai/docs/plugins/).

### 1. Via `opencode.jsonc` (recommended)

Add the plugin to your global or project config. Since the package is not yet on npm, use a **local path** (clone the repo first, see method 3) or use the CLI (method 2) which writes the resolved path for you.

```jsonc
// ~/.config/opencode/opencode.jsonc  (global)
// or .opencode/opencode.jsonc       (project)
{
  "plugins": [
    "~/.config/opencode/plugins/opencode-loaded"
  ]
}
```

With options:

```jsonc
{
  "plugins": [
    {
      "package": "~/.config/opencode/plugins/opencode-loaded",
      "options": {
        "badge": ["instructions", "skills", "agents"],
        "labels": { "instructions": "{count}i", "skills": "{count}s", "agents": "{count}a" }
      }
    }
  ]
}
```

> **Note:** The `github:owner/repo` shorthand works **only** with the CLI `opencode plugin add` command (method 2). It is not supported directly inside `opencode.jsonc`.

### 2. Via CLI

```sh
# Install from GitHub (recommended until npm publish)
opencode plugin add github:not-eexto/opencode-loaded

# Install from specific branch/tag/commit
opencode plugin add github:not-eexto/opencode-loaded#main
opencode plugin add git+https://github.com/not-eexto/opencode-loaded.git#main

# Install from npm (not yet published)
# opencode plugin add opencode-loaded
```

### 3. Local directory (development)

Clone into the discovered plugins directory:

```sh
# Global
git clone https://github.com/not-eexto/opencode-loaded.git ~/.config/opencode/plugins/opencode-loaded

# Project (under .opencode/)
mkdir -p .opencode/plugins
git clone https://github.com/not-eexto/opencode-loaded.git .opencode/plugins/opencode-loaded
```

Or add an explicit local path in config:

```jsonc
{
  "plugins": ["./plugins/opencode-loaded"]
}
```

### 4. Verify installation

Restart OpenCode and run:

```sh
opencode plugin list
```

The plugin should report `server+tui+rpc: active`.

> **Note:** OpenCode loads TypeScript sources directly, so there is no build step required.

## What it shows

Run `/loaded` (or `/assets`) to open a two-step dialog: first choose a group, then browse its entries.

| Group | Source |
| --- | --- |
| instructions | `AGENTS.md` / `CLAUDE.md` discovery plus the `instructions` entries of the configuration |
| skills | the location registry, filtered by the session agent's permissions |
| agents, commands, references, MCP | the location registries |
| plugins | registered plugins, built-ins excluded |

Instruction files are the only group that can lie if taken from the filesystem alone, so they are **verified**: once a session has issued at least one request, a file counts only if its text is actually present in the request's system parts. Before that first request the list is discovery only, and the dialog labels it `unverified`.

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

The skill count is not cosmetic: OpenCode itself drops skills whose `skill` permission evaluates to `deny` before writing the request's skill guidance. The plugin reproduces that exactly — same wildcard matcher, last matching rule wins, `agent.permissions` followed by `session.permissions`, default `ask` is not a deny — so a session using `honest` reports 30 skills while `device-expert` reports 34 out of the same 44 discovered.

Changing agent with Shift+Tab emits `session.agent.selected`; the plugin listens for it and recomputes the badge immediately, without waiting for a new request.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the development setup, conventions, and pull request guidelines.

## Requirements

- OpenCode with TUI plugin support (`@opencode/plugin` 2.3.x)
- `solid-js` and `@opentui/*` are provided by the host

## License

[MIT](LICENSE)