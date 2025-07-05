import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '4px' }}>
          {data.name}
        </p>
        <p style={{ color: '#4a5568' }}>
          Amount: ${data.value.toLocaleString()}
        </p>
        <p style={{ color: '#4a5568' }}>
          Percentage: {data.payload.percentage}%
        </p>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Don't show label for slices smaller than 5%
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12"
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomPieChart = ({ data = [], title = '', height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ 
        height: height, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#718096'
      }}>
        No data available
      </div>
    );
  }

  // Transform data for recharts
  const chartData = data.map((item, index) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div>
      {title && (
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#2d3748', 
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry) => (
              <span style={{ color: entry.color, fontSize: '14px' }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomPieChart;