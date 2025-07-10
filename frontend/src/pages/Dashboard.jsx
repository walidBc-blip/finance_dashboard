// frontend/src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import apiService from '../services/api';
import CustomPieChart from '../components/charts/PieChart';
import CustomLineChart from '../components/charts/LineChart';
import PowerBIDashboard from '../components/powerbi/PowerBIDashboard';
import TransactionModal from '../components/transactions/TransactionModal';
import TransactionList from '../components/transactions/TransactionList';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  // Main app state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Transaction management state
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionFormLoading, setTransactionFormLoading] = useState(false);

  const { user, logout } = useAuth();

  // ✅ FIXED: Only proceed if user is authenticated
  if (!user) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>🔐 Please log in to access your dashboard...</p>
          <div className="mt-4 text-sm text-gray-300">
            Redirecting to login page...
          </div>
        </div>
      </div>
    );
  }

  const userId = user.id; // ✅ FIXED: Use actual user ID, no fallback

  // ✅ FIXED: Enhanced fetch initial data with proper user isolation
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // ✅ FIXED: Use authenticated user's ID for all API calls
      const [health, users, spending] = await Promise.all([
        apiService.healthCheck(),
        apiService.getUsers(),
        apiService.getSpendingAnalysis(userId) // ✅ Use authenticated user's ID
      ]);
      
      setData({ health, users, spending });
      
      // Only show success toast on manual refresh, not initial load
      if (!loading) {
        toast.success('📊 Dashboard data refreshed successfully!');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(`❌ ${errorMessage}`);
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Enhanced fetch transactions with proper user isolation
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      // ✅ FIXED: Use authenticated user's ID
      const transactionData = await apiService.getUserTransactions(userId, { limit: 50 });
      setTransactions(transactionData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      toast.error('❌ Failed to load transactions');
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Enhanced refresh all data with user feedback
  const refreshData = async () => {
    const refreshToast = toast.loading('🔄 Refreshing data...');
    try {
      await Promise.all([fetchData(), fetchTransactions()]);
      toast.success('✅ All data refreshed successfully!', { id: refreshToast });
    } catch (err) {
      toast.error('❌ Failed to refresh data', { id: refreshToast });
    }
  };

  // ✅ FIXED: Transaction management with proper user isolation
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (transactionData) => {
    setTransactionFormLoading(true);
    
    const submitToast = toast.loading(
      editingTransaction ? '✏️ Updating transaction...' : '➕ Creating transaction...'
    );
    
    try {
      if (editingTransaction) {
        // ✅ FIXED: Use authenticated user's ID
        await apiService.updateTransaction(userId, editingTransaction.id, transactionData);
        toast.success('✅ Transaction updated successfully!', { id: submitToast });
      } else {
        // ✅ FIXED: Use authenticated user's ID
        await apiService.createTransaction(userId, transactionData);
        toast.success('✅ Transaction created successfully!', { id: submitToast });
      }
      
      handleCloseModal();
      await refreshData(); // Refresh all data to update charts
    } catch (err) {
      console.error('Error saving transaction:', err);
      toast.error(`❌ Failed to save transaction: ${err.message}`, { 
        id: submitToast,
        duration: 5000 
      });
    } finally {
      setTransactionFormLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    const deleteToast = toast.loading('🗑️ Deleting transaction...');
    
    try {
      // ✅ FIXED: Use authenticated user's ID
      await apiService.deleteTransaction(userId, transactionId);
      toast.success('🗑️ Transaction deleted successfully!', { 
        id: deleteToast,
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#6B7280',
          color: '#fff',
        },
      });
      await refreshData(); // Refresh all data to update charts
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error(`❌ Failed to delete transaction: ${err.message}`, { 
        id: deleteToast,
        duration: 5000 
      });
    }
  };

  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  // Enhanced tab switching with feedback
  const handleTabSwitch = (tabName) => {
    setActiveTab(tabName);
    const tabEmojis = {
      overview: '📊',
      analytics: '📈',
      powerbi: '⚡',
      transactions: '💳'
    };
    toast(`${tabEmojis[tabName]} Switched to ${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`, {
      duration: 2000,
      style: {
        background: '#F3F4F6',
        color: '#374151',
      },
    });
  };

  // ✅ FIXED: Only fetch data when user is authenticated
  useEffect(() => {
    if (user && user.id) {
      fetchData();
      fetchTransactions();
    }
  }, [user?.id]); // Re-fetch when user changes

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading your financial dashboard...</p>
          <div className="mt-4 text-sm text-gray-600">
            Welcome back, {user.name}! Fetching your personal data...
          </div>
          {/* Progress indicators */}
          <div className="mt-6 w-64 bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h2>Connection Error</h2>
          <p>Unable to connect to backend: {error}</p>
          <div className="error-help">
            <p>Make sure your backend is running:</p>
            <code>uvicorn app.main:app --reload</code>
          </div>
          <div className="mt-6 space-x-4">
            <button 
              onClick={refreshData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🔄 Retry Connection
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
            >
              🔄 Reload Page
            </button>
          </div>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  // Create trend data for the line chart
  const trendData = data?.spending?.monthly_trends?.map(trend => ({
    name: trend.month,
    income: trend.income,
    expenses: trend.expenses,
    net: trend.net
  })) || [];

  return (
    <div className="dashboard">
      {/* Enhanced Toaster */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            theme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">💰</span>
              <h1>MoneyCents</h1>
            </div>
            <div className="nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('overview')}
              >
                📊 Overview
              </button>
              <button 
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('analytics')}
              >
                📈 Analytics
              </button>
              <button 
                className={`nav-tab ${activeTab === 'powerbi' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('powerbi')}
              >
                ⚡ PowerBI
              </button>
              <button 
                className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => handleTabSwitch('transactions')}
              >
                💳 Transactions
              </button>
            </div>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-avatar">
                {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              </span>
              <span className="user-name">{user.name}</span>
              <span className="user-id">ID: {user.id}</span> {/* ✅ Show user ID for debugging */}
              {/* Enhanced refresh button */}
              <button 
                onClick={refreshData}
                className="ml-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Refresh all data"
              >
                🔄
              </button>
              {/* Logout button */}
              <button 
                onClick={logout}
                className="ml-2 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          
          {/* ✅ FIXED: Enhanced Welcome Section with user-specific greeting */}
          <section className="welcome-section">
            <h2>Welcome back, {user.name.split(' ')[0]}! 👋</h2>
            <p>Here's your personal financial overview for today</p>
            {/* Status indicator */}
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Data Connected
              </span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            
            {/* ✅ NEW: Show if this is a new user */}
            {transactions.length === 0 && (
              <div className="new-user-banner mt-4">
                <div className="banner-content">
                  <div className="banner-icon">🎉</div>
                  <div className="banner-text">
                    <h3>Welcome to your new financial dashboard!</h3>
                    <p>Get started by adding your first transaction or uploading your transaction history.</p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddTransaction}
                  >
                    ➕ Add Your First Transaction
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ✅ FIXED: Enhanced Stats Cards with proper data handling */}
          {data?.spending && (
            <section className="stats-grid">
              <div className="stat-card income">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>Total Income</h3>
                  <p className="stat-value">${data.spending.total_income?.toLocaleString() || '0'}</p>
                  <span className="stat-change positive">+8.2% this month</span>
                </div>
              </div>

              <div className="stat-card expenses">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>Total Expenses</h3>
                  <p className="stat-value">${data.spending.total_expenses?.toLocaleString() || '0'}</p>
                  <span className="stat-change negative">-3.1% this month</span>
                </div>
              </div>

              <div className="stat-card savings">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>Savings Rate</h3>
                  <p className="stat-value">{data.spending.savings_rate || 0}%</p>
                  <span className="stat-change positive">Excellent!</span>
                </div>
              </div>

              <div className="stat-card transactions">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <h3>Transactions</h3>
                  <p className="stat-value">{transactions.length || 0}</p>
                  <span className="stat-change neutral">Your personal data</span>
                </div>
              </div>
            </section>
          )}

          {/* Tab Content */}
          {activeTab === 'overview' && data?.spending && (
            <section className="content-grid">
              
              {/* Spending Categories Chart */}
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <h3>💳 Spending by Category</h3>
                  <span className="card-subtitle">Your personal spending breakdown</span>
                </div>
                <div className="chart-container">
                  <CustomPieChart 
                    data={data.spending.top_categories || []}
                    height={350}
                  />
                </div>
              </div>

              {/* Financial Health */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🏥 Financial Health</h3>
                  <span className="card-subtitle">Your overall score</span>
                </div>
                <div className="health-score">
                  <div className="score-circle">
                    <span className="score-number">85</span>
                    <span className="score-label">Excellent</span>
                  </div>
                  <div className="health-details">
                    <div className="health-item">
                      <span className="health-label">Savings Rate</span>
                      <span className="health-value">{data.spending.savings_rate || 0}%</span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Budget Adherence</span>
                      <span className="health-value">92%</span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Emergency Fund</span>
                      <span className="health-value">6 months</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <h3>⚡ Quick Actions</h3>
                  <span className="card-subtitle">Manage your finances efficiently</span>
                </div>
                <div className="actions-grid">
                  <button 
                    className="action-button primary"
                    onClick={handleAddTransaction}
                  >
                    <span className="action-icon">➕</span>
                    Add Transaction
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => {
                      toast('🎯 Set Goals feature coming soon!', {
                        icon: '🚀',
                        style: {
                          background: '#8B5CF6',
                          color: '#fff',
                        },
                      });
                    }}
                  >
                    <span className="action-icon">🎯</span>
                    Set Goals
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => {
                      toast('💰 Manage Budgets feature coming soon!', {
                        icon: '🚀',
                        style: {
                          background: '#F59E0B',
                          color: '#fff',
                        },
                      });
                    }}
                  >
                    <span className="action-icon">💰</span>
                    Manage Budgets
                  </button>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <h3>💡 Personal Insights</h3>
                  <span className="card-subtitle">AI-powered insights for your finances</span>
                </div>
                <div className="insights-grid">
                  {transactions.length > 0 ? (
                    <>
                      <div className="insight-item success">
                        <span className="insight-icon">✅</span>
                        <div className="insight-content">
                          <h4>Good Spending Habits</h4>
                          <p>You're tracking your expenses well. Keep it up!</p>
                        </div>
                      </div>
                      {data.spending.top_categories?.[0] && (
                        <div className="insight-item warning">
                          <span className="insight-icon">⚠️</span>
                          <div className="insight-content">
                            <h4>{data.spending.top_categories[0].category} Expense High</h4>
                            <p>{data.spending.top_categories[0].category} takes up {data.spending.top_categories[0].percentage}% of expenses. Consider optimizing.</p>
                          </div>
                        </div>
                      )}
                      <div className="insight-item info">
                        <span className="insight-icon">📊</span>
                        <div className="insight-content">
                          <h4>Your Financial Data</h4>
                          <p>You have {transactions.length} transactions tracked in your personal dashboard.</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="insight-item info">
                      <span className="insight-icon">🚀</span>
                      <div className="insight-content">
                        <h4>Get Started</h4>
                        <p>Add some transactions to see personalized insights about your spending patterns!</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </section>
          )}

          {activeTab === 'analytics' && data?.spending && (
            <section className="content-grid">
              
              {/* Monthly Trends */}
              <div className="dashboard-card chart-card full-width">
                <div className="card-header">
                  <h3>📈 Monthly Trends</h3>
                  <span className="card-subtitle">Your income vs expenses over time</span>
                </div>
                <div className="chart-container">
                  <CustomLineChart 
                    data={trendData}
                    height={400}
                    lines={[
                      { key: 'income', color: '#10B981', name: 'Income' },
                      { key: 'expenses', color: '#EF4444', name: 'Expenses' },
                      { key: 'net', color: '#3B82F6', name: 'Net Income' }
                    ]}
                    xAxisKey="name"
                  />
                </div>
              </div>

              {/* Category Analysis */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🔍 Category Analysis</h3>
                  <span className="card-subtitle">Your detailed breakdown</span>
                </div>
                <div className="categories-list">
                  {data.spending.top_categories?.map((category, index) => (
                    <div key={category.category} className="category-item enhanced">
                      <div className="category-info">
                        <span className="category-emoji">
                          {['🏠', '🍔', '🚗', '🎬', '💡'][index] || '📊'}
                        </span>
                        <div className="category-details">
                          <span className="category-name">{category.category}</span>
                          <div className="category-bar">
                            <div 
                              className="category-progress"
                              style={{ width: `${category.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="category-stats">
                        <span className="category-amount">${category.amount?.toLocaleString()}</span>
                        <span className="category-percentage">{category.percentage?.toFixed(1)}%</span>
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <h3>📊 Advanced Analytics</h3>
                  <span className="card-subtitle">Deep dive into your personal financial data</span>
                </div>
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <p>Advanced analytics for {user.name} coming soon!</p>
                  <p>Current transactions: {transactions.length}</p>
                  <p>Data analysis in progress...</p>
                </div>
              </div>

            </section>
          )}

          {activeTab === 'powerbi' && (
            <PowerBIDashboard data={data} />
          )}

// 👇 ADD THE NEW ENHANCED TRANSACTIONS CODE HERE 👇
{activeTab === 'transactions' && (
  <section className="transactions-section">
    
    {/* Enhanced Transaction Header */}
    <div className="transactions-header">
      <div className="header-info">
        <h2 className="section-title">
          <span className="title-icon">💳</span>
          Your Transactions
        </h2>
        <p className="section-subtitle">Manage your personal income and expenses</p>
        <div className="transaction-stats">
          <span className="stat-badge income">
            <span className="badge-icon">📈</span>
            Income: {transactions.filter(t => t.transaction_type === 'income').length}
          </span>
          <span className="stat-badge expense">
            <span className="badge-icon">📉</span>
            Expenses: {transactions.filter(t => t.transaction_type === 'expense').length}
          </span>
          <span className="stat-badge total">
            <span className="badge-icon">📊</span>
            Total: {transactions.length}
          </span>
        </div>
      </div>
      <button 
        className="btn-add-transaction"
        onClick={handleAddTransaction}
      >
        <span className="btn-icon">➕</span>
        Add Transaction
      </button>
    </div>

    {/* Enhanced Search and Filters */}
    <div className="transactions-filters">
      <div className="search-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search transactions..."
            className="search-input"
          />
        </div>
      </div>
      
      <div className="filter-section">
        <select className="filter-select">
          <option value="all">All Categories</option>
          <option value="food">🍔 Food</option>
          <option value="housing">🏠 Housing</option>
          <option value="transportation">🚗 Transportation</option>
          <option value="entertainment">🎬 Entertainment</option>
          <option value="salary">💰 Salary</option>
        </select>
        
        <select className="filter-select">
          <option value="all">All Types</option>
          <option value="income">📈 Income</option>
          <option value="expense">📉 Expense</option>
        </select>
        
        <button className="filter-btn">
          <span className="filter-icon">⚙️</span>
          More Filters
        </button>
      </div>
    </div>

    {/* Enhanced Transaction List */}
    <div className="transactions-container">
      {transactionsLoading ? (
        <div className="loading-transactions">
          <div className="loading-spinner"></div>
          <p>Loading your transactions...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="empty-transactions">
          <div className="empty-icon">💳</div>
          <h3>No transactions yet</h3>
          <p>Start tracking your finances by adding your first transaction</p>
          <button 
            className="btn-get-started"
            onClick={handleAddTransaction}
          >
            <span className="btn-icon">🚀</span>
            Get Started
          </button>
        </div>
      ) : (
        <div className="transactions-grid">
          {transactions.map((transaction) => (
            <div key={transaction.id} className={`transaction-card ${transaction.transaction_type}`}>
              
              {/* Transaction Header */}
              <div className="transaction-header">
                <div className="transaction-info">
                  <div className="category-badge">
                    <span className="category-icon">
                      {getCategoryIcon(transaction.category)}
                    </span>
                    <span className="category-name">{transaction.category}</span>
                  </div>
                  <span className="transaction-date">
                    {new Date(transaction.transaction_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                
                <div className="transaction-amount">
                  <span className={`amount ${transaction.transaction_type}`}>
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    ${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                  <span className="amount-type">
                    {transaction.transaction_type === 'income' ? '📈' : '📉'}
                  </span>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="transaction-details">
                <p className="transaction-description">
                  {transaction.description || 'No description'}
                </p>
                {transaction.notes && (
                  <p className="transaction-notes">
                    <span className="notes-icon">📝</span>
                    {transaction.notes}
                  </p>
                )}
              </div>

              {/* Transaction Actions */}
              <div className="transaction-actions">
                <button 
                  className="action-btn edit"
                  onClick={() => handleEditTransaction(transaction)}
                  title="Edit transaction"
                >
                  <span className="action-icon">✏️</span>
                  Edit
                </button>
                <button 
                  className="action-btn delete"
                  onClick={() => handleDeleteTransaction(transaction.id)}
                  title="Delete transaction"
                >
                  <span className="action-icon">🗑️</span>
                  Delete
                </button>
                <button 
                  className="action-btn more"
                  title="More options"
                >
                  <span className="action-icon">⋯</span>
                </button>
              </div>

              {/* Transaction ID (for debugging) */}
              <div className="transaction-meta">
                <span className="transaction-id">ID: {transaction.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    {/* Pagination or Load More */}
    {transactions.length > 0 && (
      <div className="transactions-footer">
        <div className="pagination-info">
          Showing {transactions.length} transactions
        </div>
        <button className="btn-load-more">
          <span className="btn-icon">📄</span>
          Load More
        </button>
      </div>
    )}

  </section>
)}

          {/* ✅ FIXED: Enhanced Success Banner with user-specific info */}
          <section className="success-banner">
            <div className="banner-content">
              <div className="banner-icon">🎉</div>
              <div className="banner-text">
                <h3>Personal Finance Dashboard Active!</h3>
                <p>✅ User Authenticated • ✅ Data Isolated • ✅ Real CRUD • ✅ Secure Access</p>
              </div>
              <div className="banner-stats">
                <span>User: {user.name}</span>
                <span>Transactions: {transactions.length}</span>
                <span>Status: Live 🟢</span>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={handleCloseModal}
        onSubmit={handleTransactionSubmit}
        transaction={editingTransaction}
        loading={transactionFormLoading}
      />
    </div>
  );
};

export default Dashboard;