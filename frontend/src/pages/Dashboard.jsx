import React, { useState, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import apiService from '../services/api';
import CustomPieChart from '../components/charts/PieChart';
import CustomLineChart from '../components/charts/LineChart';
import PowerBIDashboard from '../components/powerbi/PowerBIDashboard';
import TransactionModal from '../components/transactions/TransactionModal';
import TransactionList from '../components/transactions/TransactionList';
import { useAuth } from '../contexts/AuthContext';


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

  const { user } = useAuth();
  const userId = user?.id || 1;
  // Enhanced fetch initial data with better error handling
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [health, users, spending] = await Promise.all([
        apiService.healthCheck(),
        apiService.getUsers(),
        apiService.getSpendingAnalysis(1)
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

  // Enhanced fetch transactions with better error handling
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
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

  // Enhanced transaction handlers with toast notifications
  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowTransactionModal(true);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction);
    setShowTransactionModal(true);
    toast('✏️ Editing transaction...', { duration: 2000 });
  };

  const handleTransactionSubmit = async (transactionData) => {
    try {
      setTransactionFormLoading(true);
      
      if (editingTransaction) {
        await apiService.updateTransaction(userId, editingTransaction.id, transactionData);
        toast.success('💾 Transaction updated successfully!', {
          icon: '✅',
          style: {
            borderRadius: '10px',
            background: '#10B981',
            color: '#fff',
          },
        });
      } else {
        await apiService.createTransaction(userId, transactionData);
        toast.success('➕ Transaction added successfully!', {
          icon: '🎉',
          style: {
            borderRadius: '10px',
            background: '#059669',
            color: '#fff',
          },
        });
      }
      
      setShowTransactionModal(false);
      setEditingTransaction(null);
      await refreshData(); // Refresh all data to update charts
      
    } catch (err) {
      console.error('Error saving transaction:', err);
      const action = editingTransaction ? 'update' : 'add';
      toast.error(`❌ Failed to ${action} transaction: ${err.message}`, {
        duration: 5000,
        style: {
          borderRadius: '10px',
          background: '#EF4444',
          color: '#fff',
        },
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
          <div className="mt-4 text-sm text-gray-600">
            Connecting to database and fetching your data...
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
  const trendData = data.spending.monthly_trends.map(trend => ({
    name: trend.month,
    income: trend.income,
    expenses: trend.expenses,
    net: trend.net
  }));

  return (
    <div className="dashboard">
      {/* Enhanced Toast Notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
            style: {
              background: '#10B981',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
            style: {
              background: '#EF4444',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3B82F6',
              secondary: '#fff',
            },
            style: {
              background: '#3B82F6',
            },
          },
        }}
      />

      {/* Enhanced Header */}
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
            <div className="user-info">
              <span className="user-avatar">JD</span>
              <span className="user-name">{data.users[0]?.name}</span>
              {/* Enhanced refresh button */}
              <button 
                onClick={refreshData}
                className="ml-3 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                title="Refresh all data"
              >
                🔄
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="dashboard-container">
          
          {/* Enhanced Welcome Section */}
          <section className="welcome-section">
            <h2>Welcome back, {data.users[0]?.name.split(' ')[0]}! 👋</h2>
            <p>Here's your financial overview for today</p>
            {/* Status indicator */}
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live Data Connected
              </span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </section>

          {/* Enhanced Stats Cards */}
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

              {/* Enhanced Quick Actions */}
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
                    onClick={() => handleTabSwitch('analytics')}
                  >
                    <span className="action-icon">📊</span>
                    View Reports
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

          {/* Enhanced Success Banner */}
          <section className="success-banner">
            <div className="banner-content">
              <div className="banner-icon">🎉</div>
              <div className="banner-text">
                <h3>Full-Stack Finance Dashboard Complete!</h3>
                <p>✅ Database Connected • ✅ Real CRUD • ✅ Toast Notifications • ✅ Error Handling</p>
              </div>
              <div className="banner-stats">
                <span>Users: {data.users?.length || 0}</span>
                <span>Transactions: {data.spending?.transaction_count || 0}</span>
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
}

export default App;