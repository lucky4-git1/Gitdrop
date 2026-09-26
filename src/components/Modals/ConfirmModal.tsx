import React from 'react';
import { useUI } from '@/state/UIContext';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmModal: React.FC = () => {
  const { confirmModal, closeConfirm } = useUI();

  if (!confirmModal || !confirmModal.isOpen) return null;

  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirm();
  };

  return (
    <div className="modal-gitdrop-backdrop" onClick={closeConfirm} role="dialog" aria-modal="true">
      <div className="modal-gitdrop" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-gitdrop-header">
          <h3 className="modal-gitdrop-title" style={{ color: confirmModal.isDanger ? 'var(--danger-text)' : 'inherit' }}>
            {confirmModal.isDanger && <AlertTriangle size={18} />}
            {confirmModal.title}
          </h3>
          <button className="btn-gitdrop btn-gitdrop-subtle btn-gitdrop-sm" onClick={closeConfirm} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="modal-gitdrop-body">
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>
            {confirmModal.message}
          </p>
          {confirmModal.isDanger && (
            <div
              style={{
                marginTop: '14px',
                padding: '10px 12px',
                backgroundColor: 'var(--danger-subtle)',
                border: '1px solid var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '12px',
                color: 'var(--danger-text)',
              }}
            >
              <strong>Warning:</strong> This operation may cause uncommitted changes or branch history to be lost.
            </div>
          )}
        </div>

        <div className="modal-gitdrop-footer">
          <button className="btn-gitdrop" onClick={closeConfirm}>
            Cancel
          </button>
          <button
            className={`btn-gitdrop ${confirmModal.isDanger ? 'btn-gitdrop-danger' : 'btn-gitdrop-primary'}`}
            onClick={handleConfirm}
          >
            {confirmModal.confirmText || (confirmModal.isDanger ? 'Proceed' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};
