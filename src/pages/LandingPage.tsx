import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useUI } from '@/state/UIContext';
import {
  FolderDown,
  FolderOpen,
  GitBranch,
  Sparkles,
  Check,
  ArrowRight,
  HardDrive,
  FileCode,
  PlusCircle,
  GitPullRequest,
} from 'lucide-react';
import { InitRepoModal } from '@/components/Modals/InitRepoModal';
import { GitignoreModal } from '@/components/Modals/GitignoreModal';
import { CreateProjectModal } from '@/components/Modals/CreateProjectModal';
import { CloneRepoModal } from '@/components/Modals/CloneRepoModal';

export const LandingPage: React.FC = () => {
  const {
    openDirectoryPicker,
    openDirectoryHandle,
    openVirtualProject,
    projectInfo,
    isOpen,
  } = useRepository();
  const { setActiveView } = useUI();

  const [isDragOver, setIsDragOver] = useState(false);
  const [isInitModalOpen, setInitModalOpen] = useState(false);
  const [isGitignoreModalOpen, setGitignoreModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isCloneModalOpen, setCloneModalOpen] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      // File System Access API support for drag and drop
      if ('getAsFileSystemHandle' in item) {
        try {
          const handle = await (item as any).getAsFileSystemHandle();
          if (handle && handle.kind === 'directory') {
            await openDirectoryHandle(handle as FileSystemDirectoryHandle);
            return;
          }
        } catch {
          // fallback
        }
      }
    }

    // Fallback info if dropped without directory handle permissions
    alert('Please use the "Open Folder" button if your browser restricts directory drag-and-drop.');
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        backgroundColor: 'var(--bg-primary)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div style={{ maxWidth: '580px', width: '100%', textAlign: 'center' }}>
        {/* Brand Header */}
        <div style={{ marginBottom: '28px' }}>
          <img src="/gitdrop-icon.svg" alt="GitDrop" style={{ width: '48px', height: '48px', marginBottom: '14px' }} />
          <h1 style={{ fontSize: '26px', fontWeight: 700, margin: '0 0 6px 0', letterSpacing: '-0.5px' }}>
            GitDrop
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Your visual Git workspace. Local-first, deterministic, zero-terminal.
          </p>
        </div>

        {/* Project Detected Card (If a directory is dropped/opened but not yet initialized or ready) */}
        {isOpen && projectInfo && (
          <div
            style={{
              marginBottom: '24px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              textAlign: 'left',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HardDrive size={18} color="var(--accent-text)" />
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Project Detected</h3>
              </div>
              <span
                className="badge-gitdrop"
                style={{
                  backgroundColor: projectInfo.isGit ? 'var(--success-subtle)' : 'var(--warning-subtle)',
                  color: projectInfo.isGit ? 'var(--success-text)' : 'var(--warning-text)',
                  padding: '3px 8px',
                }}
              >
                {projectInfo.isGit ? 'Git Initialized' : 'Git Not Initialized'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{projectInfo.name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Framework: </span>
                <strong style={{ color: 'var(--accent-text)' }}>{projectInfo.framework}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Files: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{projectInfo.filesCount}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Size: </span>
                <strong style={{ color: 'var(--text-primary)' }}>{formatSize(projectInfo.totalSizeBytes)}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {!projectInfo.isGit ? (
                <>
                  <button className="btn-gitdrop btn-gitdrop-primary" onClick={() => setInitModalOpen(true)}>
                    <GitBranch size={14} />
                    Initialize Git Repository
                  </button>
                  <button className="btn-gitdrop" onClick={() => setGitignoreModalOpen(true)}>
                    <FileCode size={14} />
                    Add .gitignore
                  </button>
                </>
              ) : (
                <button className="btn-gitdrop btn-gitdrop-primary" onClick={() => setActiveView('workspace')}>
                  Open Workspace
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Drag & Drop Target Area */}
        <div
          style={{
            border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isDragOver ? 'var(--accent-subtle)' : 'var(--bg-secondary)',
            padding: '44px 20px',
            marginBottom: '20px',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
          }}
          onClick={openDirectoryPicker}
        >
          <FolderDown
            size={40}
            color={isDragOver ? 'var(--accent-text)' : 'var(--text-secondary)'}
            style={{ marginBottom: '14px' }}
          />
          <h3 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            DROP YOUR PROJECT HERE
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Drag and drop a folder from your computer or click to browse
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn-gitdrop btn-gitdrop-primary"
            style={{ padding: '8px 24px', fontSize: '13px', width: '240px' }}
            onClick={openDirectoryPicker}
          >
            <FolderOpen size={16} />
            Open Local Folder
          </button>

          <div style={{ display: 'flex', gap: '8px', width: '240px' }}>
            <button
              className="btn-gitdrop"
              style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setCreateModalOpen(true)}
            >
              <PlusCircle size={14} />
              Create Repo
            </button>
            <button
              className="btn-gitdrop"
              style={{ flex: 1, fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setCloneModalOpen(true)}
            >
              <GitPullRequest size={14} />
              Clone Repo
            </button>
          </div>

          <button
            className="btn-gitdrop btn-gitdrop-subtle"
            style={{ fontSize: '12px', color: 'var(--accent-text)', marginTop: '4px' }}
            onClick={() => openVirtualProject('react-vite-demo')}
          >
            <Sparkles size={14} />
            Try with an In-Memory Virtual Starter Repo
          </button>
        </div>

        {/* Feature Highlights Footer */}
        <div
          style={{
            marginTop: '36px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-muted)',
            display: 'flex',
            justifyContent: 'center',
            gap: '24px',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} color="var(--success-text)" /> Local-First Private
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} color="var(--success-text)" /> Deterministic Git Engine
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={12} color="var(--success-text)" /> GitHub Sync
          </div>
        </div>
      </div>

      <InitRepoModal isOpen={isInitModalOpen} onClose={() => setInitModalOpen(false)} />
      <GitignoreModal isOpen={isGitignoreModalOpen} onClose={() => setGitignoreModalOpen(false)} />
      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      <CloneRepoModal isOpen={isCloneModalOpen} onClose={() => setCloneModalOpen(false)} />
    </div>
  );
};
