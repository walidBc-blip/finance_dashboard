import React, { useState } from 'react';
import PowerBIEmbed from './PowerBIEmbed';

const PowerBIDashboard = ({ data }) => {
  const [activeReport, setActiveReport] = useState('financial-overview');
  const [filters, setFilters] = useState({
    timeframe: '6months',
    category: 'all'
  });

  const reports = [
    {
      id: 'financial-overview',
      title: 'Financial Overview Dashboard',
      description: 'Complete financial health analysis',
      icon: '📊'
    },
    {
      id: 'spending-analysis',
      title: 'Spending Analysis Report',
      description: 'Detailed expense breakdown and trends',
      icon: '💳'
    },
    {
      id: 'budget-performance',
      title: 'Budget Performance Tracker',
      description: 'Budget vs actual spending analysis',
      icon: '🎯'
    },
    {
      id: 'predictive-analytics',
      title: 'Predictive Analytics',
      description: 'AI-powered financial forecasting',
      icon: '🔮'
    }
  ];

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return (
    <div className="powerbi-dashboard">
      
      {/* Dashboard Header */}
      <div className="powerbi-header">
        <div className="header-content">
          <div className="header-left">
            <h2 className="dashboard-title">
              <span className="powerbi-logo">⚡</span>
              PowerBI Analytics Dashboard
            </h2>
            <p className="dashboard-subtitle">
              Enterprise-level business intelligence for your finances
            </p>
          </div>
          
          <div className="header-right">
            <div className="dashboard-stats">
              <div className="stat-item">
                <span className="stat-label">Data Sources</span>
                <span className="stat-value">3 Connected</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Updated</span>
                <span className="stat-value">Real-time</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Reports</span>
                <span className="stat-value">{reports.length} Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Report Navigation */}
      <div className="powerbi-navigation">
        <div className="nav-content">
          <div className="nav-tabs">
            {reports.map(report => (
              <button
                key={report.id}
                className={`nav-tab ${activeReport === report.id ? 'active' : ''}`}
                onClick={() => setActiveReport(report.id)}
              >
                <span className="tab-icon">{report.icon}</span>
                <div className="tab-content">
                  <span className="tab-title">{report.title}</span>
                  <span className="tab-description">{report.description}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Global Filters */}
          <div className="global-filters">
            <div className="filter-group">
              <label>Time Period</label>
              <select 
                value={filters.timeframe}
                onChange={(e) => handleFilterChange({ timeframe: e.target.value })}
                className="filter-select"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>Category</label>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange({ category: e.target.value })}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                <option value="housing">Housing</option>
                <option value="food">Food</option>
                <option value="transportation">Transportation</option>
                <option value="entertainment">Entertainment</option>
                <option value="utilities">Utilities</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* PowerBI Report Content */}
      <div className="powerbi-content">
        <PowerBIEmbed
          reportId={activeReport}
          title={reports.find(r => r.id === activeReport)?.title}
          height={700}
          data={data}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      </div>

      {/* PowerBI Features Showcase */}
      <div className="powerbi-features">
        <div className="features-content">
          <h3 className="features-title">🚀 PowerBI Features Demonstrated</h3>
          <div className="features-grid">
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div className="feature-content">
                <h4>Interactive Dashboards</h4>
                <p>Real-time data visualization with drill-down capabilities</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <div className="feature-content">
                <h4>Advanced Filtering</h4>
                <p>Dynamic filters and slicers for data exploration</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div className="feature-content">
                <h4>Predictive Analytics</h4>
                <p>AI-powered forecasting and trend analysis</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <div className="feature-content">
                <h4>Responsive Design</h4>
                <p>Optimized for desktop, tablet, and mobile devices</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">🔄</span>
              <div className="feature-content">
                <h4>Real-time Data</h4>
                <p>Live connections to your backend database</p>
              </div>
            </div>
            
            <div className="feature-item">
              <span className="feature-icon">📤</span>
              <div className="feature-content">
                <h4>Export & Share</h4>
                <p>PDF, Excel export with sharing capabilities</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default PowerBIDashboard;