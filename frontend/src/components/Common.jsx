import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

export const Alert = ({ type = 'info', title, message, onClose }) => {
  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return (
    <div className={`${typeStyles[type]} border rounded-lg p-4 flex items-start gap-3`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 font-semibold hover:opacity-70">
          ×
        </button>
      )}
    </div>
  );
};

export const Badge = ({ children, type = 'info', className = '' }) => {
  const typeStyles = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    warning: 'bg-yellow-100 text-yellow-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`badge ${typeStyles[type]} ${className}`}>
      {children}
    </span>
  );
};

export const Card = ({ children, className = '', ...props }) => (
  <div className={`card ${className}`} {...props}>
    {children}
  </div>
);

export const Button = ({ children, variant = 'primary', className = '', loading = false, ...props }) => {
  const baseClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'danger'
      ? 'btn-danger'
      : variant === 'success'
      ? 'btn-success'
      : variant === 'ghost'
      ? 'btn-ghost'
      : 'btn-primary';

  return (
    <button
      className={`${baseClass} ${className} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export const Input = ({ label, icon, error, ...props }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <label className="text-sm font-semibold text-dark">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <input
        className={`input-field ${icon ? 'pl-10' : ''} ${error ? 'border-danger focus:border-danger' : ''}`}
        {...props}
      />
    </div>
    {error && <span className="text-sm text-danger">{error}</span>}
  </div>
);

export const TextArea = ({ label, error, ...props }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <label className="text-sm font-semibold text-dark">
        {label}
      </label>
    )}
    <textarea
      className={`input-field resize-none ${error ? 'border-danger focus:border-danger' : ''}`}
      {...props}
    />
    {error && <span className="text-sm text-danger">{error}</span>}
  </div>
);

export const Select = ({ label, options = [], error, ...props }) => (
  <div className="flex flex-col gap-2">
    {label && (
      <label className="text-sm font-semibold text-dark">
        {label}
      </label>
    )}
    <select
      className={`input-field ${error ? 'border-danger focus:border-danger' : ''}`}
      {...props}
    >
      <option value="">Select an option</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {error && <span className="text-sm text-danger">{error}</span>}
  </div>
);

export const Spinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizes[size]} border-4 border-primary border-t-transparent rounded-full animate-spin`} />
  );
};

