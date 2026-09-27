import React, { useState, useMemo } from 'react';
import { useRepository } from '@/state/RepositoryContext';
import { useUI } from '@/state/UIContext';
import { ProjectEntry } from '@/types/project';
import {
  FolderGit2,
  FolderOpen,
  Plus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreVertical,
  Check,
  ExternalLink,
  Copy,
  Trash2,
  Star,
  FolderDown,
  Edit2,
  GitBranch,
  ShieldAlert,
  HardDrive,
  GitPullRequest,
  Sparkles,
} from 'lucide-react';
import { CloneRepoModal } from '../Modals/CloneRepoModal';
import { CreateProjectModal } from '../Modals/CreateProjectModal';

interface ProjectsWorkspaceProps {
  onSelectProject?: (project: ProjectEntry) => void;
}

export const ProjectsWorkspace: React.FC<ProjectsWorkspaceProps> = () => {
  const {
    projects,
    activeProject,
    switchProject,
    removeProject,
    setDefaultProject,
    renameProject,
    openDirectoryPicker,
    openVirtualProject,
    requestActivePermission,
  } = useRepository();
  const { setActiveView, requestConfirm } = useUI();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'lastOpened' | 'name' | 'status'>('lastOpened');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCloneModalOpen, setCloneModalOpen] = useState(false);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & Sort Projects
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.displayName && p.displayName.toLowerCase().includes(q)) ||
          (p.path && p.path.toLowerCase().includes(q)) ||
          (p.branch && p.branch.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;

      if (sortBy === 'name') {
        return (a.displayName || a.name).localeCompare(b.displayName || b.name);
      }
      if (sortBy === 'status') {
        const aChanges = a.statusSummary?.changesCount || 0;
        const bChanges = b.statusSummary?.changesCount || 0;
        return bChanges - aChanges;
      }
      // default: lastOpened
      return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime();
    });

    return result;
  }, [projects, searchQuery, sortBy]);

  const handleOpenProject = async (project: ProjectEntry) => {
    try {
      await switchProject(project.id);
      setActiveView('workspace');
    } catch {
      // handled
    }
  };

  const handleRename = (project: ProjectEntry) => {
    const currentName = project.displayName || project.name;
    const newName = prompt('Enter new project display name:', currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      renameProject(project.id, newName.trim());
    }
    setActiveMenuId(null);
  };

  const handleCopyPath = (project: ProjectEntry) => {
    const textToCopy = project.path || project.name;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
    setActiveMenuId(null);
  };

  const handleRemove = (project: ProjectEntry) => {
    setActiveMenuId(null);
    requestConfirm({
      title: 'Remove Project from GitDrop',
      message: `Are you sure you want to remove "${project.displayName || project.name}" from GitDrop?\n\nThis will NOT delete the actual folder or files on your disk. It only removes it from GitDrop's project registry.`,
      confirmText: 'Remove from GitDrop',
      isDanger: true,
      onConfirm: () => removeProject(project.id),
    });
  };

  const formatLastOpened = (iso: string) => {
    try {
      const date = new Date(iso);
      const diffMs = Date.now() - date.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Workspace Header Toolbar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FolderGit2 size={20} color="var(--accent-text)" />
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
              Projects & Repositories
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              {projects.length} managed {projects.length === 1 ? 'project' : 'projects'} • Switch instantly without restarting
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm" onClick={openDirectoryPicker}>
            <FolderOpen size={14} />
            <span>Open Folder</span>
          </button>
          <button className="btn-gitdrop btn-gitdrop-sm" onClick={() => setCreateModalOpen(true)}>
            <Plus size={14} />
            <span>New Repo</span>
          </button>
          <button className="btn-gitdrop btn-gitdrop-sm" onClick={() => setCloneModalOpen(true)}>
            <GitPullRequest size={14} />
            <span>Clone Repo</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '9px' }} />
          <input
            type="text"
            className="form-control-gitdrop"
            style={{ paddingLeft: '32px', height: '32px', fontSize: '12px' }}
            placeholder="Search projects by name, branch, path..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <ArrowUpDown size={14} />
            <span>Sort:</span>
            <select
              className="form-control-gitdrop"
              style={{ height: '30px', padding: '2px 8px', fontSize: '12px' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="lastOpened">Last Opened</option>
              <option value="name">Name</option>
              <option value="status">Changes Count</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              style={{
                borderRadius: 0,
                padding: '4px 8px',
                backgroundColor: viewMode === 'list' ? 'var(--bg-elevated)' : 'transparent',
              }}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={14} />
            </button>
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              style={{
                borderRadius: 0,
                padding: '4px 8px',
                backgroundColor: viewMode === 'grid' ? 'var(--bg-elevated)' : 'transparent',
              }}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Projects List / Grid Container */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
        {filteredProjects.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-secondary)',
            }}
          >
            <FolderDown size={44} color="var(--text-muted)" style={{ marginBottom: '14px' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
              {searchQuery ? 'No matching projects found' : 'No registered projects yet'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>
              {searchQuery
                ? 'Try adjusting your search query or clear filters.'
                : 'Open a local folder, clone a repository, or drop any project here to begin.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn-gitdrop btn-gitdrop-primary" onClick={openDirectoryPicker}>
                <FolderOpen size={14} /> Open Local Folder
              </button>
              <button className="btn-gitdrop" onClick={() => openVirtualProject('react-vite-demo')}>
                <Sparkles size={14} /> Try Virtual Starter
              </button>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* List Mode */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredProjects.map((p) => {
              const isActive = activeProject?.id === p.id;
              const hasChanges = (p.statusSummary?.changesCount || 0) > 0;
              const isMenuOpen = activeMenuId === p.id;

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, cursor: 'pointer' }}
                    onClick={() => handleOpenProject(p)}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isActive ? 'var(--accent)' : 'var(--bg-secondary)',
                        color: isActive ? '#fff' : 'var(--accent-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <HardDrive size={18} />
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
                          {p.displayName || p.name}
                        </span>
                        {isActive && (
                          <span
                            className="badge-gitdrop"
                            style={{
                              backgroundColor: 'var(--accent)',
                              color: '#fff',
                              fontSize: '10px',
                              padding: '2px 6px',
                            }}
                          >
                            Active
                          </span>
                        )}
                        {p.isDefault && (
                          <span
                            className="badge-gitdrop"
                            style={{
                              backgroundColor: 'var(--warning-subtle)',
                              color: 'var(--warning-text)',
                              fontSize: '10px',
                            }}
                          >
                            <Star size={10} /> Default
                          </span>
                        )}
                        {p.isVirtual && (
                          <span className="badge-gitdrop" style={{ fontSize: '10px' }}>
                            Virtual
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <span>Location: {p.path || p.name}</span>
                        {p.branch && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <GitBranch size={12} /> {p.branch}
                          </span>
                        )}
                        <span>{formatLastOpened(p.lastOpenedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Indicator & Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {p.needsPermission ? (
                      <button
                        className="btn-gitdrop btn-gitdrop-warning btn-gitdrop-sm"
                        onClick={() => requestActivePermission()}
                      >
                        <ShieldAlert size={12} />
                        <span>Grant Access</span>
                      </button>
                    ) : (
                      <span
                        className="badge-gitdrop"
                        style={{
                          backgroundColor: hasChanges ? 'var(--warning-subtle)' : 'var(--success-subtle)',
                          color: hasChanges ? 'var(--warning-text)' : 'var(--success-text)',
                          fontSize: '11px',
                        }}
                      >
                        {hasChanges ? `● ${p.statusSummary?.changesCount} changes` : '✓ Clean'}
                      </span>
                    )}

                    <button
                      className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                      onClick={() => handleOpenProject(p)}
                    >
                      {isActive ? 'Opened' : 'Open'}
                    </button>

                    {/* Context Menu Button */}
                    <div style={{ position: 'relative' }}>
                      <button
                        className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                        style={{ padding: '6px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(isMenuOpen ? null : p.id);
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>

                      {isMenuOpen && (
                        <div
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '4px',
                            backgroundColor: 'var(--bg-elevated)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            minWidth: '180px',
                            zIndex: 100,
                            padding: '4px',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={() => {
                              handleOpenProject(p);
                              setActiveMenuId(null);
                            }}
                          >
                            <FolderOpen size={14} />
                            <span>Open Project</span>
                          </button>
                          <button
                            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={() => {
                              setDefaultProject(p.id);
                              setActiveMenuId(null);
                            }}
                          >
                            <Star size={14} />
                            <span>Set as Default</span>
                          </button>
                          <button
                            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={() => handleRename(p)}
                          >
                            <Edit2 size={14} />
                            <span>Rename</span>
                          </button>
                          <button
                            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                            style={{ width: '100%', justifyContent: 'flex-start' }}
                            onClick={() => handleCopyPath(p)}
                          >
                            {copiedId === p.id ? <Check size={14} color="var(--success-text)" /> : <Copy size={14} />}
                            <span>{copiedId === p.id ? 'Copied Path!' : 'Copy Path'}</span>
                          </button>
                          {p.remoteUrl && (
                            <a
                              href={p.remoteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                              style={{ width: '100%', justifyContent: 'flex-start', textDecoration: 'none' }}
                              onClick={() => setActiveMenuId(null)}
                            >
                              <ExternalLink size={14} />
                              <span>Open in GitHub</span>
                            </a>
                          )}
                          <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />
                          <button
                            className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger-text)' }}
                            onClick={() => handleRemove(p)}
                          >
                            <Trash2 size={14} />
                            <span>Remove from GitDrop</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Grid Mode */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
            }}
          >
            {filteredProjects.map((p) => {
              const isActive = activeProject?.id === p.id;
              const hasChanges = (p.statusSummary?.changesCount || 0) > 0;

              return (
                <div
                  key={p.id}
                  style={{
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HardDrive size={18} color="var(--accent-text)" />
                        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {p.displayName || p.name}
                        </h4>
                      </div>
                      {isActive && (
                        <span className="badge-gitdrop" style={{ backgroundColor: 'var(--accent)', color: '#fff', fontSize: '10px' }}>
                          Active
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        Location: {p.path || p.name}
                      </div>
                      {p.branch && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <GitBranch size={12} /> {p.branch}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                    <span
                      className="badge-gitdrop"
                      style={{
                        backgroundColor: hasChanges ? 'var(--warning-subtle)' : 'var(--success-subtle)',
                        color: hasChanges ? 'var(--warning-text)' : 'var(--success-text)',
                        fontSize: '11px',
                      }}
                    >
                      {hasChanges ? `● ${p.statusSummary?.changesCount} changes` : '✓ Clean'}
                    </span>

                    <button
                      className="btn-gitdrop btn-gitdrop-primary btn-gitdrop-sm"
                      onClick={() => handleOpenProject(p)}
                    >
                      {isActive ? 'Opened' : 'Open'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateProjectModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} />
      <CloneRepoModal isOpen={isCloneModalOpen} onClose={() => setCloneModalOpen(false)} />
    </div>
  );
};
