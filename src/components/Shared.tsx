import React from "react";
import { CheckCircle, Clock } from "lucide-react";
import { cx, FD } from "../utils/format";

interface BdgProps {
  children: React.ReactNode;
  v?: 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple';
  xs?: boolean;
}

export const Bdg: React.FC<BdgProps> = ({ children, v = 'gray', xs }) => {
  const m = { 
    gray: 'bg-gray-100 text-gray-600 border border-gray-250/50', 
    blue: 'bg-blue-50 text-blue-700 border border-blue-200/50', 
    green: 'bg-green-50 text-green-700 border border-green-200/50', 
    yellow: 'bg-yellow-50 text-yellow-750 border border-yellow-250/50', 
    red: 'bg-red-50 text-red-700 border border-red-200/50', 
    orange: 'bg-orange-50 text-orange-700 border border-orange-200/50', 
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/50' 
  };
  return (
    <span className={cx('rounded-full font-bold inline-flex items-center gap-0.5 whitespace-nowrap', m[v] || m.gray, xs ? 'text-[10px] px-2 py-0.2' : 'text-xs px-3 py-0.5')}>
      {children}
    </span>
  );
};

interface BtnProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  v?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost' | 'warning';
  sm?: boolean;
  icon?: React.ComponentType<any>;
  disabled?: boolean;
  full?: boolean;
  cls?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Btn: React.FC<BtnProps> = ({ children, onClick, v = 'primary', sm, icon: Icon, disabled, full, cls, type = 'button' }) => {
  const m = { 
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm active:bg-blue-850', 
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 shadow-3xs active:bg-gray-100', 
    success: 'bg-green-600 hover:bg-green-700 text-white border-green-650 shadow-sm active:bg-green-800', 
    danger: 'bg-red-500 hover:bg-red-600 text-white border-red-500 shadow-sm active:bg-red-700', 
    ghost: 'bg-transparent hover:bg-gray-100 text-gray-600 border-transparent active:bg-gray-200', 
    warning: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-sm active:bg-orange-650' 
  };
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled} 
      className={cx('inline-flex items-center justify-center gap-1.5 rounded-lg border font-bold transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/15', sm ? 'text-[10.5px] px-2.5 py-1' : 'text-xs px-4 py-2', m[v] || m.primary, full && 'w-full', disabled && 'opacity-40 cursor-not-allowed pointer-events-none', cls)}
    >
      {Icon && <Icon size={sm ? 12 : 14} className="shrink-0 stroke-[2.3]" />}
      <span>{children}</span>
    </button>
  );
};

interface TblCol {
  l: string;
  k?: string;
  r?: boolean;
  fn?: (item: any, index: number) => React.ReactNode;
}

interface TblProps {
  cols: TblCol[];
  rows: any[];
  onRow?: (item: any) => void;
  compact?: boolean;
}

export const Tbl: React.FC<TblProps> = ({ cols, rows, onRow, compact }) => (
  <div className="overflow-x-auto rounded-xl">
    <table className="w-full text-left border-collapse text-xs">
      <thead>
        <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
          {cols.map((c, i) => (
            <th key={i} className={cx('px-4 text-xs select-none font-bold text-slate-500 whitespace-nowrap', compact ? 'py-2.5' : 'py-3.5', c.r ? 'text-right' : 'text-left')}>
              {c.l}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100 font-semibold text-slate-700 bg-white">
        {!rows || rows.length === 0 ? (
          <tr>
            <td colSpan={cols.length} className="px-5 py-12 text-center text-slate-400 font-medium">
              Tidak ada data yang tersedia
            </td>
          </tr>
        ) : (
          rows.map((r, i) => (
            <tr 
              key={i} 
              className={cx('transition-colors duration-100 border-none', onRow ? 'cursor-pointer hover:bg-slate-50/75' : '')} 
              onClick={() => onRow?.(r)}
            >
              {cols.map((c, j) => (
                <td key={j} className={cx('px-4 text-xs text-slate-650', compact ? 'py-2' : 'py-3', c.r && 'text-right')}>
                  {c.fn ? c.fn(r, i) : r[c.k || '']}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

interface StatProps {
  label: string;
  val: string | number;
  sub?: string;
  I?: React.ComponentType<any>;
  col?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

export const Stat: React.FC<StatProps> = ({ label, val, sub, I: Icon, col = 'blue' }) => {
  const m = { 
    blue: 'bg-blue-50/50 border border-blue-100/70 text-blue-600', 
    green: 'bg-green-50/50 border border-green-100/70 text-green-650', 
    orange: 'bg-orange-50/50 border border-orange-100/70 text-orange-650', 
    red: 'bg-red-50/50 border border-red-100/70 text-red-650', 
    purple: 'bg-purple-50/50 border border-purple-100/70 text-purple-650' 
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors duration-150 min-h-[100px]">
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest leading-none">{label}</p>
          <p className="text-lg md:text-xl font-black text-slate-900 mt-2 tracking-tight leading-none truncate">{val}</p>
        </div>
        {Icon && (
          <div className={cx('rounded-xl p-2 shrink-0 shadow-3xs', m[col] || m.blue)}>
            <Icon size={16} className="stroke-[2.2]" />
          </div>
        )}
      </div>
      {sub && <p className="text-[10px] text-slate-450 font-bold mt-2.5 border-t border-slate-50 pt-1.5 truncate leading-none">{sub}</p>}
    </div>
  );
};

interface CardProps {
  children: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
  cls?: string;
}

export const Card: React.FC<CardProps> = ({ children, title, action, cls }) => (
  <div className={cx('bg-white rounded-2xl border border-slate-200/85 overflow-hidden shadow-3xs', cls)}>
    {(title || action) && (
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 select-none bg-slate-50/10">
        <span className="font-extrabold text-slate-800 text-sm tracking-tight">{title}</span>
        {action}
      </div>
    )}
    <div className="w-full">{children}</div>
  </div>
);

interface MStepProps {
  label: string;
  done: boolean;
  tgl?: string;
  na?: boolean;
}

export const MStep: React.FC<MStepProps> = ({ label, done, tgl, na }) => (
  <div className="flex items-start gap-3.5 py-2 px-3 rounded-xl hover:bg-slate-50/50 transition duration-150">
    <div className="mt-0.5 shrink-0">
      {na ? (
        <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 bg-white" />
      ) : done ? (
        <CheckCircle size={18} className="text-green-500 stroke-[2.5]" />
      ) : (
        <Clock size={18} className="text-slate-300 stroke-[2.3]" />
      )}
    </div>
    <div className="min-w-0">
      <span className={cx('text-xs font-bold leading-tight block', done ? 'text-slate-800' : na ? 'text-slate-300 line-through' : 'text-slate-500')}>
        {label}
      </span>
      {tgl && <span className="text-[9.5px] text-slate-400 font-extrabold block mt-0.5">{FD(tgl)}</span>}
      {na && <span className="text-[9.5px] text-slate-300 font-extrabold italic block mt-0.5">N/A</span>}
    </div>
  </div>
);
