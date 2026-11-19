# opencode-loaded

What did OpenCode actually load for this location? `opencode-loaded` answers that in the TUI itself.

```
1 instruction, 44 skills, 19 agents, 3 plugins
```

- **Home footer** (`home.footer.status`): full summary, full words. No session is selected here, so all discovered skills are shown.
- **Session footer** (`prompt.footer.status`): compact summary (`1 instr · 30 skills · 19 agents`) that drops trailing groups until it fits, because that row is shared with the working directory and the key hints. Skills are filtered for the session's agent.
- **`/loaded`** (alias `/assets`): pick a group, then inspect the entries; it uses the same agent as the last session shown.

## How the counts are computed

| Group | Source |
| --- | --- |
| instructions | `AGENTS.md` / `CLAUDE.md` discovery plus the `instructions` entries of the configuration |
| agents, commands, references, MCP | the location registries |
| skills | the location registry, filtered by the session agent's permissions |
| plugins | registered plugins, built-ins excluded |

The skill count is not cosmetic: OpenCode itself drops skills whose `skill` permission evaluates to `deny` before writing the request's skill guidance. The plugin reproduces that exactly — same wildcard matcher, last matching rule wins, `agent.permissions` followed by `session.permissions`, default `ask` is not a deny — so a session using `honest` reports 30 skills while `device-expert` reports 34 out of the same 44 discovered.

Instructions are the only group that can lie if taken from the filesystem alone, so they are **verified**: once a session has issued at least one request, a file counts only if its text is actually present in the request's system parts. Before that first request the list is discovery only, and the dialog labels it `unverified`.

Two details worth knowing:

- the request metadata (`metadata.experimental.instructions`) lists built-in sources (`core/*`) only, not files, which is why verification works on content instead;
- the request hook and the RPC surface are separate plugin instances, so the verified list travels through the plugin's storage.

## Install

Local plugin directory, picked up automatically:

```sh
git clone https://github.com/not-eexto/opencode-loaded.git ~/.config/opencode/plugins/opencode-loaded
```

OpenCode loads the TypeScript sources directly; there is no build step.

With options:

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

## Options

| Option | Default | Meaning |
| --- | --- | --- |
| `badge` | `instructions, skills, agents, plugins` | groups in the badge, in order |
| `separator` | `", "` | separator of the full badge |
| `full` | `true` | full words (`3 instructions`) instead of short labels (`3 instr`) |
| `prefix` / `suffix` | none | text around the badge, e.g. `suffix: "loaded"` |
| `width` | `32` | character budget of the compact session badge; trailing groups are dropped until it fits |

## Requirements

- OpenCode with TUI plugin support (`@opencode/plugin` 2.3.x)
- `solid-js` and `@opentui/*` are provided by the host

## Layout

```
src/index.ts         request hook + RPC method (server side)
src/instructions.ts  discovery, configuration expansion, content verification
src/permissions.ts   OpenCode-compatible wildcard matching and rule evaluation
src/rpc.ts           evidence contract between the two sides
src/tui.tsx          footer slots, badge, /loaded command
```

## License

MIT
