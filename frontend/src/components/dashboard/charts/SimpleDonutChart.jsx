import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6'];

export const SimpleDonutChart = ({ data = [], height = 220, formatTooltip }) => {
  if (!data.length) return null;

  return (
    <div className="w-full flex items-center justify-center" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              fontSize: '13px'
            }}
            formatter={formatTooltip}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DonutLegend = ({ data = [] }) => (
  <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-3">
    {data.map((entry, idx) => (
      <div key={idx} className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
        <span className="text-xs font-medium text-gray-600">{entry.name}</span>
        <span className="text-xs font-bold text-gray-900">{entry.value}</span>
      </div>
    ))}
  </div>
);

export default SimpleDonutChart;
