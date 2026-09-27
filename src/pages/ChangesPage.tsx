import React, { useState, useEffect, useMemo } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import { DiffEditor } from '@monaco-editor/react';
import {
  CheckCircle2,
  Plus,
  Minus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Columns,
  SquareSplitHorizontal,
  ArrowUpRight,
  Bookmark,
  FileCode,
} from 'lucide-react';
import { DiffFile, GitFileStatus } from '@/types/git';
import { StashModal } from '@/components/Modals/BranchModals';
import { PublishModal } from '@/components/Modals/PublishModal';

export const ChangesPage: React.FC = () => {
  const {
    status,
    stageFiles,
    unstageFiles,
    stageAll,
    unstageAll,
    discardFiles,
    commit,
    push,
    remotes,
  } = useGit();

  const {
    selectedDiffFile,
    setSelectedDiffFile,
    diffMode,
    setDiffMode,
    theme,
    requestConfirm,
  } = useUI();

  const [commitMessage, setCommitMessage] = useState('');
  const [isAmend, setIsAmend] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isPublishModalOpen, setPublishModalOpen] = useState(false);
  const [diffData, setDiffData] = useState<DiffFile | null>(null);
  const [isStashModalOpen, setStashModalOpen] = useState(false);

  // All changed files
  const stagedFiles = useMemo(() => status?.staged || [], [status?.staged]);
  const unstagedFiles = useMemo(() => status?.unstaged || [], [status?.unstaged]);
  const allChangedFiles = useMemo(() => {
    const list: { file: GitFileStatus; isStaged: boolean }[] = [];
    stagedFiles.forEach((f) => list.push({ file: f, isStaged: true }));
    unstagedFiles.forEach((f) => list.push({ file: f, isStaged: false }));
    return list;
  }, [stagedFiles, unstagedFiles]);

  // Default select first changed file if none selected
  useEffect(() => {
    if (!selectedDiffFile && allChangedFiles.length > 0) {
      setSelectedDiffFile(allChangedFiles[0].file.path);
    }
  }, [selectedDiffFile, allChangedFiles, setSelectedDiffFile]);

  // Fetch diff content when selected file changes
  const { gitService } = useRepository();
  useEffect(() => {
    let isCancelled = false;
    async function loadDiff() {
      if (!selectedDiffFile) {
        setDiffData(null);
        return;
      }

      const isStaged = stagedFiles.some((f) => f.path === selectedDiffFile);
      try {
        if (gitService) {
          const diffs = await gitService.diff({
            filepath: selectedDiffFile,
            staged: isStaged,
          });
          if (!isCancelled && diffs.length > 0) {
            setDiffData(diffs[0]);
          }
        }
      } catch {
        if (!isCancelled) {
          setDiffData(null);
        }
      }
    }

    loadDiff();
    return () => {
      isCancelled = true;
    };
  }, [selectedDiffFile, stagedFiles, gitService]);

  const handleStageFile = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    await stageFiles([path]);
  };

  const handleUnstageFile = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    await unstageFiles([path]);
  };

  const handleDiscardFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    requestConfirm({
      title: 'Discard Changes?',
      message: `Are you sure you want to discard all changes in "${path}"? This action cannot be undone.`,
      isDanger: true,
      confirmText: 'Discard Changes',
      onConfirm: () => discardFiles([path]),
    });
  };

  const handleDiscardAll = () => {
    requestConfirm({
      title: 'Discard All Unstaged Changes?',
      message: `Are you sure you want to discard changes in all ${unstagedFiles.length} unstaged files? All local modifications will be permanently lost.`,
      isDanger: true,
      confirmText: 'Discard All',
      onConfirm: () => discardFiles(unstagedFiles.map((f) => f.path)),
    });
  };

  const handleCommit = async (shouldPush = false) => {
    if (!commitMessage.trim()) return;
    if (stagedFiles.length === 0 && !isAmend) return;

    setIsCommitting(true);
    try {
      await commit(commitMessage.trim(), isAmend);
      setCommitMessage('');
      setIsAmend(false);

      if (shouldPush) {
        if (remotes.length > 0) {
          await push();
        } else {
          setPublishModalOpen(true);
        }
      }
    } finally {
      setIsCommitting(false);
    }
  };

  // Next and Previous File navigation
  const currentIndex = allChangedFiles.findIndex((f) => f.file.path === selectedDiffFile);
  const handlePrevFile = () => {
    if (currentIndex > 0) {
      setSelectedDiffFile(allChangedFiles[currentIndex - 1].file.path);
    }
  };
  const handleNextFile = () => {
    if (currentIndex < allChangedFiles.length - 1) {
      setSelectedDiffFile(allChangedFiles[currentIndex + 1].file.path);
    }
  };

  const getLanguageFromPath = (path: string): string => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'md':
        return 'markdown';
      case 'rs':
        return 'rust';
      case 'py':
        return 'python';
      case 'go':
        return 'go';
      default:
        return 'plaintext';
    }
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Left Column: File Staging Lists & Commit Box */}
      <div
        style={{
          width: '320px',
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Header / Stash Trigger */}
        <div
          style={{
            padding: '10px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 600 }}>
            Changes ({stagedFiles.length + unstagedFiles.length})
          </div>
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            onClick={() => setStashModalOpen(true)}
            title="Stash Changes"
          >
            <Bookmark size={13} />
            <span>Stash</span>
          </button>
        </div>

        {/* Scrollable File Lists */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* Staged Section */}
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <span>Staged ({stagedFiles.length})</span>
              {stagedFiles.length > 0 && (
                <button
                  className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                  style={{ padding: '0 4px', fontSize: '10px' }}
                  onClick={unstageAll}
                  title="Unstage All"
                >
                  Unstage All
                </button>
              )}
            </div>

            {stagedFiles.length === 0 ? (
              <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                No staged changes
              </div>
            ) : (
              stagedFiles.map((file) => {
                const isSelected = selectedDiffFile === file.path;
                return (
                  <div
                    key={`staged-${file.path}`}
                    onClick={() => setSelectedDiffFile(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span className="badge-gitdrop badge-gitdrop-added" style={{ fontSize: '9px', padding: '0 4px' }}>
                        {file.status[0].toUpperCase()}
                      </span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {file.path}
                      </span>
                    </div>

                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      onClick={(e) => handleUnstageFile(e, file.path)}
                      title="Unstage"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Unstaged Section */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 6px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <span>Unstaged ({unstagedFiles.length})</span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {unstagedFiles.length > 0 && (
                  <>
                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      style={{ padding: '0 4px', fontSize: '10px' }}
                      onClick={handleDiscardAll}
                      title="Discard All Unstaged"
                    >
                      Discard All
                    </button>
                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      style={{ padding: '0 4px', fontSize: '10px' }}
                      onClick={stageAll}
                      title="Stage All"
                    >
                      Stage All
                    </button>
                  </>
                )}
              </div>
            </div>

            {unstagedFiles.length === 0 ? (
              <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--text-muted)' }}>
                No unstaged changes
              </div>
            ) : (
              unstagedFiles.map((file) => {
                const isSelected = selectedDiffFile === file.path;
                let badgeClass = 'badge-gitdrop-modified';
                if (file.status === 'added' || file.status === 'untracked') badgeClass = 'badge-gitdrop-untracked';
                else if (file.status === 'deleted') badgeClass = 'badge-gitdrop-deleted';

                return (
                  <div
                    key={`unstaged-${file.path}`}
                    onClick={() => setSelectedDiffFile(file.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '12px',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                      <span className={`badge-gitdrop ${badgeClass}`} style={{ fontSize: '9px', padding: '0 4px' }}>
                        {file.status === 'untracked' ? '?' : file.status[0].toUpperCase()}
                      </span>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {file.path}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        onClick={(e) => handleDiscardFile(e, file.path)}
                        title="Discard changes"
                      >
                        <Trash2 size={12} color="var(--danger-text)" />
                      </button>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        onClick={(e) => handleStageFile(e, file.path)}
                        title="Stage file"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Commit Experience Panel (Bottom of Left Pane) */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-elevated)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>{stagedFiles.length} staged file{stagedFiles.length !== 1 ? 's' : ''}</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAmend}
                onChange={(e) => setIsAmend(e.target.checked)}
              />
              <span>Amend</span>
            </label>
          </div>

          <textarea
            className="form-control-gitdrop"
            rows={3}
            placeholder="Commit message (Ctrl+Enter to commit)..."
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                handleCommit(false);
              }
            }}
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-gitdrop btn-gitdrop-primary"
              style={{ flex: 1 }}
              onClick={() => handleCommit(false)}
              disabled={isCommitting || !commitMessage.trim() || (stagedFiles.length === 0 && !isAmend)}
            >
              <CheckCircle2 size={14} />
              <span>{isCommitting ? 'Committing...' : 'Commit'}</span>
            </button>

            <button
              className="btn-gitdrop btn-gitdrop-success"
              style={{ flex: 1 }}
              onClick={() => handleCommit(true)}
              disabled={isCommitting || !commitMessage.trim() || (stagedFiles.length === 0 && !isAmend)}
              title={remotes.length > 0 ? 'Commit & Push to Remote' : 'Commit & Push to GitHub'}
            >
              <ArrowUpRight size={14} />
              <span>{remotes.length > 0 ? 'Commit & Push' : 'Commit & Push to GitHub'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Monaco Diff Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {selectedDiffFile ? (
          <>
            {/* Diff Header */}
            <div
              style={{
                height: '36px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 14px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileCode size={16} color="var(--accent-text)" />
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedDiffFile}
                </span>
                {diffData && (
                  <span className={`badge-gitdrop badge-gitdrop-${diffData.status}`} style={{ fontSize: '10px' }}>
                    {diffData.status}
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Previous / Next navigation */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                    onClick={handlePrevFile}
                    disabled={currentIndex <= 0}
                    title="Previous changed file"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                    onClick={handleNextFile}
                    disabled={currentIndex >= allChangedFiles.length - 1}
                    title="Next changed file"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />

                {/* Diff View Mode: Side-by-side vs Inline */}
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button
                    className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${diffMode === 'side-by-side' ? 'btn-gitdrop-primary' : ''}`}
                    onClick={() => setDiffMode('side-by-side')}
                    title="Side-by-side Diff"
                  >
                    <Columns size={13} />
                    <span>Split</span>
                  </button>
                  <button
                    className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${diffMode === 'inline' ? 'btn-gitdrop-primary' : ''}`}
                    onClick={() => setDiffMode('inline')}
                    title="Inline Unified Diff"
                  >
                    <SquareSplitHorizontal size={13} />
                    <span>Unified</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Monaco Diff Editor Instance */}
            <div style={{ flex: 1, minHeight: 0 }}>
              <DiffEditor
                original={diffData?.oldContent ?? ''}
                modified={diffData?.newContent ?? ''}
                language={getLanguageFromPath(selectedDiffFile)}
                theme={theme === 'light' ? 'light' : 'vs-dark'}
                options={{
                  renderSideBySide: diffMode === 'side-by-side',
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 12,
                  automaticLayout: true,
                }}
              />
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            <CheckCircle2 size={36} color="var(--success-text)" style={{ marginBottom: '12px' }} />
            <div>No changes detected. Working tree is completely clean.</div>
          </div>
        )}
      </div>

      <StashModal isOpen={isStashModalOpen} onClose={() => setStashModalOpen(false)} />
      <PublishModal isOpen={isPublishModalOpen} onClose={() => setPublishModalOpen(false)} />
    </div>
  );
};
