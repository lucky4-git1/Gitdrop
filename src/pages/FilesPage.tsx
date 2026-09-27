import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Save,
  Eye,
  Edit3,
  Columns,
  Check,
  RefreshCw,
  FolderGit2,
  FolderTree,
  Copy,
  Info,
} from 'lucide-react';
import { FileEntry } from '@/types/filesystem';
import { ProjectsWorkspace } from '@/components/Projects/ProjectsWorkspace';

export const FilesPage: React.FC = () => {
  const { fileSystem, activeProject, projectInfo } = useRepository();
  const { refresh, status } = useGit();
  const { theme, selectedDiffFile, setSelectedDiffFile } = useUI();

  // Active sub-tab in Files page: 'projects' vs 'explorer'
  const [subView, setSubView] = useState<'projects' | 'explorer'>(() => (fileSystem ? 'explorer' : 'projects'));
  const [tree, setTree] = useState<FileEntry[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['', 'src']));
  const [currentFile, setCurrentFile] = useState<string | null>(selectedDiffFile || 'README.md');
  const [fileContent, setFileContent] = useState<string>('');
  const [fileStat, setFileStat] = useState<{ size?: number; modified?: string }>({});
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mdMode, setMdMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [copiedPath, setCopiedPath] = useState(false);

  // If no project is open, default to projects workspace
  useEffect(() => {
    if (!fileSystem) {
      setSubView('projects');
    }
  }, [fileSystem]);

  // Load directory tree recursively up to depth 4
  const loadTree = useCallback(async () => {
    if (!fileSystem) return;

    async function buildDir(dirPath: string, depth = 0): Promise<FileEntry[]> {
      if (depth > 4) return [];
      try {
        const names = await fileSystem!.readdir(dirPath);
        const entries: FileEntry[] = [];

        for (const name of names) {
          if (name === '.git') continue;
          const fullPath = dirPath ? `${dirPath}/${name}` : name;
          try {
            const stat = await fileSystem!.stat(fullPath);
            const isDir = stat.isDirectory();
            entries.push({
              name,
              path: fullPath,
              isDirectory: isDir,
              size: isDir ? undefined : stat.size,
              children: isDir ? await buildDir(fullPath, depth + 1) : undefined,
            });
          } catch {
            // ignore
          }
        }

        // Sort directories first, then alphabetically
        return entries.sort((a, b) => {
          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
      } catch {
        return [];
      }
    }

    const rootEntries = await buildDir('');
    setTree(rootEntries);
  }, [fileSystem]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  // Load selected file content & metadata
  useEffect(() => {
    let isCancelled = false;
    async function loadContent() {
      if (!currentFile || !fileSystem) return;
      try {
        const [raw, stat] = await Promise.all([
          fileSystem.readFile(currentFile, { encoding: 'utf8' }).catch(() => ''),
          fileSystem.stat(currentFile).catch(() => null),
        ]);
        const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
        if (!isCancelled) {
          setFileContent(text);
          setFileStat({
            size: stat?.size,
            modified: stat ? new Date(stat.mtimeMs).toLocaleTimeString() : undefined,
          });
          setIsSaved(true);
        }
      } catch {
        if (!isCancelled) {
          setFileContent('');
          setIsSaved(true);
        }
      }
    }

    loadContent();
    return () => {
      isCancelled = true;
    };
  }, [currentFile, fileSystem]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const selectFile = (path: string) => {
    setCurrentFile(path);
    setSelectedDiffFile(path);
  };

  const handleSave = async () => {
    if (!currentFile || !fileSystem) return;
    setIsSaving(true);
    try {
      await fileSystem.writeFile(currentFile, fileContent);
      setIsSaved(true);
      await refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyFilePath = () => {
    if (!currentFile) return;
    const fullPath = activeProject?.path ? `${activeProject.path}/${currentFile}` : currentFile;
    navigator.clipboard.writeText(fullPath);
    setCopiedPath(true);
    setTimeout(() => setCopiedPath(false), 2000);
  };

  // Determine file status in working tree
  const fileGitStatus = useMemo(() => {
    if (!currentFile || !status) return 'Clean';
    if (status.conflicted.some((f) => f.path === currentFile)) return 'Conflicted';
    if (status.staged.some((f) => f.path === currentFile)) return 'Staged';
    if (status.unstaged.some((f) => f.path === currentFile)) {
      const match = status.unstaged.find((f) => f.path === currentFile);
      return match?.status === 'untracked' ? 'Untracked' : 'Modified';
    }
    return 'Clean';
  }, [currentFile, status]);

  const getLanguage = (path: string): string => {
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
      case 'toml':
        return 'ini';
      default:
        return 'plaintext';
    }
  };

  const isMarkdown = currentFile?.endsWith('.md');
  const sanitizedMarkdownHtml = isMarkdown
    ? DOMPurify.sanitize(marked.parse(fileContent, { async: false }) as string)
    : '';

  // Recursive Tree Node Renderer
  const renderTreeNodes = (nodes: FileEntry[]) => {
    return nodes.map((node) => {
      if (node.isDirectory) {
        const isOpen = openFolders.has(node.path);
        return (
          <div key={node.path} style={{ userSelect: 'none' }}>
            <div
              onClick={() => toggleFolder(node.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isOpen ? <FolderOpen size={14} color="var(--accent-text)" /> : <Folder size={14} color="var(--accent-text)" />}
              <span>{node.name}</span>
            </div>

            {isOpen && node.children && (
              <div style={{ paddingLeft: '14px', borderLeft: '1px solid var(--border-muted)', marginLeft: '10px' }}>
                {renderTreeNodes(node.children)}
              </div>
            )}
          </div>
        );
      }

      const isSelected = currentFile === node.path;
      return (
        <div
          key={node.path}
          onClick={() => selectFile(node.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontSize: '12px',
            backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
            color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
          }}
          onMouseLeave={(e) => {
            if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          {node.name.endsWith('.md') ? (
            <FileText size={14} color="var(--accent-text)" />
          ) : (
            <FileCode size={14} color="var(--text-muted)" />
          )}
          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {node.name}
          </span>
        </div>
      );
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Sub-navigation Header */}
      <div
        style={{
          height: '38px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
            style={{
              fontWeight: subView === 'projects' ? 600 : 400,
              backgroundColor: subView === 'projects' ? 'var(--bg-elevated)' : 'transparent',
              color: subView === 'projects' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
            onClick={() => setSubView('projects')}
          >
            <FolderGit2 size={14} />
            <span>My Projects</span>
          </button>

          {fileSystem && (
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              style={{
                fontWeight: subView === 'explorer' ? 600 : 400,
                backgroundColor: subView === 'explorer' ? 'var(--bg-elevated)' : 'transparent',
                color: subView === 'explorer' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              onClick={() => setSubView('explorer')}
            >
              <FolderTree size={14} />
              <span>Active Files ({activeProject?.displayName || activeProject?.name || projectInfo?.name})</span>
            </button>
          )}
        </div>

        {fileSystem && subView === 'explorer' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              onClick={handleCopyFilePath}
              title="Copy Full File Path"
            >
              {copiedPath ? <Check size={13} color="var(--success-text)" /> : <Copy size={13} />}
              <span>{copiedPath ? 'Copied Path!' : 'Copy Path'}</span>
            </button>
            <button
              className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
              onClick={handleSave}
              disabled={isSaved || isSaving}
            >
              <Save size={13} />
              <span>{isSaved ? 'Saved' : 'Save File'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {subView === 'projects' ? (
        <ProjectsWorkspace />
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Pane: File Tree Explorer */}
          <div
            style={{
              width: '260px',
              borderRight: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                height: '36px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                letterSpacing: '0.5px',
              }}
            >
              <span>FILE EXPLORER</span>
              <button
                className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                style={{ padding: '2px 4px' }}
                onClick={loadTree}
                title="Refresh File Tree"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
              {tree.length === 0 ? (
                <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Loading files...
                </div>
              ) : (
                renderTreeNodes(tree)
              )}
            </div>

            {/* Selected File Details Footer */}
            {currentFile && (
              <div
                style={{
                  padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-elevated)',
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentFile}</span>
                  <span
                    className="badge-gitdrop"
                    style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      backgroundColor:
                        fileGitStatus === 'Modified'
                          ? 'var(--warning-subtle)'
                          : fileGitStatus === 'Clean'
                          ? 'var(--success-subtle)'
                          : 'var(--accent-subtle)',
                      color:
                        fileGitStatus === 'Modified'
                          ? 'var(--warning-text)'
                          : fileGitStatus === 'Clean'
                          ? 'var(--success-text)'
                          : 'var(--accent-text)',
                    }}
                  >
                    {fileGitStatus}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>{fileStat.size ? `${(fileStat.size / 1024).toFixed(1)} KB` : ''}</span>
                  <span>{fileStat.modified ? `Modified ${fileStat.modified}` : ''}</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Pane: Code / Markdown Editor */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
            {currentFile ? (
              <>
                {/* Editor Header Bar */}
                <div
                  style={{
                    height: '36px',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{currentFile}</span>
                    {!isSaved && (
                      <span style={{ color: 'var(--warning-text)', fontSize: '11px' }}>● Unsaved</span>
                    )}
                  </div>

                  {isMarkdown && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        style={{ backgroundColor: mdMode === 'edit' ? 'var(--bg-elevated)' : 'transparent' }}
                        onClick={() => setMdMode('edit')}
                        title="Edit Code"
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        style={{ backgroundColor: mdMode === 'preview' ? 'var(--bg-elevated)' : 'transparent' }}
                        onClick={() => setMdMode('preview')}
                        title="Rendered Preview"
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        style={{ backgroundColor: mdMode === 'split' ? 'var(--bg-elevated)' : 'transparent' }}
                        onClick={() => setMdMode('split')}
                        title="Side-by-Side Split"
                      >
                        <Columns size={13} />
                        <span>Split</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Editor Body */}
                <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
                  {/* Monaco Editor Pane */}
                  {(!isMarkdown || mdMode === 'edit' || mdMode === 'split') && (
                    <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
                      <Editor
                        height="100%"
                        language={getLanguage(currentFile)}
                        theme={theme === 'dark' ? 'vs-dark' : 'light'}
                        value={fileContent}
                        onChange={(value) => {
                          setFileContent(value || '');
                          setIsSaved(false);
                        }}
                        options={{
                          fontSize: 13,
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          wordWrap: 'on',
                        }}
                      />
                    </div>
                  )}

                  {/* Markdown Preview Pane */}
                  {isMarkdown && (mdMode === 'preview' || mdMode === 'split') && (
                    <div
                      style={{
                        flex: 1,
                        borderLeft: mdMode === 'split' ? '1px solid var(--border)' : 'none',
                        padding: '24px 32px',
                        overflowY: 'auto',
                        backgroundColor: 'var(--bg-elevated)',
                        color: 'var(--text-primary)',
                        lineHeight: '1.6',
                        fontSize: '14px',
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizedMarkdownHtml }}
                    />
                  )}
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Info size={32} style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0 }}>Select a file from the explorer to view or edit</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
