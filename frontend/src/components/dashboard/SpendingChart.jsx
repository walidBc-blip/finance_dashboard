import React from 'react';
import Card from '../ui/Card';
import LoadingSpinner from '../ui/LoadingSpinner';
import CustomPieChart from '../charts/PieChart';

const SpendingChart = ({ data, loading, error }) => {
  if (loading) {
    return (
      <Card title="Spending by Category" className="h-96">
        <LoadingSpinner text="Loading spending data..." />
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Spending by Category">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading spending data: {error}</p>
        </div>
      </Card>
    );
  }

  if (!data || !data.top_categories || data.top_categories.length === 0) {
    return (
      <Card title="Spending by Category">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500">No spending data available</p>
        </div>
      </Card>
    );
  }

  // Transform data for the pie chart
  const chartData = data.top_categories.map(category => ({
    name: category.category,
    value: category.amount,
    percentage: category.percentage
  }));

  const totalSpent = data.total_expenses || 0;

  return (
    <Card 
      title="Spending by Category"
      subtitle={`Total expenses: $${totalSpent.toLocaleString()}`}
    >
      <div className="space-y-6">
        {/* Pie Chart */}
        <CustomPieChart
          data={chartData}
          height={300}
          showLegend={true}
          labelKey="name"
          valueKey="value"
        />

        {/* Category breakdown list */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Category Breakdown</h4>
          <div className="space-y-2">
            {data.top_categories.slice(0, 5).map((category, index) => (
              <div key={category.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ 
                      backgroundColor: [
                        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                        '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
                      ][index % 10]
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {category.category}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    ${category.amount.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {category.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick insights */}
        {data.top_categories.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="text-sm font-medium text-blue-900 mb-2">💡 Quick Insights</h5>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• Your largest expense category is <strong>{data.top_categories[0].category}</strong> at {data.top_categories[0].percentage}%</p>
              {data.top_categories.length > 1 && (
                <p>• Top 3 categories account for {
                  data.top_categories.slice(0, 3).reduce((sum, cat) => sum + cat.percentage, 0).toFixed(1)
                }% of your spending</p>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SpendingChart;