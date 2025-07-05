import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';

const TransactionRow = ({ transaction }) => {
  const {
    id,
    description,
    amount,
    category,
    transaction_type,
    transaction_date,
    created_at
  } = transaction;

  const isIncome = transaction_type === 'income';
  const amountColor = isIncome ? 'text-green-600' : 'text-red-600';
  const amountPrefix = isIncome ? '+' : '-';

  // Category color mapping
  const getCategoryColor = (category) => {
    const colors = {
      'Housing': 'bg-blue-100 text-blue-800',
      'Food': 'bg-green-100 text-green-800',
      'Transportation': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Salary': 'bg-emerald-100 text-emerald-800',
      'Utilities': 'bg-orange-100 text-orange-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Travel': 'bg-cyan-100 text-cyan-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors duration-150">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
            ${isIncome ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
          `}>
            {isIncome ? '↗' : '↙'}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {description}
            </div>
            <div className="text-sm text-gray-500">
              ID: {id}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`
          inline-flex px-2 py-1 text-xs font-medium rounded-full
          ${getCategoryColor(category)}
        `}>
          {category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(transaction_date)}
      </td>
      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${amountColor}`}>
        {amountPrefix}${Math.abs(amount).toLocaleString()}
      </td>
    </tr>
  );
};

const RecentTransactions = ({ transactions, loading, error, limit = 5 }) => {
  if (loading) {
    return (
      <Card title="Recent Transactions" className="h-96">
        <LoadingSpinner text="Loading transactions..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Recent Transactions">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading transactions: {error}</p>
        </div>
      </Card>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card title="Recent Transactions">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No transactions found</p>
          <Link 
            to="/transactions" 
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Add your first transaction
          </Link>
        </div>
      </Card>
    );
  }

  const displayTransactions = transactions.slice(0, limit);

  return (
    <Card 
      title="Recent Transactions"
      subtitle={`Showing ${displayTransactions.length} of ${transactions.length} transactions`}
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Transaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayTransactions.map((transaction) => (
              <TransactionRow key={transaction.id} transaction={transaction} />
            ))}
          </tbody>
        </table>
      </div>
      
      {transactions.length > limit && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <Link 
            to="/transactions" 
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            View all {transactions.length} transactions →
          </Link>
        </div>
      )}
    </Card>
  );
};

export default RecentTransactions;