# GitDrop Architecture Documentation

## 1. High-Level Architecture Overview

GitDrop is engineered as a **local-first**, deterministic visual Git client built specifically for modern Chromium browsers and designed for seamless future desktop packaging (via Tauri or Electron).

```
┌────────────────────────────────────────────────────────┐
│                        UI Layer                        │
│   React 19 • Bootstrap 5 Design Tokens • Monaco Editor │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                Application State Layer                 │
│   RepositoryContext • GitContext • AuthContext • UI    │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Git Service Layer                   │
│      IGitService Interface • StatusMapper • Diff       │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
┌─────────────▼──────────────┐   ┌─────────▼─────────────┐
│      BrowserGitAdapter     │   │    NativeGitAdapter   │
│       isomorphic-git       │   │    (Future Desktop)   │
└─────────────┬──────────────┘   └───────────────────────┘
              │
┌─────────────▼──────────────────────────────────────────┐
│                Filesystem & Storage Bridge             │
│   FileSystemAccessFS (Chromium File System Access API) │
│   MemoryFS (In-Memory Testing & Virtual Starter Repos) │
└─────────────────────────────┬──────────────────────────┘
                              │
┌─────────────────────────────▼──────────────────────────┐
│                    Remote Providers                    │
│   GitHubProvider (OAuth / Personal Access Tokens)      │
│   CORS Proxy / REST Git Data Endpoints                 │
└────────────────────────────────────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Clean Separation of Concerns
1. **Visual UI**: React components in `src/components/` and `src/pages/` contain only presentation logic, invoking context operations and rendering state.
2. **State Layer**: Encapsulated within `src/state/`. Every Git operation transitions through a deterministic state machine: `idle` -> `running` -> `success` / `error`.
3. **Git Service Abstraction**: The application never touches `isomorphic-git` directly in visual components. Everything goes through `GitService` (`src/services/git/IGitService.ts`), enabling plug-and-play swaps between `BrowserGitAdapter` and a future `NativeGitAdapter`.
4. **Filesystem Abstraction**: Standardized on `IFileSystem` (`src/types/filesystem.ts`), which bridges browser `FileSystemDirectoryHandle` handles and virtual memory storage.

### 2.2 Local-First & Zero AI
- User files never leave the local browser environment unless explicitly pushed to the user's configured remote repository (e.g. GitHub).
- Zero AI agents, LLM integrations, or chatbots. All repository operations, conflict parsing, and project detection are 100% deterministic algorithms.

---

## 3. Subsystem Breakdown

### 3.1 Filesystem Adapter (`FileSystemAccessFS`)
- Leverages the Chromium File System Access API (`window.showDirectoryPicker` and directory drag-and-drop via `getAsFileSystemHandle`).
- Caches directory handles with path normalization to achieve optimal I/O latency.
- Prevents path traversal vulnerabilities (`..` directory escapes) via `normalizePath`.

### 3.2 Git Engine (`BrowserGitAdapter`)
- Powered by `isomorphic-git` and mapped via `isomorphicGitFsBridge`.
- Status computation maps the raw 4-tuple status matrix `[path, head, workdir, stage]` into clean staged, unstaged, and untracked file sets.
- Diff generation extracts HEAD/index/workdir blobs for Monaco Diff Editor.

### 3.3 Visual Commit Graph
- Topological DAG sorting in `src/services/git/graphLayout.ts`.
- Dynamically allocates branch lanes and draws smooth SVG Bezier paths connecting parent and child commits, merge commits, and ref badges.

### 3.4 3-Way Conflict Resolver
- Deterministically parses `<<<<<<<`, `=======`, and `>>>>>>>` markers in `src/services/git/conflictParser.ts`.
- Offers 1-click resolution (`Accept Current`, `Accept Incoming`, `Accept Both`) as well as manual editing before staging.

---

## 4. Future Desktop Roadmap (Tauri / Electron)
The architecture supports creating a desktop client by providing:
```typescript
class NativeGitAdapter implements GitService {
  // Invokes native git CLI / libgit2 via IPC
}
```
All UI components, contexts, and models remain 100% reusable across web and desktop builds.
