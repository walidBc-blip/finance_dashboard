import React, { useState } from 'react';

const TransactionForm = ({ 
  onSubmit, 
  onCancel, 
  initialData = null,
  isEdit = false,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    amount: initialData?.amount || '',
    category: initialData?.category || 'Food',
    description: initialData?.description || '',
    transaction_type: initialData?.transaction_type || 'expense',
    transaction_date: initialData?.transaction_date || new Date().toISOString().split('T')[0],
    tags: initialData?.tags || '',
    notes: initialData?.notes || '',
    is_recurring: initialData?.is_recurring || false
  });

  const [errors, setErrors] = useState({});

  const categories = [
    'Housing', 'Food', 'Transportation', 'Entertainment', 
    'Healthcare', 'Shopping', 'Utilities', 'Education', 
    'Travel', 'Investment', 'Salary', 'Other'
  ];

  const validateForm = () => {
    const newErrors = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      transaction_date: formData.transaction_date,
    };

    onSubmit(submitData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <div className="form-header">
        <h3>{isEdit ? 'Edit Transaction' : 'Add New Transaction'}</h3>
        <p>Fill in the details for your {formData.transaction_type}</p>
      </div>

      <div className="form-body">
        {/* Transaction Type */}
        <div className="form-group">
          <label className="form-label">Transaction Type</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="transaction_type"
                value="expense"
                checked={formData.transaction_type === 'expense'}
                onChange={handleChange}
              />
              <span className="radio-custom expense">📉 Expense</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="transaction_type"
                value="income"
                checked={formData.transaction_type === 'income'}
                onChange={handleChange}
              />
              <span className="radio-custom income">📈 Income</span>
            </label>
          </div>
        </div>

        {/* Amount & Date */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount ($)</label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              className={`form-input ${errors.amount ? 'error' : ''}`}
            />
            {errors.amount && <span className="error-message">{errors.amount}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="transaction_date"
              value={formData.transaction_date}
              onChange={handleChange}
              className="form-input"
            />
          </div>
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`form-select ${errors.category ? 'error' : ''}`}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <span className="error-message">{errors.category}</span>}
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter transaction description..."
            className={`form-input ${errors.description ? 'error' : ''}`}
          />
          {errors.description && <span className="error-message">{errors.description}</span>}
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags (optional)</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="e.g., work, personal, urgent"
            className="form-input"
          />
          <small className="form-hint">Separate multiple tags with commas</small>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes (optional)</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Additional notes about this transaction..."
            rows="3"
            className="form-textarea"
          />
        </div>

        {/* Recurring */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_recurring"
              checked={formData.is_recurring}
              onChange={handleChange}
            />
            <span className="checkbox-custom"></span>
            This is a recurring transaction
          </label>
        </div>
      </div>

      <div className="form-footer">
        <button 
          type="button" 
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              {isEdit ? 'Updating...' : 'Adding...'}
            </>
          ) : (
            <>
              {isEdit ? '💾 Update Transaction' : '➕ Add Transaction'}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;