import React, { useState } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import { GITIGNORE_PRESETS, generateGitignoreContent } from '@/services/project/gitignoreTemplates';
import { FileCode, X, Check } from 'lucide-react';

interface GitignoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitignoreModal: React.FC<GitignoreModalProps> = ({ isOpen, onClose }) => {
  const { fileSystem } = useRepository();
  const { refresh } = useGit();
  const { requestConfirm } = useUI();

  const [selectedIds, setSelectedIds] = useState<string[]>(['node', 'react', 'vite', 'vscode', 'macos', 'windows']);
  const [activeTab, setActiveTab] = useState<'presets' | 'preview'>('presets');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const togglePreset = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const previewContent = generateGitignoreContent(selectedIds);

  const writeGitignore = async () => {
    if (!fileSystem) return;
    setIsGenerating(true);
    try {
      await fileSystem.writeFile('.gitignore', previewContent);
      await refresh();
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!fileSystem) return;
    const exists = await fileSystem.exists('.gitignore');
    if (exists) {
      requestConfirm({
        title: 'Overwrite .gitignore?',
        message: 'A .gitignore file already exists in this repository. Overwriting it will replace your current rules with the generated ones.',
        isDanger: true,
        confirmText: 'Overwrite',
        onConfirm: writeGitignore,
      });
    } else {
      await writeGitignore();
    }
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title">
            <FileCode size={16} />
            Visual .gitignore Generator
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 16px', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${activeTab === 'presets' ? 'btn-gitdrop-primary' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'presets' ? '2px solid var(--accent)' : 'none', padding: '8px 12px' }}
            onClick={() => setActiveTab('presets')}
          >
            Presets ({selectedIds.length})
          </button>
          <button
            className={`btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm ${activeTab === 'preview' ? 'btn-gitdrop-primary' : ''}`}
            style={{ borderRadius: 0, borderBottom: activeTab === 'preview' ? '2px solid var(--accent)' : 'none', padding: '8px 12px' }}
            onClick={() => setActiveTab('preview')}
          >
            Preview Output
          </button>
        </div>

        <div className="modal-gitdrop-body" style={{ maxHeight: '400px' }}>
          {activeTab === 'presets' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
              {GITIGNORE_PRESETS.map((preset) => {
                const isSelected = selectedIds.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => togglePreset(preset.id)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      backgroundColor: isSelected ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                      color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                    }}
                  >
                    <span>{preset.name}</span>
                    {isSelected && <Check size={14} color="var(--accent-text)" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <pre
              style={{
                margin: 0,
                padding: '12px',
                backgroundColor: 'var(--code-bg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                maxHeight: '350px',
                overflowY: 'auto',
                fontSize: '11px',
              }}
            >
              {previewContent}
            </pre>
          )}
        </div>

        <div className="modal-gitdrop-footer">
          <button className="btn-gitdrop" onClick={onClose} disabled={isGenerating}>
            Cancel
          </button>
          <button
            className="btn-gitdrop btn-gitdrop-primary"
            onClick={handleGenerate}
            disabled={selectedIds.length === 0 || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate .gitignore'}
          </button>
        </div>
      </div>
    </div>
  );
};
