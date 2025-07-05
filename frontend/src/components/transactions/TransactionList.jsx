import React, { useState } from 'react';

const TransactionList = ({ 
  transactions = [], 
  loading = false, 
  onEdit, 
  onDelete,
  onRefresh 
}) => {
  const [sortField, setSortField] = useState('transaction_date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filter, setFilter] = useState({
    search: '',
    category: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedTransactions, setSelectedTransactions] = useState([]);

  // Filter and sort transactions
  const filteredTransactions = transactions.filter(transaction => {
    const searchMatch = !filter.search || 
      transaction.description.toLowerCase().includes(filter.search.toLowerCase()) ||
      transaction.category.toLowerCase().includes(filter.search.toLowerCase());
    
    const categoryMatch = filter.category === 'all' || transaction.category === filter.category;
    const typeMatch = filter.type === 'all' || transaction.transaction_type === filter.type;
    
    const dateFromMatch = !filter.dateFrom || transaction.transaction_date >= filter.dateFrom;
    const dateToMatch = !filter.dateTo || transaction.transaction_date <= filter.dateTo;

    return searchMatch && categoryMatch && typeMatch && dateFromMatch && dateToMatch;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    let comparison = 0;
    if (aValue < bValue) comparison = -1;
    if (aValue > bValue) comparison = 1;
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleSelectTransaction = (transactionId) => {
    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTransactions.length === filteredTransactions.length) {
      setSelectedTransactions([]);
    } else {
      setSelectedTransactions(filteredTransactions.map(t => t.id));
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Housing': '🏠',
      'Food': '🍔',
      'Transportation': '🚗',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Shopping': '🛒',
      'Utilities': '💡',
      'Education': '📚',
      'Travel': '✈️',
      'Investment': '📈',
      'Salary': '💰',
      'Other': '📊'
    };
    return icons[category] || '📊';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, type) => {
    const formatted = Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    return type === 'income' ? `+${formatted}` : `-${formatted}`;
  };

  if (loading) {
    return (
      <div className="transaction-list-loading">
        <div className="loading-spinner large"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="transaction-list">
      {/* Filters and Search */}
      <div className="transaction-filters">
        <div className="filters-row">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search transactions..."
              value={filter.search}
              onChange={(e) => setFilter(prev => ({ ...prev, search: e.target.value }))}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <select
            value={filter.category}
            onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="Housing">Housing</option>
            <option value="Food">Food</option>
            <option value="Transportation">Transportation</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Shopping">Shopping</option>
            <option value="Utilities">Utilities</option>
            <option value="Education">Education</option>
            <option value="Travel">Travel</option>
            <option value="Investment">Investment</option>
            <option value="Salary">Salary</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={filter.type}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <div className="date-filters">
            <input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter(prev => ({ ...prev, dateFrom: e.target.value }))}
              className="date-input"
              placeholder="From"
            />
            <input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter(prev => ({ ...prev, dateTo: e.target.value }))}
              className="date-input"
              placeholder="To"
            />
          </div>

          <button onClick={onRefresh} className="refresh-btn" title="Refresh data">
            🔄
          </button>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <span className="results-count">
            {filteredTransactions.length} of {transactions.length} transactions
          </span>
          {selectedTransactions.length > 0 && (
            <span className="selected-count">
              {selectedTransactions.length} selected
            </span>
          )}
        </div>
      </div>

      {/* Transaction Table */}
      <div className="transaction-table-container">
        <table className="transaction-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedTransactions.length === filteredTransactions.length && filteredTransactions.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th 
                className={`sortable ${sortField === 'transaction_date' ? sortDirection : ''}`}
                onClick={() => handleSort('transaction_date')}
              >
                Date
              </th>
              <th>Category</th>
              <th 
                className={`sortable ${sortField === 'description' ? sortDirection : ''}`}
                onClick={() => handleSort('description')}
              >
                Description
              </th>
              <th 
                className={`sortable ${sortField === 'amount' ? sortDirection : ''}`}
                onClick={() => handleSort('amount')}
              >
                Amount
              </th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-transactions">
                  <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No transactions found</h3>
                    <p>Try adjusting your filters or add a new transaction</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredTransactions.map((transaction) => (
                <tr 
                  key={transaction.id} 
                  className={`transaction-row ${selectedTransactions.includes(transaction.id) ? 'selected' : ''}`}
                >
                  <td className="checkbox-cell">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => handleSelectTransaction(transaction.id)}
                    />
                  </td>
                  <td className="date-cell">
                    {formatDate(transaction.transaction_date)}
                  </td>
                  <td className="category-cell">
                    <div className="category-badge">
                      <span className="category-icon">
                        {getCategoryIcon(transaction.category)}
                      </span>
                      <span className="category-name">
                        {transaction.category}
                      </span>
                    </div>
                  </td>
                  <td className="description-cell">
                    <div className="description-content">
                      <span className="description-text">{transaction.description}</span>
                      {transaction.notes && (
                        <span className="description-notes" title={transaction.notes}>
                          📝
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`amount-cell ${transaction.transaction_type}`}>
                    {formatAmount(transaction.amount, transaction.transaction_type)}
                  </td>
                  <td className="type-cell">
                    <span className={`type-badge ${transaction.transaction_type}`}>
                      {transaction.transaction_type === 'income' ? '📈' : '📉'}
                      {transaction.transaction_type}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <div className="actions-menu">
                      <button 
                        onClick={() => onEdit(transaction)}
                        className="action-btn edit"
                        title="Edit transaction"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => onDelete(transaction.id)}
                        className="action-btn delete"
                        title="Delete transaction"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk Actions */}
      {selectedTransactions.length > 0 && (
        <div className="bulk-actions">
          <span className="bulk-count">
            {selectedTransactions.length} item(s) selected
          </span>
          <div className="bulk-buttons">
            <button 
              onClick={() => setSelectedTransactions([])}
              className="btn btn-secondary"
            >
              Clear Selection
            </button>
            <button 
              onClick={() => {
                if (window.confirm(`Delete ${selectedTransactions.length} selected transactions?`)) {
                  selectedTransactions.forEach(id => onDelete(id));
                  setSelectedTransactions([]);
                }
              }}
              className="btn btn-danger"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionList;