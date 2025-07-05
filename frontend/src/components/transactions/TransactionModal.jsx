import React, { useEffect } from 'react';
import TransactionForm from './TransactionForm';

const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  transaction = null,
  loading = false 
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-content">
          <TransactionForm
            onSubmit={onSubmit}
            onCancel={onClose}
            initialData={transaction}
            isEdit={!!transaction}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;