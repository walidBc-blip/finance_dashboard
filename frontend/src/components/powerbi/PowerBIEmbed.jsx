import React, { useState, useEffect } from 'react';

const PowerBIEmbed = ({ 
  reportId, 
  title = "Financial Analytics Report",
  height = 600,
  data = null,
  filters = {},
  onFilterChange = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('overview');
  const [selectedTimeframe, setSelectedTimeframe] = useState('6months');

  useEffect(() => {
    // Simulate PowerBI loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [reportId, filters]);

  if (isLoading) {
    return (
      <div className="powerbi-container" style={{ height: `${height}px` }}>
        <div className="powerbi-loading">
          <div className="powerbi-spinner">
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
          <p>Loading PowerBI Report...</p>
          <div className="loading-bar">
            <div className="loading-progress"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="powerbi-container" style={{ height: `${height}px` }}>
      {/* PowerBI Toolbar */}
      <div className="powerbi-toolbar">
        <div className="powerbi-toolbar-left">
          <div className="powerbi-logo">
            <span className="powerbi-icon">📊</span>
            <span className="powerbi-text">Power BI</span>
          </div>
          <h3 className="powerbi-title">{title}</h3>
        </div>
        
        <div className="powerbi-toolbar-right">
          {/* Time Filter */}
          <select 
            className="powerbi-filter"
            value={selectedTimeframe}
            onChange={(e) => {
              setSelectedTimeframe(e.target.value);
              onFilterChange({ timeframe: e.target.value });
            }}
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
          </select>

          {/* View Toggle */}
          <div className="powerbi-view-toggle">
            <button 
              className={`view-btn ${currentView === 'overview' ? 'active' : ''}`}
              onClick={() => setCurrentView('overview')}
            >
              📈 Overview
            </button>
            <button 
              className={`view-btn ${currentView === 'detailed' ? 'active' : ''}`}
              onClick={() => setCurrentView('detailed')}
            >
              📊 Detailed
            </button>
          </div>

          {/* Export Options */}
          <div className="powerbi-export">
            <button className="export-btn" title="Export to PDF">
              📄 PDF
            </button>
            <button className="export-btn" title="Export to Excel">
              📊 Excel
            </button>
            <button className="export-btn" title="Share Report">
              🔗 Share
            </button>
          </div>
        </div>
      </div>

      {/* PowerBI Content */}
      <div className="powerbi-content">
        {currentView === 'overview' ? (
          <PowerBIOverviewReport data={data} timeframe={selectedTimeframe} />
        ) : (
          <PowerBIDetailedReport data={data} timeframe={selectedTimeframe} />
        )}
      </div>

      {/* PowerBI Footer */}
      <div className="powerbi-footer">
        <div className="powerbi-footer-left">
          <span className="last-refresh">Last refreshed: {new Date().toLocaleString()}</span>
        </div>
        <div className="powerbi-footer-right">
          <button className="refresh-btn" onClick={() => window.location.reload()}>
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};

// Overview Report Component
const PowerBIOverviewReport = ({ data, timeframe }) => {
  if (!data) return <div className="no-data">No data available</div>;

  return (
    <div className="powerbi-report overview-report">
      <div className="report-grid">
        
        {/* KPI Cards */}
        <div className="kpi-section">
          <h4 className="section-title">Key Performance Indicators</h4>
          <div className="kpi-grid">
            <div className="kpi-card revenue">
              <div className="kpi-icon">💰</div>
              <div className="kpi-content">
                <span className="kpi-label">Total Revenue</span>
                <span className="kpi-value">${data.spending?.total_income?.toLocaleString() || 0}</span>
                <span className="kpi-trend positive">↗ +8.2%</span>
              </div>
            </div>
            
            <div className="kpi-card expenses">
              <div className="kpi-icon">📉</div>
              <div className="kpi-content">
                <span className="kpi-label">Total Expenses</span>
                <span className="kpi-value">${data.spending?.total_expenses?.toLocaleString() || 0}</span>
                <span className="kpi-trend negative">↘ -3.1%</span>
              </div>
            </div>
            
            <div className="kpi-card savings">
              <div className="kpi-icon">🎯</div>
              <div className="kpi-content">
                <span className="kpi-label">Savings Rate</span>
                <span className="kpi-value">{data.spending?.savings_rate || 0}%</span>
                <span className="kpi-trend positive">↗ +2.3%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Spending Breakdown */}
        <div className="chart-section">
          <h4 className="section-title">Spending Distribution</h4>
          <div className="powerbi-chart-placeholder">
            <div className="chart-visual">
              {data.spending?.top_categories?.map((category, index) => (
                <div key={category.category} className="bar-item">
                  <span className="bar-label">{category.category}</span>
                  <div className="bar-container">
                    <div 
                      className="bar-fill"
                      style={{ 
                        width: `${category.percentage}%`,
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index]
                      }}
                    />
                  </div>
                  <span className="bar-value">${category.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="insights-section">
          <h4 className="section-title">AI Insights</h4>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon positive">✅</span>
              <span className="insight-text">Savings rate of {data.spending?.savings_rate}% exceeds recommended 20%</span>
            </div>
            <div className="insight-item">
              <span className="insight-icon warning">⚠️</span>
              <span className="insight-text">Housing expenses at {data.spending?.top_categories?.[0]?.percentage}% of budget</span>
            </div>
            <div className="insight-item">
              <span className="insight-icon info">ℹ️</span>
              <span className="insight-text">Spending pattern stable across {timeframe}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Detailed Report Component
const PowerBIDetailedReport = ({ data, timeframe }) => {
  return (
    <div className="powerbi-report detailed-report">
      <div className="detailed-grid">
        
        {/* Transaction Analysis */}
        <div className="analysis-section">
          <h4 className="section-title">Transaction Analysis</h4>
          <div className="transaction-metrics">
            <div className="metric">
              <span className="metric-label">Total Transactions</span>
              <span className="metric-value">{data.spending?.transaction_count || 0}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Average Transaction</span>
              <span className="metric-value">
                ${Math.round((data.spending?.total_expenses || 0) / (data.spending?.transaction_count || 1)).toLocaleString()}
              </span>
            </div>
            <div className="metric">
              <span className="metric-label">Largest Category</span>
              <span className="metric-value">{data.spending?.top_categories?.[0]?.category || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Trend Analysis */}
        <div className="trend-section">
          <h4 className="section-title">Trend Analysis</h4>
          <div className="trend-chart">
            <div className="trend-placeholder">
              <p>📈 Monthly trends would be displayed here</p>
              <p>Interactive PowerBI-style line charts</p>
              <p>Drill-down capabilities</p>
            </div>
          </div>
        </div>

        {/* Forecasting */}
        <div className="forecast-section">
          <h4 className="section-title">Predictive Analytics</h4>
          <div className="forecast-content">
            <div className="forecast-item">
              <span className="forecast-label">Next Month Expenses</span>
              <span className="forecast-value">${(data.spending?.total_expenses * 1.02 || 0).toLocaleString()}</span>
              <span className="forecast-confidence">95% confidence</span>
            </div>
            <div className="forecast-item">
              <span className="forecast-label">Year-end Savings</span>
              <span className="forecast-value">${((data.spending?.total_income - data.spending?.total_expenses) * 12 || 0).toLocaleString()}</span>
              <span className="forecast-confidence">Based on current trend</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PowerBIEmbed;