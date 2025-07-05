import React, { useState, useEffect } from 'react';
import apiService from './services/api';
import CustomPieChart from './components/charts/PieChart';
import CustomLineChart from './components/charts/LineChart';
import PowerBIDashboard from './components/powerbi/PowerBIDashboard';
import TransactionModal from './components/transactions/TransactionModal';
import TransactionList from './components/transactions/TransactionList';

function App() {
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

  const userId = 1; // Using user ID 1 for demo

  // Fetch initial data
  const fetchData = async () => {
    try {
      const health = await apiService.healthCheck();
      const users = await apiService.getUsers();
      const spending = await apiService.getSpendingAnalysis(1);
      
      setData({ health, users, spending });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const transactionData = await apiService.getUserTransactions(userId, { limit: 50 });
      setTransactions(transactionData);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([fetchData(), fetchTransactions()]);
  };

  // Transaction handlers
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      setTransactionFormLoading(true);
      
      if (editingTransaction) {
        // Update existing transaction
        await apiService.updateTransaction(userId, editingTransaction.id, transactionData);
      } else {
        // Create new transaction
        await apiService.createTransaction(userId, transactionData);
      }
      
      setShowTransactionModal(false);
      setEditingTransaction(null);
      await refreshData(); // Refresh all data to update charts
      
    } catch (err) {
      console.error('Error saving transaction:', err);
      alert('Error saving transaction. Please try again.');
    } finally {
      setTransactionFormLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      await apiService.deleteTransaction(userId, transactionId);
      await refreshData(); // Refresh all data to update charts
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('Error deleting transaction. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Loading your financial dashboard...</p>
        </div>
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
        </div>
      </div>
    );
  }

  // Create trend data for the line chart
  const trendData = data.spending.monthly_trends.map(trend => ({
    name: trend.month,
    income: trend.income,
    expenses: trend.expenses,
    net: trend.net
  }));

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">💰</span>
              <h1>FinanceApp</h1>
            </div>
          </div>
          <div className="header-right">
            <div className="nav-tabs">
              <button 
                className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                📊 Overview
              </button>
              <button 
                className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                📈 Analytics
              </button>
              <button 
                className={`nav-tab ${activeTab === 'powerbi' ? 'active' : ''}`}
                onClick={() => setActiveTab('powerbi')}
              >
                ⚡ PowerBI
              </button>
              <button 
                className={`nav-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                💳 Transactions
              </button>
            </div>
            <div className="user-info">
              <span className="user-avatar">JD</span>
              <span className="user-name">{data.users[0]?.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          
          {/* Welcome Section */}
          <section className="welcome-section">
            <h2>Welcome back, {data.users[0]?.name.split(' ')[0]}! 👋</h2>
            <p>Here's your financial overview for today</p>
          </section>

          {/* Stats Cards */}
          <section className="stats-grid">
            <div className="stat-card income">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <h3>Total Income</h3>
                <p className="stat-value">${data.spending.total_income.toLocaleString()}</p>
                <span className="stat-change positive">+8.2% this month</span>
              </div>
            </div>

            <div className="stat-card expenses">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Expenses</h3>
                <p className="stat-value">${data.spending.total_expenses.toLocaleString()}</p>
                <span className="stat-change negative">-3.1% this month</span>
              </div>
            </div>

            <div className="stat-card savings">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>Savings Rate</h3>
                <p className="stat-value">{data.spending.savings_rate}%</p>
                <span className="stat-change positive">Excellent!</span>
              </div>
            </div>

            <div className="stat-card transactions">
              <div className="stat-icon">📋</div>
              <div className="stat-content">
                <h3>Transactions</h3>
                <p className="stat-value">{data.spending.transaction_count}</p>
                <span className="stat-change neutral">This period</span>
              </div>
            </div>
          </section>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <section className="content-grid">
              
              {/* Spending Categories Chart */}
              <div className="dashboard-card chart-card">
                <div className="card-header">
                  <h3>💳 Spending by Category</h3>
                  <span className="card-subtitle">Interactive breakdown</span>
                </div>
                <div className="chart-container">
                  <CustomPieChart 
                    data={data.spending.top_categories}
                    height={350}
                  />
                </div>
              </div>

              {/* Financial Health */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>🏥 Financial Health</h3>
                  <span className="card-subtitle">Overall score</span>
                </div>
                <div className="health-score">
                  <div className="score-circle">
                    <span className="score-number">85</span>
                    <span className="score-label">Excellent</span>
                  </div>
                  <div className="health-details">
                    <div className="health-item">
                      <span className="health-label">Savings Rate</span>
                      <span className="health-value">{data.spending.savings_rate}%</span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Budget Control</span>
                      <span className="health-value">Good</span>
                    </div>
                    <div className="health-item">
                      <span className="health-label">Spending Trend</span>
                      <span className="health-value">Stable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>⚡ Quick Actions</h3>
                  <span className="card-subtitle">Manage your finances</span>
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
                    onClick={() => setActiveTab('analytics')}
                  >
                    <span className="action-icon">📊</span>
                    View Reports
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => alert('Set Goals feature coming soon!')}
                  >
                    <span className="action-icon">🎯</span>
                    Set Goals
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => alert('Manage Budgets feature coming soon!')}
                  >
                    <span className="action-icon">💰</span>
                    Manage Budgets
                  </button>
                </div>
              </div>

            </section>
          )}

          {activeTab === 'analytics' && (
            <section className="content-grid">
              
              {/* Monthly Trends */}
              <div className="dashboard-card chart-card full-width">
                <div className="card-header">
                  <h3>📈 Monthly Trends</h3>
                  <span className="card-subtitle">Income vs Expenses over time</span>
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
                  <span className="card-subtitle">Detailed breakdown</span>
                </div>
                <div className="categories-list">
                  {data.spending.top_categories.map((category, index) => (
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
                      <div className="category-amount">
                        <span className="amount">${category.amount.toLocaleString()}</span>
                        <span className="percentage">{category.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>💡 Smart Insights</h3>
                  <span className="card-subtitle">AI-powered recommendations</span>
                </div>
                <div className="insights-list">
                  <div className="insight-item positive">
                    <span className="insight-icon">🎉</span>
                    <div className="insight-content">
                      <h4>Great Savings Rate!</h4>
                      <p>Your {data.spending.savings_rate}% savings rate is excellent. Keep it up!</p>
                    </div>
                  </div>
                  <div className="insight-item warning">
                    <span className="insight-icon">⚠️</span>
                    <div className="insight-content">
                      <h4>Housing Expense High</h4>
                      <p>Housing takes up {data.spending.top_categories[0]?.percentage}% of expenses. Consider optimizing.</p>
                    </div>
                  </div>
                  <div className="insight-item info">
                    <span className="insight-icon">📊</span>
                    <div className="insight-content">
                      <h4>Spending Pattern Stable</h4>
                      <p>Your spending has been consistent over the past months.</p>
                    </div>
                  </div>
                </div>
              </div>

            </section>
          )}

          {activeTab === 'powerbi' && (
            <PowerBIDashboard data={data} />
          )}

          {activeTab === 'transactions' && (
            <section className="content-grid">
              
              {/* Transaction Management */}
              <div className="dashboard-card full-width">
                <div className="card-header">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3>💳 Transaction Management</h3>
                      <span className="card-subtitle">Manage your income and expenses</span>
                    </div>
                    <button 
                      className="btn btn-primary"
                      onClick={handleAddTransaction}
                    >
                      ➕ Add Transaction
                    </button>
                  </div>
                </div>
                <div style={{ padding: '1.5rem' }}>
                  <TransactionList
                    transactions={transactions}
                    loading={transactionsLoading}
                    onEdit={handleEditTransaction}
                    onDelete={handleDeleteTransaction}
                    onRefresh={fetchTransactions}
                  />
                </div>
              </div>

            </section>
          )}

          {/* Success Banner */}
          <section className="success-banner">
            <div className="banner-content">
              <div className="banner-icon">🎉</div>
              <div className="banner-text">
                <h3>Full-Stack Finance Dashboard Complete!</h3>
                <p>Transaction Management • PowerBI • Interactive charts • Real-time updates</p>
              </div>
              <div className="banner-stats">
                <span>CRUD: Complete</span>
                <span>PowerBI: Integrated</span>
                <span>Live Updates: Active</span>
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
}

export default App;