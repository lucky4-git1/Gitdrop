export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  source: 'git' | 'app' | 'remote' | 'fs';
  message: string;
  details?: unknown;
}

type LogListener = (entry: LogEntry) => void;

class LoggerService {
  private listeners: Set<LogListener> = new Set();
  private entries: LogEntry[] = [];
  private readonly maxEntries = 1000;

  // Sensitive patterns to scrub
  private sanitize(str: string): string {
    if (!str) return '';
    return str
      // GitHub PAT tokens: ghp_..., gho_..., github_pat_...
      .replace(/(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{30,}/g, '$1_***REDACTED***')
      .replace(/github_pat_[A-Za-z0-9_]{50,}/g, 'github_pat_***REDACTED***')
      // Generic bearer or basic auth tokens
      .replace(/(Authorization:\s*(Bearer|token)\s+)[^\s]+/gi, '$1***REDACTED***')
      // URL passwords: https://user:pass@github.com
      .replace(/:\/\/([^:@]+):([^@]+)@/g, '://$1:***REDACTED***@');
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getEntries(): LogEntry[] {
    return [...this.entries];
  }

  public clear(): void {
    this.entries = [];
  }

  public log(level: LogLevel, source: LogEntry['source'], message: string, details?: unknown): void {
    const sanitizedMsg = this.sanitize(message);
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      source,
      message: sanitizedMsg,
      details,
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }

    this.listeners.forEach((l) => l(entry));

    // Console output for dev
    const prefix = `[GitDrop:${source.toUpperCase()}][${level}]`;
    if (level === 'ERROR') {
      console.error(prefix, sanitizedMsg, details ?? '');
    } else if (level === 'WARN') {
      console.warn(prefix, sanitizedMsg, details ?? '');
    } else if (level === 'INFO') {
      console.info(prefix, sanitizedMsg, details ?? '');
    } else {
      console.debug(prefix, sanitizedMsg, details ?? '');
    }
  }

  public debug(source: LogEntry['source'], message: string, details?: unknown) {
    this.log('DEBUG', source, message, details);
  }

  public info(source: LogEntry['source'], message: string, details?: unknown) {
    this.log('INFO', source, message, details);
  }

  public warn(source: LogEntry['source'], message: string, details?: unknown) {
    this.log('WARN', source, message, details);
  }

  public error(source: LogEntry['source'], message: string, details?: unknown) {
    this.log('ERROR', source, message, details);
  }
}

export const logger = new LoggerService();
