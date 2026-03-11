import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Loading } from '@/components';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Product {
  id: number; name: string; sku: string; category: string;
  unit: string; currentStock: number; minStock: number;
  costPrice: number; sellingPrice: number;
  supplier?: { name: string };
}

interface StockReport {
  total: number; lowStock: number; outOfStock: number;
  totalValue: number; items: Product[];
}

interface TxReport { totalImport: number; totalExport: number; }

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export default function StockReport() {
  const api = useApi();
  const [stock, setStock]     = useState<StockReport | null>(null);
  const [tx, setTx]           = useState<TxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]     = useState('');

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dateFrom) params.set('from', new Date(dateFrom).toISOString());
    if (dateTo)   params.set('to',   new Date(dateTo).toISOString());
    try {
      const [s, t] = await Promise.all([
        api.get('/reports/stock'),
        api.get(`/reports/transactions?${params}`),
      ]);
      setStock(s.data); setTx(t.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading />;

  const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

  const pieData = [
    { name: 'Còn hàng', value: (stock?.total ?? 0) - (stock?.lowStock ?? 0) },
    { name: 'Sắp hết',  value: (stock?.lowStock ?? 0) - (stock?.outOfStock ?? 0) },
    { name: 'Hết hàng', value: stock?.outOfStock ?? 0 },
  ].filter(d => d.value > 0);

  const top8 = [...(stock?.items ?? [])]
    .sort((a, b) => b.currentStock - a.currentStock)
    .slice(0, 8)
    .map(p => ({ name: p.name.length > 12 ? p.name.slice(0, 12) + '…' : p.name, 'Tồn kho': p.currentStock }));

  const byCat: Record<string, { count: number; value: number }> = {};
  stock?.items.forEach(p => {
    const cat = p.category || 'Khác';
    byCat[cat] = byCat[cat] ?? { count: 0, value: 0 };
    byCat[cat].count++;
    byCat[cat].value += p.currentStock * p.costPrice;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-slate-800">📈 Báo cáo tồn kho</h1>
        <p className="text-sm text-slate-400 mt-0.5">Thống kê & phân tích kho hàng</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-end gap-4 flex-wrap">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Từ ngày</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đến ngày</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button onClick={load} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition">
          🔍 Lọc
        </button>
        {(dateFrom || dateTo) && (
          <button onClick={() => { setDateFrom(''); setDateTo(''); }}
            className="text-xs text-slate-400 hover:text-slate-600">Xóa bộ lọc</button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng mặt hàng', value: stock?.total ?? 0,      icon: '📦', from: 'from-indigo-500', to: 'to-violet-600', bg: 'bg-indigo-50 text-indigo-700' },
          { label: 'Hàng sắp hết',  value: stock?.lowStock ?? 0,   icon: '⚠️', from: 'from-amber-500',  to: 'to-orange-500', bg: 'bg-amber-50 text-amber-700' },
          { label: 'Hết hàng',      value: stock?.outOfStock ?? 0, icon: '🚨', from: 'from-red-500',    to: 'to-rose-600',   bg: 'bg-red-50 text-red-700' },
          { label: 'Giá trị kho',   value: fmt(stock?.totalValue ?? 0), icon: '💰', from: 'from-emerald-500', to: 'to-teal-600', bg: 'bg-emerald-50 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className={`h-1.5 bg-gradient-to-r ${s.from} ${s.to}`} />
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{s.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.bg}`}>{s.label}</span>
              </div>
              <div className="text-2xl font-black text-slate-800">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Tổng đã nhập', value: tx?.totalImport ?? 0, icon: '📥', color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Tổng đã xuất', value: tx?.totalExport ?? 0, icon: '📤', color: 'text-rose-600 bg-rose-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${s.color}`}>{s.icon}</div>
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">{s.label}</div>
              <div className="text-2xl font-black text-slate-800">
                {s.value.toLocaleString()} <span className="text-sm font-normal text-slate-400">đơn vị</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">🥧 Tình trạng tồn kho</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
              </Pie>
              <Tooltip formatter={(v) => `${v} sản phẩm`} />
              <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.8em' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">🏆 Top tồn kho cao nhất</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={top8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: '#f8fafc' }} />
              <Bar dataKey="Tồn kho" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800 text-sm">📂 Phân tích theo danh mục</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              {['Danh mục', 'Số mặt hàng', 'Giá trị tồn kho', '% Giá trị'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {Object.entries(byCat).sort((a, b) => b[1].value - a[1].value).map(([cat, d]) => {
              const pct = stock?.totalValue ? Math.round(d.value / stock.totalValue * 100) : 0;
              return (
                <tr key={cat} className="hover:bg-slate-50/80">
                  <td className="px-5 py-3.5 font-semibold text-slate-700 text-sm">{cat}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{d.count} mặt hàng</td>
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-800">{fmt(d.value)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-500 w-8">{pct}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}