export const CountUp = ({ value = 0, duration = 800, format }) => {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const target = Number(value) || 0;
    let frameId;
    let startTs;

    const tick = (ts) => {
      if (!startTs) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  return <>{format ? format(display) : display.toLocaleString()}</>;
};

export const MiniSparkline = ({ data = [], className = '', stroke = '#2563eb', fill = 'rgba(37, 99, 235, 0.12)' }) => {
  const values = data.length ? data : [0, 0, 0, 0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const height = 72;
  const step = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return `${x},${y}`;
  });

  const areaPoints = [`0,${height}`, ...points, `${width},${height}`].join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} preserveAspectRatio="none" aria-hidden="true">
      <polygon points={areaPoints} fill={fill} />
      <polyline points={points.join(' ')} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ProgressRing = ({ value = 0, max = 100, size = 128, stroke = 12, color = '#2563eb', track = '#e5e7eb', label }) => {
  const safeMax = max || 100;
  const pct = Math.max(0, Math.min(100, Math.round((value / safeMax) * 100)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <p className="text-2xl font-extrabold text-gray-900 tabular-nums">{pct}%</p>
        {label && <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{label}</p>}
      </div>
    </div>
  );
};

export const TimelineFeed = ({ items = [] }) => {
  if (!items.length) {
    return <p className="text-sm text-gray-400">No recent activity yet.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <span className={`mt-1.5 w-2.5 h-2.5 rounded-full ${item.dotClass || 'bg-blue-500'}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
            {item.subtitle && <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>}
          </div>
          {item.time && <span className="text-[11px] text-gray-400 whitespace-nowrap">{item.time}</span>}
        </div>
      ))}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  }[size] || 'max-w-xl';

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl ${sizeClass} w-full animate-fade-in flex flex-col`} style={{ maxHeight: '92vh' }}>
        <div className="flex justify-between items-center px-6 py-5 border-b flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 text-xl font-bold transition-colors">
            ×
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export const Table = ({ columns, data, loading = false }) => {
  if (loading) {
    return <div className="text-center py-8"><Spinner /></div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No data found</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-100 border-b-2 border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-semibold text-dark text-sm"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pages = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
      >
        Prev
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`px-3 py-1 rounded ${
            page === currentPage
              ? 'bg-primary text-white'
              : 'border hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded border hover:bg-gray-100 disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

// ── Question Status Guide ──────────────────────────────────
const STATUS_DEFINITIONS = [
  {
    key: 'draft',
    label: 'Draft',
    color: 'border-yellow-400 bg-yellow-50',
    dot: 'bg-yellow-400',
    textColor: 'text-yellow-700',
    purpose: 'Initial authoring phase. The question is under development by the faculty member or subject matter expert — it may still lack complete distractors, need alignment with ILOs, or require medical literature references.',
    rules: 'Strictly isolated from the active testing pool. Visible only to the author or designated co-authors for ongoing editing and refinement.',
  },
  {
    key: 'vetted',
    label: 'Vetted',
    color: 'border-blue-400 bg-blue-50',
    dot: 'bg-blue-500',
    textColor: 'text-blue-700',
    purpose: 'Rigorous peer-review and quality assurance phase. A committee or designated senior reviewer evaluates scientific accuracy, adherence to psychometric standards, formatting consistency, and cognitive level appropriateness.',
    rules: 'May undergo revisions based on reviewer feedback. Cannot be deployed in any exam while under review.',
  },
  {
    key: 'active',
    label: 'Active',
    color: 'border-green-400 bg-green-50',
    dot: 'bg-green-500',
    textColor: 'text-green-700',
    purpose: 'Fully approved, scientifically sound, and perfectly aligned with the curriculum. Ready for immediate deployment in both formative and summative assessments.',
    rules: 'Forms the available pool from which exam generators or faculty can select questions for upcoming assessments.',
  },
  {
    key: 'used',
    label: 'Used',
    color: 'border-gray-300 bg-gray-50',
    dot: 'bg-gray-400',
    textColor: 'text-gray-600',
    purpose: 'Post-administration phase — the question has been administered to students in a live exam and now transitions to a data point awaiting psychometric evaluation.',
    rules: 'Typically locked to prevent edits that might corrupt historical assessment data. Remains here while statistical analyses (difficulty index, discrimination index, distractor efficiency) are conducted. May later return to Active, go to Draft for revision, or be Archived.',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    color: 'border-red-400 bg-red-50',
    dot: 'bg-red-500',
    textColor: 'text-red-700',
    purpose: 'Critically failed the vetting process or deemed fundamentally flawed due to severe scientific inaccuracies, unsolvable structural issues, or failure to align with required medical competencies.',
    rules: 'Permanently barred from the active pool. Retained in the database for auditing purposes and to prevent replication of similar flawed questions in the future.',
  },
  {
    key: 'archived',
    label: 'Archived',
    color: 'border-amber-400 bg-amber-50',
    dot: 'bg-amber-700',
    textColor: 'text-amber-800',
    purpose: 'Retirement of an item — no longer relevant due to updated clinical guidelines, syllabus shifts, or consistent evidence of poor psychometric performance over multiple cohorts.',
    rules: 'Removed from the selection pool. Unlike rejected items, archived questions often have a history of successful use but have reached the end of their lifecycle. Legacy data is preserved without cluttering active resources.',
  },
];

export const STATUS_TOOLTIPS = {
  draft: 'Draft — Work in progress, visible only to the author',
  vetted: 'Vetted — Under peer-review and quality assurance',
  active: 'Active — Approved and ready for deployment in assessments',
  used: 'Used — Administered in a live exam, awaiting psychometric analysis',
  rejected: 'Rejected — Critically flawed, permanently barred from use',
  archived: 'Archived — Retired from active use, preserved for records',
};

export const StatusGuide = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors rounded-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-xl">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Question Status Guide</h3>
            <p className="text-xs text-gray-500">Understand the lifecycle of every question in the bank</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3">
          {STATUS_DEFINITIONS.map((s) => (
            <div key={s.key} className={`border-l-4 ${s.color} rounded-xl p-4`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} />
                <span className={`text-sm font-bold ${s.textColor}`}>{s.label}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed mb-1">{s.purpose}</p>
              <p className="text-xs text-gray-500 italic leading-relaxed">{s.rules}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
