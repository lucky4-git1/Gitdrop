import React, { useState, useEffect } from 'react';
import { useGit } from '@/state/GitContext';
import { useRepository } from '@/state/RepositoryContext';
import { useUI } from '@/state/UIContext';
import Editor from '@monaco-editor/react';
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  Split,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import {
  parseConflicts,
  hasConflictMarkers,
  resolveAcceptCurrent,
  resolveAcceptIncoming,
  resolveAcceptBoth,
} from '@/services/git/conflictParser';

export const ConflictsPage: React.FC = () => {
  const { status, stageFiles, refresh } = useGit();
  const { fileSystem } = useRepository();
  const { theme, setActiveView } = useUI();

  const [conflictedFiles, setConflictedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [resultContent, setResultContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Scan repository for files with conflict markers
  useEffect(() => {
    let isCancelled = false;
    async function scanConflicts() {
      if (!fileSystem) return;
      const found: string[] = [];

      // Check all unstaged files for conflict markers
      const checkCandidates = status?.unstaged || [];
      for (const f of checkCandidates) {
        try {
          const content = await fileSystem.readFile(f.path, { encoding: 'utf8' });
          if (typeof content === 'string' && hasConflictMarkers(content)) {
            found.push(f.path);
          }
        } catch {
          // ignore
        }
      }

      if (!isCancelled) {
        setConflictedFiles(found);
        if (found.length > 0 && !selectedFile) {
          setSelectedFile(found[0]);
        }
      }
    }

    scanConflicts();
    return () => {
      isCancelled = true;
    };
  }, [fileSystem, status, selectedFile]);

  // Load content of selected conflicted file
  useEffect(() => {
    let isCancelled = false;
    async function loadContent() {
      if (!selectedFile || !fileSystem) return;
      try {
        const raw = await fileSystem.readFile(selectedFile, { encoding: 'utf8' });
        const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
        if (!isCancelled) {
          setFileContent(text);
          setResultContent(text);
        }
      } catch {
        if (!isCancelled) {
          setFileContent('');
          setResultContent('');
        }
      }
    }
    loadContent();
    return () => {
      isCancelled = true;
    };
  }, [selectedFile, fileSystem]);

  const parsed = parseConflicts(fileContent);

  const handleAcceptCurrent = () => {
    const resolved = resolveAcceptCurrent(fileContent);
    setResultContent(resolved);
  };

  const handleAcceptIncoming = () => {
    const resolved = resolveAcceptIncoming(fileContent);
    setResultContent(resolved);
  };

  const handleAcceptBoth = () => {
    const resolved = resolveAcceptBoth(fileContent);
    setResultContent(resolved);
  };

  const handleMarkResolved = async () => {
    if (!selectedFile || !fileSystem) return;
    setIsSaving(true);
    try {
      // 1. Write resolved content to filesystem
      await fileSystem.writeFile(selectedFile, resultContent);
      // 2. Stage resolved file
      await stageFiles([selectedFile]);
      // 3. Refresh git status
      await refresh();
      // Remove from conflicted files
      setConflictedFiles((prev) => prev.filter((f) => f !== selectedFile));
      setSelectedFile(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Left Pane: Conflicted Files List */}
      <div
        style={{
          width: '280px',
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: '12px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} color="var(--danger-text)" />
          <div style={{ fontSize: '13px', fontWeight: 600 }}>
            Conflicts ({conflictedFiles.length})
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {conflictedFiles.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
              <CheckCircle2 size={32} color="var(--success-text)" style={{ marginBottom: '8px' }} />
              <div>No conflicts detected!</div>
              <button
                className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                style={{ marginTop: '12px' }}
                onClick={() => setActiveView('changes')}
              >
                Go to Changes & Commit
                <ArrowRight size={12} />
              </button>
            </div>
          ) : (
            conflictedFiles.map((file) => {
              const isSelected = file === selectedFile;
              return (
                <div
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px',
                    color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  <FileCode size={14} color="var(--danger-text)" />
                  <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {file}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane: 3-Way Conflict Resolver & Result Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {selectedFile ? (
          <>
            {/* Header with Quick Action Controls */}
            <div
              style={{
                height: '48px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Split size={16} color="var(--accent-text)" />
                <span style={{ fontWeight: 600, fontSize: '13px' }}>{selectedFile}</span>
                <span className="badge-gitdrop" style={{ backgroundColor: 'var(--danger-subtle)', color: 'var(--danger-text)' }}>
                  {parsed.conflicts.length} conflict{parsed.conflicts.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Resolution Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-gitdrop btn-gitdrop-sm"
                  onClick={handleAcceptCurrent}
                  title="Keep current branch (HEAD)"
                >
                  Accept Current
                </button>
                <button
                  className="btn-gitdrop btn-gitdrop-sm"
                  onClick={handleAcceptIncoming}
                  title="Keep incoming branch"
                >
                  Accept Incoming
                </button>
                <button
                  className="btn-gitdrop btn-gitdrop-sm"
                  onClick={handleAcceptBoth}
                  title="Keep both changes"
                >
                  Accept Both
                </button>

                <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />

                <button
                  className="btn-gitdrop btn-gitdrop-success btn-gitdrop-sm"
                  onClick={handleMarkResolved}
                  disabled={isSaving || hasConflictMarkers(resultContent)}
                  title={hasConflictMarkers(resultContent) ? 'Cannot resolve while conflict markers exist' : 'Stage file and mark resolved'}
                >
                  <Check size={13} />
                  <span>{isSaving ? 'Resolving...' : 'Mark Resolved & Stage'}</span>
                </button>
              </div>
            </div>

            {/* Split Conflict Visualizer & Monaco Editor */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Conflict Blocks Preview */}
              {parsed.hasConflicts && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderBottom: '1px solid var(--border)',
                    padding: '10px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '140px',
                    overflowY: 'auto',
                    fontSize: '11px',
                  }}
                >
                  {parsed.conflicts.map((c) => (
                    <div
                      key={c.id}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        padding: '6px 8px',
                        backgroundColor: 'var(--bg-primary)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div>
                        <div style={{ color: 'var(--accent-text)', fontWeight: 600 }}>CURRENT ({c.currentBranch})</div>
                        <pre style={{ margin: 0, color: 'var(--text-secondary)' }}>{c.currentText}</pre>
                      </div>
                      <div>
                        <div style={{ color: 'var(--success-text)', fontWeight: 600 }}>INCOMING ({c.incomingBranch})</div>
                        <pre style={{ margin: 0, color: 'var(--text-secondary)' }}>{c.incomingText}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Editable Result Buffer */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <Editor
                  value={resultContent}
                  onChange={(val) => setResultContent(val || '')}
                  theme={theme === 'light' ? 'light' : 'vs-dark'}
                  options={{
                    fontSize: 12,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conflicted file on the left to resolve.
          </div>
        )}
      </div>
    </div>
  );
};
