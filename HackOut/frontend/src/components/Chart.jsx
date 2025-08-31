import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';

const Chart = ({ data = [], color = '#06b6d4', title, avgLine = false }) => (
  <div className="bg-slate-800/30 backdrop-blur-lg rounded-xl p-4 border border-slate-700/50">
    <h4 className="font-semibold text-sm mb-4 text-slate-300">{title}</h4>
    {data.length > 0 ? (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
          <XAxis 
            dataKey="name" 
            stroke="rgba(148, 163, 184, 0.6)" 
            tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 12 }}
            tickLine={{ stroke: 'rgba(148, 163, 184, 0.6)' }}
          />
          <YAxis 
            stroke="rgba(148, 163, 184, 0.6)" 
            tick={{ fill: 'rgba(148, 163, 184, 0.6)', fontSize: 12 }}
            tickLine={{ stroke: 'rgba(148, 163, 184, 0.6)' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(15, 23, 42, 0.8)', 
              border: '1px solid rgba(100, 116, 139, 0.5)',
              borderRadius: '8px',
              color: '#f8fafc',
            }} 
          />
          {avgLine && (
            <ReferenceLine 
              y={data.reduce((sum, item) => sum + item.value, 0) / data.length} 
              stroke="rgba(255, 255, 255, 0.5)" 
              strokeDasharray="3 3" 
              label={{ 
                value: 'Avg', 
                position: 'right', 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontSize: 12
              }} 
            />
          )}
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2} 
            dot={{ fill: color, strokeWidth: 1, r: 3 }}
            activeDot={{ fill: color, strokeWidth: 2, r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    ) : (
      <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
        No data available
      </div>
    )}
  </div>
);

export default Chart;