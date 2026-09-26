import React, { useState, useEffect, useCallback } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  Save,
  Eye,
  Edit3,
  Columns,
  Check,
  RefreshCw,
} from 'lucide-react';
import { FileEntry } from '@/types/filesystem';

export const FilesPage: React.FC = () => {
  const { fileSystem } = useRepository();
  const { refresh } = useGit();
  const { theme, selectedDiffFile, setSelectedDiffFile } = useUI();

  const [tree, setTree] = useState<FileEntry[]>([]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['', 'src']));
  const [currentFile, setCurrentFile] = useState<string | null>(selectedDiffFile || 'README.md');
  const [fileContent, setFileContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [mdMode, setMdMode] = useState<'edit' | 'preview' | 'split'>('split');

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

  // Load selected file content
  useEffect(() => {
    let isCancelled = false;
    async function loadContent() {
      if (!currentFile || !fileSystem) return;
      try {
        const raw = await fileSystem.readFile(currentFile, { encoding: 'utf8' });
        const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw);
        if (!isCancelled) {
          setFileContent(text);
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
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            letterSpacing: '0.5px',
          }}
        >
          <span>Repository Files</span>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={loadTree} title="Refresh File Tree">
            <RefreshCw size={12} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {tree.length === 0 ? (
            <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '11px' }}>
              No files found in workspace.
            </div>
          ) : (
            renderTreeNodes(tree)
          )}
        </div>
      </div>

      {/* Right Pane: Monaco Code Editor & Markdown Viewer */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {currentFile ? (
          <>
            {/* Editor Action Bar */}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <File size={14} color="var(--accent-text)" />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currentFile}
                </span>
                {!isSaved && (
                  <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--warning-text)' }} title="Unsaved changes" />
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isMarkdown && (
                  <div style={{ display: 'flex', gap: '2px', marginRight: '6px' }}>
                    <button
                      className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${mdMode === 'edit' ? 'btn-gitdrop-primary' : ''}`}
                      onClick={() => setMdMode('edit')}
                    >
                      <Edit3 size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${mdMode === 'preview' ? 'btn-gitdrop-primary' : ''}`}
                      onClick={() => setMdMode('preview')}
                    >
                      <Eye size={12} />
                      <span>Preview</span>
                    </button>
                    <button
                      className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${mdMode === 'split' ? 'btn-gitdrop-primary' : ''}`}
                      onClick={() => setMdMode('split')}
                    >
                      <Columns size={12} />
                      <span>Split</span>
                    </button>
                  </div>
                )}

                <button
                  className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                >
                  {isSaved ? <Check size={12} /> : <Save size={12} />}
                  <span>{isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* Editor Workspace Area */}
            <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
              {/* Code Editor (if edit mode or split mode or non-markdown) */}
              {(!isMarkdown || mdMode !== 'preview') && (
                <div style={{ flex: 1, minHeight: 0, borderRight: isMarkdown && mdMode === 'split' ? '1px solid var(--border)' : 'none' }}>
                  <Editor
                    value={fileContent}
                    language={getLanguage(currentFile)}
                    theme={theme === 'light' ? 'light' : 'vs-dark'}
                    onChange={(val) => {
                      setFileContent(val || '');
                      setIsSaved(false);
                    }}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                    }}
                  />
                </div>
              )}

              {/* Rendered Markdown Preview Area */}
              {isMarkdown && (mdMode === 'preview' || mdMode === 'split') && (
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '24px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    lineHeight: '1.6',
                    fontSize: '13px',
                  }}
                  dangerouslySetInnerHTML={{ __html: sanitizedMarkdownHtml }}
                />
              )}
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a file on the left to edit or preview.
          </div>
        )}
      </div>
    </div>
  );
};
