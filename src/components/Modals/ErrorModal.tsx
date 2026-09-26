import React, { useState } from 'react';
import { useUI } from '@/state/UIContext';
import { AlertCircle, X, ChevronDown, ChevronRight, Terminal } from 'lucide-react';

export const ErrorModal: React.FC = () => {
  const { errorModal, closeError, setConsoleOpen } = useUI();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!errorModal || !errorModal.isOpen) return null;

  return (
    <div className="modal-gitdrop-backdrop" onClick={closeError} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
        <div className="modal-gitdrop-header" style={{ borderBottomColor: 'var(--danger-subtle)' }}>
          <h3 className="modal-gitdrop-title" style={{ color: 'var(--danger-text)' }}>
            <AlertCircle size={18} />
            {errorModal.title}
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={closeError} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-gitdrop-body">
          {/* What happened */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              What Happened
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500 }}>
              {errorModal.whatHappened}
            </div>
          </div>

          {/* Why it happened */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
              Why It Happened
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              {errorModal.whyItHappened}
            </div>
          </div>

          {/* Recommended Action */}
          <div style={{ padding: '10px 12px', backgroundColor: 'var(--accent-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 139, 253, 0.3)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--accent-text)', fontWeight: 600, marginBottom: '4px' }}>
              Recommended Action
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {errorModal.recommendedAction}
            </div>
          </div>

          {/* Collapsible Details */}
          <div style={{ marginTop: '14px' }}>
            <button
              className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm"
              style={{ padding: 0, fontSize: '11px', color: 'var(--text-muted)' }}
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            >
              {showTechnicalDetails ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              View Git Diagnostics & Logs
            </button>

            {showTechnicalDetails && (
              <div style={{ marginTop: '8px' }}>
                <button
                  className="btn-gitdrop btn-gitdrop-sm"
                  onClick={() => {
                    closeError();
                    setConsoleOpen(true);
                  }}
                >
                  <Terminal size={12} />
                  Open Git Command Output Console
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="modal-gitdrop-footer">
          <button className="btn-gitdrop" onClick={closeError}>
            Dismiss
          </button>
          {errorModal.actionLabel && errorModal.onAction && (
            <button
              className="btn-gitdrop btn-gitdrop-primary"
              onClick={() => {
                errorModal.onAction!();
                closeError();
              }}
            >
              {errorModal.actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
