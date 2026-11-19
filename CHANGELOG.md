# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-11-19

### Added

- Home and prompt footer badges with live counts for instructions, skills, agents, commands, references, MCP servers and plugins.
- Badge labels configurable through `labels`, including `{count}` templates such as `1i, 3s, 19a`.
- Trailing separator in the compact prompt badge so it separates from the token/shell info.
- Skill counts filtered with the same permission rules OpenCode applies to the request's skill guidance.
- Live counter refresh when the session agent changes with Shift+Tab (`session.agent.selected`).
- `/loaded` (alias `/assets`) dialog with instruction and skill paths.
- Unit tests for permission evaluation and label formatting.
- CI runs on the `ubuntu-slim` runner with a 10 minute job timeout.
- Comprehensive README with all official OpenCode installation methods.
- Standard repository files: `.npmignore`, `.gitattributes`, issue/PR templates.

### Changed

- CI workflow: upgraded `actions/checkout` to v5, removed `actions/setup-node` (uses `ubuntu-slim` Node 24).
- Package.json: added `engines.opencode`, expanded keywords; removed fake `lint` script and `publishConfig`.

### Fixed

- Installation docs: removed the unsupported `~/` form from `opencode.jsonc` plugin paths. OpenCode resolves `./`, `../`, absolute paths and `file://` only; `~/` is not expanded for plugins. Also clarified that cloning into `~/.config/opencode/plugins/` is auto-discovered, so no config entry is required.

### Notes

- **GitHub-only release** — install via `opencode plugin add github:not-eexto/opencode-loaded` or local clone.
- No npm package published.
