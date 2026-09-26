import React from 'react';
import { useUI, ActiveView } from '@/state/UIContext';
import { useGit } from '@/state/GitContext';
import { useRepository } from '@/state/RepositoryContext';
import {
  LayoutDashboard,
  GitPullRequestDraft,
  GitBranch,
  History,
  Globe,
  Tag,
  FolderTree,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface SidebarItem {
  id: ActiveView;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  badgeType?: 'modified' | 'added' | 'deleted' | 'conflict';
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView } = useUI();
  const { status, branches } = useGit();
  const { projectInfo } = useRepository();

  const totalChanges = (status?.staged.length || 0) + (status?.unstaged.length || 0);
  const hasConflicts = (status?.conflicted.length || 0) > 0;

  const items: SidebarItem[] = [
    {
      id: 'workspace',
      label: 'Workspace',
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: 'changes',
      label: 'Changes',
      icon: <GitPullRequestDraft size={16} />,
      badge: totalChanges > 0 ? totalChanges : undefined,
      badgeType: 'modified',
    },
    ...(hasConflicts
      ? [
          {
            id: 'conflicts' as ActiveView,
            label: 'Conflicts',
            icon: <AlertTriangle size={16} color="var(--danger-text)" />,
            badge: status?.conflicted.length,
            badgeType: 'conflict' as const,
          },
        ]
      : []),
    {
      id: 'branches',
      label: 'Branches',
      icon: <GitBranch size={16} />,
      badge: branches.length > 0 ? branches.length : undefined,
    },
    {
      id: 'commits',
      label: 'Commits',
      icon: <History size={16} />,
    },
    {
      id: 'remotes',
      label: 'Remotes',
      icon: <Globe size={16} />,
    },
    {
      id: 'tags',
      label: 'Tags',
      icon: <Tag size={16} />,
    },
    {
      id: 'files',
      label: 'Files',
      icon: <FolderTree size={16} />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings size={16} />,
    },
  ];

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      {/* Project Header */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {projectInfo?.name || 'GitDrop'}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {projectInfo?.framework || 'Visual Git Client'}
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 10px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-selected)' : 'transparent',
                color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                fontSize: '12px',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.1s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ color: isActive ? 'var(--accent-text)' : 'var(--text-muted)' }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>

              {item.badge !== undefined && (
                <span
                  className="badge-gitdrop"
                  style={{
                    backgroundColor: item.badgeType === 'conflict' ? 'var(--danger-subtle)' : 'var(--bg-hover)',
                    color: item.badgeType === 'conflict' ? 'var(--danger-text)' : 'var(--text-primary)',
                    fontSize: '10px',
                    padding: '1px 6px',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
