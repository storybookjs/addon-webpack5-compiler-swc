# Release Process

This repo uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

```bash
pnpm changeset   # Create a changeset for your changes
pnpm release     # Build and publish (CI handles this automatically)
```

Before committing, run the repo checks:

```bash
pnpm format
pnpm check:ci
```

## Creating Changesets

When making user-facing changes, create a changeset file in `.changeset/`.

1. Use the filename convention `<random-word>-<random-word>-<random-word>.md`
2. Format the file like this:

```markdown
---
'@storybook/addon-webpack5-compiler-swc': patch
---

Short description of what changed.
```

Use `patch` for fixes and maintenance, `minor` for backward-compatible features, and `major` for breaking changes.
