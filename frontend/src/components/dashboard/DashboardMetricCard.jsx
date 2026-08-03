import React from 'react';

const toneMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', iconText: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', iconBg: 'bg-amber-100', iconText: 'text-amber-600' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-700', iconBg: 'bg-violet-100', iconText: 'text-violet-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', iconBg: 'bg-rose-100', iconText: 'text-rose-600' },
  fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', iconBg: 'bg-fuchsia-100', iconText: 'text-fuchsia-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', iconBg: 'bg-teal-100', iconText: 'text-teal-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', iconBg: 'bg-cyan-100', iconText: 'text-cyan-600' },
  green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', iconText: 'text-green-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', iconBg: 'bg-purple-100', iconText: 'text-purple-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', iconBg: 'bg-yellow-100', iconText: 'text-yellow-600' },
  red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', iconText: 'text-red-600' },
  gray: { bg: 'bg-gray-50', text: 'text-gray-700', iconBg: 'bg-gray-100', iconText: 'text-gray-600' },
};

export const DashboardMetricCard = ({ label, value, sub, icon, tone = 'indigo', onClick, className = '', bg, text: textCls, border }) => {
  const colors = toneMap[tone] || toneMap.indigo;

  const borderClass = border || 'border border-gray-100';
  const textColor = textCls || 'text-gray-950';

  return (
    <div
      onClick={onClick}
      className={`group rounded-3xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${bg || 'bg-white'} ${borderClass} ${className} ${textColor}`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl ${colors.iconBg} ${colors.iconText} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
          {icon}
        </div>
        {value !== undefined && (
          <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">System</span>
        )}
      </div>
      {value !== undefined && (
        <>
          <p className="text-3xl font-extrabold mt-5 tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</p>
          <p className="text-sm font-semibold mt-1 opacity-90">{label}</p>
          {sub && <p className="text-xs mt-0.5 opacity-70">{sub}</p>}
        </>
      )}
    </div>
  );
};

export default DashboardMetricCard;
