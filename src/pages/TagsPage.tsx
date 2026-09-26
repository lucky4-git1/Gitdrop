import React, { useState } from 'react';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import { Tag, Plus, Trash2, ArrowUpRight, Copy, Check } from 'lucide-react';
import { CreateTagModal } from '@/components/Modals/BranchModals';

export const TagsPage: React.FC = () => {
  const { tags, deleteTag, push } = useGit();
  const { requestConfirm } = useUI();

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  const handleDelete = (tagName: string) => {
    requestConfirm({
      title: `Delete Tag "${tagName}"?`,
      message: `Are you sure you want to delete tag "${tagName}"?`,
      isDanger: true,
      confirmText: 'Delete Tag',
      onConfirm: () => deleteTag(tagName),
    });
  };

  const handleCopy = (oid: string, tagName: string) => {
    navigator.clipboard.writeText(oid);
    setCopiedTag(tagName);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px 0' }}>
              Tags
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
              Mark specific points in repository history as releases or milestones.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-gitdrop btn-gitdrop-primary" onClick={() => setCreateModalOpen(true)}>
              <Plus size={14} />
              <span>Create Tag</span>
            </button>
            <button className="btn-gitdrop" onClick={() => push()} title="Push tags to remote">
              <ArrowUpRight size={14} />
              <span>Push Tags</span>
            </button>
          </div>
        </div>

        {/* Tags List */}
        <div
          style={{
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--border)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              letterSpacing: '0.5px',
            }}
          >
            Repository Tags ({tags.length})
          </div>

          {tags.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No tags created in this repository yet.
            </div>
          ) : (
            <div>
              {tags.map((tag) => (
                <div
                  key={tag.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Tag size={16} color="var(--warning-text)" />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tag.name}
                    </span>
                    {tag.oid && (
                      <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {tag.oid.slice(0, 7)}
                      </code>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tag.oid && (
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        onClick={() => handleCopy(tag.oid, tag.name)}
                        title="Copy commit SHA"
                      >
                        {copiedTag === tag.name ? <Check size={12} color="var(--success-text)" /> : <Copy size={12} />}
                      </button>
                    )}

                    <button
                      className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                      onClick={() => handleDelete(tag.name)}
                      title="Delete tag"
                    >
                      <Trash2 size={13} color="var(--danger-text)" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTagModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
    </div>
  );
};
