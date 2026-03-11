import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Loading } from '@/components';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

interface Product {
  id: number; name: string; sku: string;
  currentStock: number; minStock: number;
  category: string; unit: string; costPrice: number;
}

interface StockReport {
  total: number; lowStock: number; outOfStock: number;
  totalValue: number; items: Product[];
}

interface DashboardData {
  year: number; month: number;
  totalImport: number; totalExport: number;
  totalImportValue: number; totalExportValue: number;
  totalCostOfGoods: number;
  grossProfit: number;
  netCashFlow: number;
  totalOrders: number; pendingOrders: number;
  daily: {
    day: number; label: string;
    import: number; export: number;
    importValue: number; exportValue: number;
  }[];
}

const fmt    = (n: number) => n.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
const MONTHS = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
const QUICK  = [
  { label: 'Tháng này',     offset: 0 },
  { label: 'Tháng trước',   offset: -1 },
  { label: '2 tháng trước', offset: -2 },
];

export default function Dashboard() {
  const api = useApi();
  const now = new Date();

  const [stock, setStock]     = useState<StockReport | null>(null);
  const [dash, setDash]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear]       = useState(now.getFullYear());
  const [month, setMonth]     = useState(now.getMonth() + 1);

  const load = async (y: number, m: number) => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        api.get('/reports/stock'),
        api.get(`/reports/dashboard?year=${y}&month=${m}`),
      ]);
      setStock(s.data);
      setDash(d.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(year, month); }, []);

  const applyMonth = (y: number, m: number) => {
    setYear(y); setMonth(m);
    load(y, m);
  };

  const applyQuick = (offset: number) => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    applyMonth(d.getFullYear(), d.getMonth() + 1);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  if (loading) return <Loading />;

  const lowItems   = stock?.items.filter(p => p.currentStock <= p.minStock) ?? [];
  const isProfit   = (dash?.grossProfit  ?? 0) >= 0;
  const isCashPos  = (dash?.netCashFlow  ?? 0) >= 0;

  const stockStats = [
    { label: 'Tổng mặt hàng', value: stock?.total ?? 0,           icon: '📦', from: 'from-indigo-500', to: 'to-violet-600', light: 'bg-indigo-50 text-indigo-700' },
    { label: 'Sắp hết hàng',  value: stock?.lowStock ?? 0,        icon: '⚠️', from: 'from-amber-500',  to: 'to-orange-500', light: 'bg-amber-50 text-amber-700' },
    { label: 'Hết hàng',      value: stock?.outOfStock ?? 0,      icon: '🚨', from: 'from-red-500',    to: 'to-rose-600',   light: 'bg-red-50 text-red-700' },
    { label: 'Giá trị kho',   value: fmt(stock?.totalValue ?? 0), icon: '💰', from: 'from-emerald-500', to: 'to-teal-600',  light: 'bg-emerald-50 text-emerald-700' },
  ];

  const monthStats = [
    { label: 'Nhập kho',   value: dash?.totalImport ?? 0,   sub: fmt(dash?.totalImportValue ?? 0), icon: '📥', color: 'text-rose-600 bg-rose-50',       border: 'border-rose-100' },
    { label: 'Xuất kho',   value: dash?.totalExport ?? 0,   sub: fmt(dash?.totalExportValue ?? 0), icon: '📤', color: 'text-emerald-600 bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Đơn hàng',   value: dash?.totalOrders ?? 0,   sub: `${dash?.pendingOrders ?? 0} chờ duyệt`,    icon: '📋', color: 'text-indigo-600 bg-indigo-50',   border: 'border-indigo-100' },
    { label: 'Chờ duyệt',  value: dash?.pendingOrders ?? 0, sub: 'đơn cần xử lý',                            icon: '⏳', color: 'text-amber-600 bg-amber-50',    border: 'border-amber-100' },
  ];

  return (
    <div className="space-y-6">

      {/* Header + bộ lọc */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">📊 Tổng quan kho hàng</h1>
          <p className="text-sm text-slate-400 mt-1">Dữ liệu tháng {month}/{year}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {QUICK.map(q => {
            const d  = new Date(now.getFullYear(), now.getMonth() + q.offset, 1);
            const y2 = d.getFullYear();
            const m2 = d.getMonth() + 1;
            return (
              <button key={q.label} onClick={() => applyQuick(q.offset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
                  ${y2 === year && m2 === month
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                {q.label}
              </button>
            );
          })}
          <select value={month} onChange={e => applyMonth(year, +e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={e => applyMonth(+e.target.value, month)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Stat cards tồn kho */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stockStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${s.from} ${s.to}`} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.light}`}>{s.label}</span>
              </div>
              <div className="text-2xl font-black text-slate-800 leading-none">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Stat cards theo tháng */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {monthStats.map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-5`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${s.color}`}>{s.icon}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{s.label} T{month}/{year}</div>
            </div>
            <div className="text-3xl font-black text-slate-800 leading-none">{s.value.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Tài chính tháng */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <span className="text-xl">💹</span>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Tài chính tháng {month}/{year}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Doanh thu, chi phí và lợi nhuận</p>
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">📥</div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chi phí nhập</span>
            </div>
            <div className="text-xl font-black text-rose-600">{fmt(dash?.totalImportValue ?? 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Tổng tiền bỏ ra nhập hàng</div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">📤</div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Doanh thu xuất</span>
            </div>
            <div className="text-xl font-black text-emerald-600">{fmt(dash?.totalExportValue ?? 0)}</div>
            <div className="text-xs text-slate-400 mt-1">Tổng tiền thu về từ xuất hàng</div>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isProfit ? 'bg-indigo-50' : 'bg-red-50'}`}>
                {isProfit ? '📈' : '📉'}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lợi nhuận gộp</span>
            </div>
            <div className={`text-xl font-black ${isProfit ? 'text-indigo-600' : 'text-red-600'}`}>
              {isProfit ? '+' : ''}{fmt(dash?.grossProfit ?? 0)}
            </div>
            <div className="text-xs text-slate-400 mt-1">Doanh thu − Giá vốn hàng xuất</div>
          </div>
        </div>

        {/* Dòng tiền thuần */}
        <div className={`mx-5 mb-5 p-4 rounded-xl border flex items-center justify-between
          ${isCashPos ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              💰 Dòng tiền thuần tháng {month}/{year}
            </div>
            <div className="text-xs text-slate-400">Doanh thu xuất − Chi phí nhập</div>
          </div>
          <div className={`text-2xl font-black ${isCashPos ? 'text-emerald-600' : 'text-red-600'}`}>
            {isCashPos ? '+' : ''}{fmt(dash?.netCashFlow ?? 0)}
          </div>
        </div>
      </div>

      {/* Biểu đồ nhập xuất theo ngày */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-slate-800">📈 Biểu đồ nhập / xuất kho</h3>
            <p className="text-xs text-slate-400 mt-0.5">Theo từng ngày trong tháng {month}/{year}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />Nhập kho
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />Xuất kho
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={dash?.daily ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorImport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExport" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false} tickLine={false}
              interval={Math.floor((dash?.daily.length ?? 30) / 10)} />
            <YAxis
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              formatter={(v: number, name: string) => [
                v.toLocaleString(),
                name === 'import' ? '📥 Nhập' : '📤 Xuất',
              ]}
              labelFormatter={l => `Ngày ${l}`}
            />
            <Area type="monotone" dataKey="import" stroke="#10b981" strokeWidth={2}
              fill="url(#colorImport)" dot={false} activeDot={{ r: 4 }} />
            <Area type="monotone" dataKey="export" stroke="#f43f5e" strokeWidth={2}
              fill="url(#colorExport)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cảnh báo hàng sắp hết */}
      {lowItems.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-amber-100 bg-amber-50">
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-bold text-amber-800 text-sm">Cảnh báo tồn kho thấp</h3>
              <p className="text-xs text-amber-600">{lowItems.length} mặt hàng cần nhập thêm</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {lowItems.map(p => {
              const pct = p.minStock > 0 ? Math.round(p.currentStock / p.minStock * 100) : 0;
              const bar = pct <= 0 ? 'bg-red-500' : pct <= 50 ? 'bg-amber-400' : 'bg-yellow-300';
              return (
                <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400">{p.sku} · {p.category}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-black ${p.currentStock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.currentStock} / {p.minStock} {p.unit}
                    </div>
                    <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 ml-auto">
                      <div className={`h-1.5 rounded-full ${bar}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                  {p.currentStock === 0 && (
                    <span className="text-xs font-bold px-2 py-1 bg-red-100 text-red-700 rounded-full flex-shrink-0">
                      Hết hàng
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}