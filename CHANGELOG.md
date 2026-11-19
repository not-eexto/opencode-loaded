# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-11-19

### Added

- Badge labels configurable through `labels`, including `{count}` templates such as `1i, 3s, 19a`.
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

### Notes

- **GitHub-only release** — install via `opencode plugin add github:not-eexto/opencode-loaded` or local clone.
- No npm package published.

## [Unreleased]

### Added

- (none yet)

### Changed

- (none yet)