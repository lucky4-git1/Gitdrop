import { describe, it, expect } from 'vitest';
import { normalizePath } from '../filesystem/pathUtils';
import { logger } from '../logger/logger';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

describe('Security & Sanitization Suite', () => {
  it('prevents path traversal attacks escaping root directory', () => {
    expect(() => normalizePath('../../etc/passwd')).toThrow(/Security Exception/);
    expect(() => normalizePath('src/../../etc/passwd')).toThrow(/Security Exception/);
    expect(normalizePath('src/../components/App.tsx')).toBe('components/App.tsx');
  });

  it('scrubs GitHub personal access tokens from log outputs', () => {
    let captured = '';
    const unsubscribe = logger.subscribe((entry) => {
      captured = entry.message;
    });

    const secretToken = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
    logger.info('remote', `Connecting with token: ${secretToken}`);

    expect(captured).not.toContain(secretToken);
    expect(captured).toContain('ghp_***REDACTED***');
    unsubscribe();
  });

  it('sanitizes malicious XSS in rendered Markdown', async () => {
    const maliciousMarkdown = `
# Normal Heading
<script>alert('XSS')</script>
<img src="x" onerror="alert('XSS')" />
<a href="javascript:alert('XSS')">Malicious Link</a>
`;
    const parsedHtml = await marked.parse(maliciousMarkdown);
    const clean = DOMPurify.sanitize(parsedHtml);

    expect(clean).toContain('<h1>Normal Heading</h1>');
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror=');
    expect(clean).not.toContain('javascript:');
  });
});
