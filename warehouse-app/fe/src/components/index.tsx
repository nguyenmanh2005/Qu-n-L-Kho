import { useEffect } from 'react';
import React from 'react';

// ── Toast ──────────────────────────────────────────────────────────────────────
export function Toast({ msg, type, onClose }: {
  msg: string; type: 'ok' | 'err'; onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-white text-sm font-semibold
      ${type === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`}>
      <span>{type === 'ok' ? '✓' : '✕'}</span>
      <span>{msg}</span>
      <button onClick={onClose} className="ml-1 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────────
export function Modal({ title, subtitle, onClose, children, maxWidth = 'max-w-lg' }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; maxWidth?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition text-xl">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Btn ────────────────────────────────────────────────────────────────────────
type Variant = 'primary' | 'danger' | 'ghost' | 'emerald' | 'amber' | 'purple';
const V: Record<Variant, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-200',
  danger:  'bg-red-500 hover:bg-red-600 text-white',
  ghost:   'bg-slate-100 hover:bg-slate-200 text-slate-600',
  emerald: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm shadow-emerald-100',
  amber:   'bg-amber-500 hover:bg-amber-600 text-white',
  purple:  'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200',
};
export function Btn({ variant = 'primary', size = 'md', className = '', ...props }: {
  variant?: Variant; size?: 'sm' | 'md';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const s = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  return <button {...props} className={`${V[variant]} ${s} rounded-lg font-semibold disabled:opacity-40 transition-all ${className}`} />;
}

// ── Field + Input + Select ─────────────────────────────────────────────────────
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

export function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      <input {...props} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition placeholder:text-slate-300" />
    </Field>
  );
}

export function Select({ label, children, ...props }: {
  label: string; children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label}>
      <select {...props} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white">
        {children}
      </select>
    </Field>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────────
export function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>{label}</span>;
}

// ── Empty ──────────────────────────────────────────────────────────────────────
export function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="py-20 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-slate-400 text-sm font-medium">{text}</div>
    </div>
  );
}

// ── Loading ────────────────────────────────────────────────────────────────────
export function Loading() {
  return <div className="py-20 text-center text-slate-300 text-sm animate-pulse">Đang tải...</div>;
}