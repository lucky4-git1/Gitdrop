import React, { useState, useMemo } from 'react';
import { useGit } from '@/state/GitContext';
import { useUI } from '@/state/UIContext';
import { computeCommitGraph } from '@/services/git/graphLayout';
import {
  GitBranch,
  Tag,
  Clock,
  User,
  Copy,
  RotateCcw,
  Check,
} from 'lucide-react';

export const CommitsPage: React.FC = () => {
  const {
    commits,
    branches,
    tags,
    currentBranch,
    revertCommit,
    resetBranch,
  } = useGit();
  const { requestConfirm } = useUI();

  const [selectedCommitOid, setSelectedCommitOid] = useState<string | null>(
    commits[0]?.oid || null
  );
  const [copiedOid, setCopiedOid] = useState(false);

  // Compute graph nodes and links using our tested layout engine
  const currentHeadOid = useMemo(() => {
    const cur = branches.find((b) => b.name === currentBranch);
    return cur?.commitOid || commits[0]?.oid;
  }, [branches, currentBranch, commits]);

  const graph = useMemo(() => {
    return computeCommitGraph(
      commits,
      currentHeadOid,
      branches,
      tags,
      48, // rowHeight
      22  // laneWidth
    );
  }, [commits, currentHeadOid, branches, tags]);

  const selectedCommit = commits.find((c) => c.oid === selectedCommitOid) || commits[0];

  const handleCopyOid = (oid: string) => {
    navigator.clipboard.writeText(oid);
    setCopiedOid(true);
    setTimeout(() => setCopiedOid(false), 2000);
  };

  const handleRevert = (oid: string) => {
    requestConfirm({
      title: `Revert Commit ${oid.slice(0, 7)}?`,
      message: `GitDrop will create a new commit reversing the changes from ${oid.slice(0, 7)}.`,
      confirmText: 'Revert Commit',
      onConfirm: () => revertCommit(oid),
    });
  };

  const handleReset = (mode: 'soft' | 'mixed' | 'hard', oid: string) => {
    requestConfirm({
      title: `${mode.toUpperCase()} Reset current branch to ${oid.slice(0, 7)}?`,
      message:
        mode === 'hard'
          ? `Warning: A HARD reset will discard uncommitted changes and force the working tree to match commit ${oid.slice(0, 7)}!`
          : `This will point branch "${currentBranch}" to ${oid.slice(0, 7)}.`,
      isDanger: mode === 'hard',
      confirmText: `Reset (${mode})`,
      onConfirm: () => resetBranch(mode, oid),
    });
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      {/* Left Area: Visual Commit Graph & Commit Rows */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, borderRight: '1px solid var(--border)' }}>
        <div
          style={{
            height: '36px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          <span>Visual Commit Graph & History ({commits.length})</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', position: 'relative' }}>
          {commits.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No commits found in this repository yet.
            </div>
          ) : (
            <div style={{ display: 'flex', minWidth: '600px' }}>
              {/* SVG Commit Graph Column */}
              <div style={{ width: `${Math.max(graph.width, 60)}px`, flexShrink: 0, position: 'relative' }}>
                <svg
                  width={Math.max(graph.width, 60)}
                  height={graph.height}
                  style={{ display: 'block' }}
                >
                  {/* Links / Bezier Curves between commits */}
                  {graph.links.map((link) => {
                    const isSameLane = link.sourceX === link.targetX;
                    const d = isSameLane
                      ? `M ${link.sourceX} ${link.sourceY} L ${link.targetX} ${link.targetY}`
                      : `M ${link.sourceX} ${link.sourceY} C ${link.sourceX} ${(link.sourceY + link.targetY) / 2}, ${link.targetX} ${(link.sourceY + link.targetY) / 2}, ${link.targetX} ${link.targetY}`;

                    return (
                      <path
                        key={link.id}
                        d={d}
                        stroke={link.color}
                        strokeWidth="2"
                        fill="none"
                        opacity="0.8"
                      />
                    );
                  })}

                  {/* Commit Nodes */}
                  {graph.nodes.map((node) => {
                    const isSelected = selectedCommitOid === node.commit.oid;
                    return (
                      <g key={node.commit.oid} transform={`translate(${node.x}, ${node.y})`}>
                        <circle
                          r={isSelected ? 6 : 4.5}
                          fill={node.color}
                          stroke={node.isHead ? '#ffffff' : 'var(--bg-primary)'}
                          strokeWidth={node.isHead ? 2.5 : 1.5}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Commit Details Table Column aligned row-by-row */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {graph.nodes.map((node) => {
                  const isSelected = selectedCommitOid === node.commit.oid;
                  return (
                    <div
                      key={node.commit.oid}
                      onClick={() => setSelectedCommitOid(node.commit.oid)}
                      style={{
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        borderBottom: '1px solid var(--border-muted)',
                        backgroundColor: isSelected ? 'var(--bg-selected)' : 'transparent',
                        cursor: 'pointer',
                        fontSize: '12px',
                        gap: '12px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      {/* Left: Message & Ref Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        {node.refs.map((ref) => (
                          <span
                            key={ref}
                            className="badge-gitdrop"
                            style={{
                              backgroundColor: ref.startsWith('tag:') ? 'var(--warning-subtle)' : 'var(--accent-subtle)',
                              color: ref.startsWith('tag:') ? 'var(--warning-text)' : 'var(--accent-text)',
                              fontSize: '10px',
                              padding: '1px 6px',
                              flexShrink: 0,
                            }}
                          >
                            {ref.startsWith('tag:') ? <Tag size={10} /> : <GitBranch size={10} />}
                            {ref}
                          </span>
                        ))}

                        <span
                          style={{
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {node.commit.message.split('\n')[0]}
                        </span>
                      </div>

                      {/* Right: Author & Hash */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0, color: 'var(--text-secondary)' }}>
                        <span style={{ fontSize: '11px' }}>{node.commit.author.name}</span>
                        <code style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {node.commit.oid.slice(0, 7)}
                        </code>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Area: Commit Inspector & Actions */}
      {selectedCommit && (
        <div
          style={{
            width: '340px',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '16px',
            gap: '16px',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
              Commit Details
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-primary)', padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <code style={{ fontSize: '12px' }}>{selectedCommit.oid}</code>
              <button
                className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
                onClick={() => handleCopyOid(selectedCommit.oid)}
                title="Copy SHA"
              >
                {copiedOid ? <Check size={12} color="var(--success-text)" /> : <Copy size={12} />}
              </button>
            </div>
          </div>

          {/* Author & Date */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={14} color="var(--text-muted)" />
              <span>
                <strong>{selectedCommit.author.name}</strong> &lt;{selectedCommit.author.email}&gt;
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={14} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-secondary)' }}>{formatDate(selectedCommit.author.timestamp)}</span>
            </div>
          </div>

          {/* Message */}
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              Message
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: '12px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                maxHeight: '160px',
                overflowY: 'auto',
              }}
            >
              {selectedCommit.message}
            </div>
          </div>

          {/* Actions: Revert, Reset */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
              Commit Operations
            </div>

            <button
              className="btn-gitdrop btn-gitdrop-sm"
              onClick={() => handleRevert(selectedCommit.oid)}
              title="Create a new commit reversing this commit"
            >
              <RotateCcw size={13} />
              <span>Revert this commit</span>
            </button>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                className="btn-gitdrop btn-gitdrop-sm"
                style={{ flex: 1 }}
                onClick={() => handleReset('soft', selectedCommit.oid)}
                title="Keep changes staged"
              >
                Reset (Soft)
              </button>
              <button
                className="btn-gitdrop btn-gitdrop-sm"
                style={{ flex: 1 }}
                onClick={() => handleReset('mixed', selectedCommit.oid)}
                title="Keep changes unstaged"
              >
                Reset (Mixed)
              </button>
              <button
                className="btn-gitdrop btn-gitdrop-sm btn-gitdrop-danger"
                style={{ flex: 1 }}
                onClick={() => handleReset('hard', selectedCommit.oid)}
                title="Discard all changes to match this commit"
              >
                Reset (Hard)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
