# Contributing to GitDrop

Thank you for your interest in contributing to GitDrop!

## Development Guidelines

1. **Deterministic Software Only**:
   GitDrop is a pure developer tool. Do NOT add AI features, LLM chatbots, or mock simulations. Every visible action must be backed by deterministic logic and real Git operations.

2. **Decoupled Architecture**:
   Maintain strict separation between:
   - Visual UI (`src/components/`, `src/pages/`)
   - State (`src/state/`)
   - Git Service Layer (`src/services/git/`)
   - Filesystem / Remote Layer (`src/services/filesystem/`, `src/services/remote/`)

3. **No Tailwind**:
   Use standard CSS and Bootstrap 5 variables / classes styled according to our custom design tokens (`src/styles/theme.css`).

4. **Quality Gates**:
   Before submitting code, ensure all quality checks pass:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

5. **Security**:
   Always sanitize paths, mask secrets in logs, and sanitize rendered HTML.
