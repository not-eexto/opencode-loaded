# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Badge labels configurable through `labels`, including `{count}` templates such as `1i, 3s, 19a`.
- Skill counts filtered with the same permission rules OpenCode applies to the request's skill guidance.
- Live counter refresh when the session agent changes with Shift+Tab (`session.agent.selected`).
- `/loaded` (alias `/assets`) dialog with instruction and skill paths.
- Unit tests for permission evaluation and label formatting.
- CI runs on the `ubuntu-slim` runner with a 10 minute job timeout.
- Comprehensive README with all official OpenCode installation methods.
- Standard repository files: `.npmignore`, `.gitattributes`, dependabot, issue/PR templates.

### Changed

- CI workflow: added `workflow_dispatch`, concurrency cancellation, and proper permissions.
- Package.json: added `engines.opencode`, `publishConfig`, expanded keywords.

## [0.1.0] - 2026-11-19

### Added

- Initial release: home and prompt footer badges, `/loaded` dialog, verified instruction discovery, RPC bridge between the server and TUI parts.
- Core modules: `instructions.ts`, `permissions.ts`, `labels.ts`, `rpc.ts`.
- TypeScript configuration with strict mode.
- Unit tests for permissions and labels.
- Documentation: README, CONTRIBUTING, AGENTS, SECURITY, LICENSE.
- CI workflow on `ubuntu-slim` with Node 22.