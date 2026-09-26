# GitDrop Security Policy

## Security Model & Principles

GitDrop is engineered around **local-first privacy** and **zero untrusted server transmission**.

### 1. Zero Source Code Uploads
GitDrop does not upload, copy, or index your local project source code to any third-party or GitDrop servers. All repository inspection, status calculation, staging, diffing, and committing happen locally in your browser process.

### 2. Path Traversal Prevention
GitDrop strictly enforces path sanitization across all filesystem operations. Any attempt to traverse outside the user-selected repository directory root via `..` or symbolic link path escapes is immediately terminated with a `Security Exception`.

### 3. Credential & Secret Scrubbing
- GitHub Personal Access Tokens and OAuth tokens are stored in browser session storage (`sessionStorage`) and are cleared when the session closes.
- Tokens are never exposed in application logs or console output. A deterministic regex filter automatically scrubs tokens (`ghp_***`, `github_pat_***`, `Bearer ***`) before log emission.
- Tokens are never passed in URL query strings.

### 4. Content Sanitization & XSS Protection
- All rendered Markdown content (such as project READMEs) is sanitized using DOMPurify before DOM injection to eliminate script execution, `onerror` vectors, and unsafe `javascript:` protocol links.
- Monaco Editor runs in isolated render contexts without arbitrary HTML injection.

### 5. No Automatic Code Execution
- GitDrop never automatically runs repository scripts (`npm install`, `build`, `make`, etc.).
- GitDrop never executes arbitrary shell commands in the background.

## Reporting Vulnerabilities
If you discover any security issue, please contact security@gitdrop.local with details.
