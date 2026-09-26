# GitDrop — Production Visual Git Client

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/gitdrop/gitdrop)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**GitDrop** is a production-quality, local-first visual Git client designed for developers who want a fast, beautiful, and reliable GUI to manage repositories without requiring a terminal.

GitDrop is **deterministic developer software**. It contains **no AI agents, no LLMs, and no fake simulations**. Every status badge, commit graph node, merge, diff, and remote operation is powered by a real Git engine and browser filesystem APIs.

---

## Key Features

- **Local-First & Zero-Cloud Private**: Your source code never leaves your computer unless explicitly pushed to your configured remote (e.g. GitHub).
- **Directory Drag & Drop & Detection**: Drop any folder or project to automatically detect its framework (`React/Vite`, `Next.js`, `Rust`, `Go`, `Python`, `Node.js`, etc.) and `.git` status.
- **Visual Staging & Monaco Diffing**:
  - Individual and bulk staging (`Stage All`, `Unstage All`).
  - Dangerous actions (e.g. `Discard Changes`) protected by explicit confirmation modals.
  - Side-by-side split and inline unified diffs with syntax highlighting powered by Monaco Editor.
- **Commit Management**:
  - Commit message editor with keyboard shortcut (`Ctrl+Enter` / `Cmd+Enter`).
  - Support for `amend` and one-click `Commit & Push`.
- **Branch Management**:
  - Branch listing, creation from any ref, switching, renaming, and deletion.
  - Fast-forward and recursive branch merges with conflict detection.
  - Interactive rebase onto target branches.
- **3-Way Visual Conflict Resolver**:
  - Highlights `HEAD` vs `Incoming` conflict chunks.
  - One-click `Accept Current`, `Accept Incoming`, `Accept Both`, or manual editing with auto-staging upon resolution.
- **DAG Visual Commit Graph**:
  - Functional SVG DAG commit graph calculating topological lanes and bezier curves for branches and merges.
  - Inspect commit author, date, tree, and parent references.
  - Support for commit `Revert` and `Reset` (`soft`, `mixed`, `hard`).
- **Stash & Tags**:
  - Stash working directory and index state with custom messages.
  - Create and push tags for releases (`v1.0.0`).
- **Remotes & GitHub Sync**:
  - One-click repository publishing to GitHub (create repo, set remote origin, stage, commit, push).
  - Configurable remotes with fetch, pull, and push.
  - Secure GitHub Personal Access Token authentication stored safely in browser session storage.
- **Visual .gitignore Generator**:
  - Presets across Node.js, React, Vite, Next.js, Python, Rust, Go, Java, Flutter, C/C++, VS Code, OS files, and more.
- **File Explorer & Markdown Viewer**:
  - Recursive directory tree navigation.
  - In-place file editing and saving via Monaco Editor.
  - Live sanitized Markdown README preview (`Edit`, `Preview`, `Split`).
- **Command Palette & Global Search**:
  - `Ctrl+K` / `Cmd+K`: Comprehensive searchable command palette.
  - `Ctrl+P` / `Cmd+P`: Fast global search across files, branches, and commits.
  - Collapsible bottom console for live Git engine command logging and diagnostics.

---

## Supported Browsers

GitDrop utilizes the standard W3C [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) to read and write directly to your local filesystem.

| Browser | Status | Notes |
| :--- | :--- | :--- |
| **Google Chrome** | Fully Supported | Full local filesystem read & write |
| **Microsoft Edge** | Fully Supported | Full local filesystem read & write |
| **Brave** | Fully Supported | Full local filesystem read & write |
| **Chromium Variants** | Fully Supported | Full local filesystem read & write |
| **In-Memory Virtual Mode** | All Modern Browsers | Allows testing full Git workflow in any browser |

---

## Quickstart & Development

### 1. Prerequisites
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/gitdrop/gitdrop.git
cd gitdrop

# Install dependencies
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

### 4. Quality Gate & Testing
```bash
# Typecheck TypeScript
npm run typecheck

# Lint with ESLint 9
npm run lint

# Run unit, integration, security, and UI tests
npm run test

# Production build
npm run build
```

---

## GitHub Integration & CORS Proxy

GitHub's smart Git HTTP backend (`https://github.com/owner/repo.git/info/refs?service=git-upload-pack`) does not attach browser CORS headers by default. For browser-based push, fetch, and pull, GitDrop utilizes an isomorphic-git CORS proxy (defaulting to `https://cors.isomorphic-git.org` or a self-hosted proxy configured in **Settings**).

For GitHub repository creation and listing, GitDrop communicates directly with the GitHub REST API (`https://api.github.com`).
