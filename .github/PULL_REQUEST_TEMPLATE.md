## Description

Brief description of the changes in this PR.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Refactoring / Code quality
- [ ] CI / Build / Tooling

## Testing

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes (all 6 tests)
- [ ] Tested manually in OpenCode TUI
  - [ ] Home footer badge shows correct counts
  - [ ] Session footer badge shows correct counts (compact)
  - [ ] `/loaded` command works for all groups
  - [ ] Agent switch (Shift+Tab) updates badge live
  - [ ] Custom labels work (`{count}i`, etc.)

## Screenshots / Logs

If applicable, add screenshots of the TUI showing the changes.

## Checklist

- [ ] Code follows the project's conventions (source-only, no `dist/`)
- [ ] No approximation of core OpenCode semantics — exact port with citations
- [ ] Inspection is non-invasive (failures don't break requests or TUI)
- [ ] Data passed between server/TUI via `ctx.storage`, not module-level maps
- [ ] Conventional Commit message format used
- [ ] Author/committer is `not-eexto <eexto@aol.com>`
- [ ] `README.md` updated for user-visible changes
- [ ] `CHANGELOG.md` updated for user-visible changes
- [ ] No `@ts-ignore` or `eslint-disable` added without justification

## Related Issues

Fixes # (issue number)