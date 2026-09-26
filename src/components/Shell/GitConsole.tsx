import React, { useState, useEffect, useRef } from 'react';
import { useUI } from '@/state/UIContext';
import { logger, LogEntry } from '@/services/logger/logger';
import { Terminal, Copy, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';

export const GitConsole: React.FC = () => {
  const { isConsoleOpen, setConsoleOpen } = useUI();
  const [entries, setEntries] = useState<LogEntry[]>(() => logger.getEntries());
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((entry) => {
      setEntries((prev) => [...prev, entry]);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isConsoleOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, isConsoleOpen]);

  const handleCopy = () => {
    const text = entries
      .map((e) => `[${e.timestamp}][${e.source.toUpperCase()}][${e.level}] ${e.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    logger.clear();
    setEntries([]);
  };

  if (!isConsoleOpen) {
    return (
      <div
        onClick={() => setConsoleOpen(true)}
        style={{
          height: '24px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          cursor: 'pointer',
          fontSize: '11px',
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={12} />
          <span>Git Output Console ({entries.length} events)</span>
        </div>
        <ChevronUp size={14} />
      </div>
    );
  }

  return (
    <div
      style={{
        height: '180px',
        borderTop: '1px solid var(--border)',
        backgroundColor: 'var(--code-bg)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: '28px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 500 }}>
          <Terminal size={13} color="var(--accent-text)" />
          <span>Git Engine Output & Diagnostics</span>
          <span style={{ color: 'var(--text-muted)' }}>({entries.length})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={handleCopy} title="Copy Output">
            {copied ? <Check size={12} color="var(--success-text)" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={handleClear} title="Clear Console">
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setConsoleOpen(false)}
            title="Collapse Console"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '11px',
          lineHeight: '1.6',
          color: 'var(--text-primary)',
        }}
      >
        {entries.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No Git commands recorded yet.</div>
        ) : (
          entries.map((entry) => {
            let color = 'var(--text-primary)';
            if (entry.level === 'ERROR') color = 'var(--danger-text)';
            else if (entry.level === 'WARN') color = 'var(--warning-text)';
            else if (entry.level === 'DEBUG') color = 'var(--text-muted)';
            else if (entry.source === 'git') color = 'var(--accent-text)';

            return (
              <div key={entry.id} style={{ display: 'flex', gap: '8px', wordBreak: 'break-all' }}>
                <span style={{ color: 'var(--text-muted)', userSelect: 'none' }}>{entry.timestamp}</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>[{entry.source}]</span>
                <span style={{ color }}>
                  {entry.message}
                  {entry.details && typeof entry.details === 'string' && entry.details !== entry.message
                    ? ` — ${entry.details}`
                    : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
