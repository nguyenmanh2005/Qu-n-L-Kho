import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Loading, Empty } from '@/components';

interface Product {
  id: number; name: string; sku: string;
  category: string; unit: string;
  currentStock: number; minStock: number;
}

export default function StaffStock() {
  const api = useApi();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-800">📦 Tồn kho hiện tại</h2>
        <p className="text-sm text-slate-400 mt-0.5">{products.length} mặt hàng</p>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="🔍 Tìm theo tên hoặc mã SKU..."
        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon="📦" text="Không có sản phẩm" /> : (
        <div className="space-y-2">
          {filtered.map(p => {
            const pct = p.minStock > 0 ? Math.round(p.currentStock / p.minStock * 100) : 100;
            const isLow  = p.currentStock <= p.minStock && p.currentStock > 0;
            const isOut  = p.currentStock === 0;
            const bar    = isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-500';
            const badge  = isOut
              ? 'bg-red-100 text-red-700'
              : isLow
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700';
            const label  = isOut ? '🚨 Hết hàng' : isLow ? '⚠️ Sắp hết' : '✅ Còn hàng';

            return (
              <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-800 text-sm">{p.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{p.sku} · {p.category}</div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${badge}`}>
                    {label}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${bar}`}
                      style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <div className="text-sm font-black text-slate-700 flex-shrink-0">
                    {p.currentStock} <span className="text-slate-400 font-normal text-xs">/ {p.minStock} {p.unit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}