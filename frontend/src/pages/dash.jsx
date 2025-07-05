import React from 'react';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SpendingChart from '../components/dashboard/SpendingChart';
import Card from '../components/ui/Card';
import { useTransactions, useSpendingAnalysis } from '../hooks/useApi';

const Dashboard = () => {
  // Using user ID 1 for demo - in a real app, this would come from auth context
  const userId = 1;

  // Fetch data using our custom hooks
  const { 
    data: transactions, 
    loading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions(userId, { limit: 10 });

  const { 
    data: spendingAnalysis, 
    loading: analysisLoading, 
    error: analysisError 
  } = useSpendingAnalysis(userId, 6); // Last 6 months

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg">
        <div className="px-6 py-8 sm:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Welcome back, John! 👋
              </h1>
              <p className="mt-2 text-blue-100">
                Here's what's happening with your finances today.
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {new Date().getDate()}
                  </div>
                  <div className="text-sm text-blue-100">
                    {new Date().toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Stats Cards */}
      <section>
        <DashboardStats 
          data={spendingAnalysis} 
          loading={analysisLoading} 
          error={analysisError} 
        />
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Spending by Category */}
          <SpendingChart 
            data={spendingAnalysis} 
            loading={analysisLoading} 
            error={analysisError} 
          />

          {/* Monthly Trends Chart */}
          <Card title="Monthly Trends" subtitle="Income vs Expenses over time">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Monthly trends chart coming soon...</p>
            </div>
          </Card>
        </div>

        {/* Right Column - Transactions & Quick Actions */}
        <div className="space-y-8">
          {/* Recent Transactions */}
          <RecentTransactions 
            transactions={transactions} 
            loading={transactionsLoading} 
            error={transactionsError}
            limit={5}
          />

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Transaction
              </button>
              
              <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Set Budget
              </button>
              
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Create Goal
              </button>
            </div>
          </Card>

          {/* Financial Health Score */}
          <Card title="Financial Health Score">
            <div className="text-center py-6">
              <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">85</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Excellent financial health!</p>
              <div className="bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View detailed analysis →
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section - Recent Activity */}
      <Card title="Recent Activity" subtitle="Latest updates across your accounts">
        <div className="space-y-4">
          {[
            { type: 'transaction', message: 'New expense: Grocery shopping - $127.50', time: '2 hours ago', icon: '🛒' },
            { type: 'budget', message: 'Budget alert: Food category at 80% of monthly limit', time: '1 day ago', icon: '⚠️' },
            { type: 'goal', message: 'Goal milestone: Emergency fund reached 50%', time: '3 days ago', icon: '🎯' },
            { type: 'income', message: 'Income received: Monthly salary - $5,000.00', time: '1 week ago', icon: '💰' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-lg">
                {activity.icon}
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;