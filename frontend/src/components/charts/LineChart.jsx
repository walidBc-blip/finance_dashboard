import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontWeight: '600', color: '#2d3748', marginBottom: '8px' }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color, margin: '4px 0' }}>
            {entry.name}: ${entry.value?.toLocaleString() || 0}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomLineChart = ({ 
  data = [], 
  title = '',
  height = 300,
  lines = [{ key: 'value', color: '#3B82F6', name: 'Value' }],
  xAxisKey = 'name'
}) => {
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

  return (
    <div>
      {title && (
        <h3 style={{ 
          fontSize: '1.125rem', 
          fontWeight: '600', 
          color: '#2d3748', 
          marginBottom: '1rem'
        }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey={xAxisKey}
            stroke="#718096"
            fontSize={12}
          />
          <YAxis 
            stroke="#718096"
            fontSize={12}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              strokeWidth={3}
              dot={{ fill: line.color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: line.color, strokeWidth: 2 }}
              name={line.name}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CustomLineChart;