export function normalizePath(path: string): string {
  if (!path) return '';
  // Convert Windows backslashes to forward slashes
  let p = path.replace(/\\/g, '/');
  // Remove leading and trailing slashes
  p = p.replace(/^\/+|\/+$/g, '');
  
  const segments = p.split('/').filter(Boolean);
  const resolved: string[] = [];

  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      if (resolved.length > 0) {
        resolved.pop();
      } else {
        // Prevent path traversal outside root
        throw new Error(`Security Exception: Path traversal outside root: "${path}"`);
      }
    } else {
      resolved.push(seg);
    }
  }

  return resolved.join('/');
}

export function dirname(path: string): string {
  const norm = normalizePath(path);
  const lastSlash = norm.lastIndexOf('/');
  if (lastSlash === -1) return '';
  return norm.substring(0, lastSlash);
}

export function basename(path: string): string {
  const norm = normalizePath(path);
  const lastSlash = norm.lastIndexOf('/');
  if (lastSlash === -1) return norm;
  return norm.substring(lastSlash + 1);
}

export function join(...paths: string[]): string {
  const filtered = paths.filter(Boolean);
  if (filtered.length === 0) return '';
  return normalizePath(filtered.join('/'));
}
