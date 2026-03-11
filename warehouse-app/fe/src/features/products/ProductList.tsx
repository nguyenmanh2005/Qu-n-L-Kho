import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Toast, Modal, Btn, Input, Select, Loading, Empty, Badge } from '@/components';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  supplierId?: number;
  supplierName?: string;
}

interface Supplier { id: number; name: string; }

const EMPTY = {
  name: '', sku: '', category: '', unit: 'cái',
  costPrice: 0, sellingPrice: 0, minStock: 5, supplierId: undefined as number | undefined,
};

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

const stockBadge = (p: Product) => {
  if (p.currentStock === 0)         return { label: 'Hết hàng', color: 'bg-red-100 text-red-700' };
  if (p.currentStock <= p.minStock) return { label: 'Sắp hết',  color: 'bg-amber-100 text-amber-700' };
  return                                   { label: 'Còn hàng', color: 'bg-emerald-100 text-emerald-700' };
};

export default function ProductList() {
  const api = useApi();
  const [products, setProducts]   = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal]         = useState<'none' | 'create' | 'edit'>('none');
  const [editing, setEditing]     = useState<Product | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([api.get('/products'), api.get('/suppliers')]);
      setProducts(p.data);
      setSuppliers(s.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, category: p.category, unit: p.unit,
      costPrice: p.costPrice, sellingPrice: p.sellingPrice,
      minStock: p.minStock, supplierId: p.supplierId,
    });
    setModal('edit');
  };

  const save = async () => {
    if (!form.name || !form.sku) return setToast({ msg: 'Tên và SKU bắt buộc', type: 'err' });
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/products', form);
      else await api.put(`/products/${editing!.id}`, form);
      setToast({ msg: modal === 'create' ? 'Tạo sản phẩm thành công!' : 'Cập nhật thành công!', type: 'ok' });
      setModal('none');
      load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi lưu sản phẩm', type: 'err' });
    } finally { setSaving(false); }
  };

  const del = async (p: Product) => {
    if (!confirm(`Xóa "${p.name}"?`)) return;
    try {
      await api.delete(`/products/${p.id}`);
      setToast({ msg: 'Đã xóa sản phẩm', type: 'ok' });
      load();
    } catch { setToast({ msg: 'Lỗi xóa sản phẩm', type: 'err' }); }
  };

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({
        ...prev,
        [k]: ['costPrice', 'sellingPrice', 'minStock', 'supplierId'].includes(k)
          ? +e.target.value : e.target.value,
      }));

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const filtered   = products.filter(p => {
    const q      = search.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchC = !catFilter || p.category === catFilter;
    return matchQ && matchC;
  });

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">📦 Quản lý hàng hóa</h1>
          <p className="text-sm text-slate-400 mt-0.5">{products.length} sản phẩm trong kho</p>
        </div>
        <Btn variant="emerald" onClick={openCreate}>+ Thêm sản phẩm</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex gap-3 flex-wrap items-center">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Tìm tên, SKU..."
          className="flex-1 min-w-[160px] text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 focus:outline-none bg-white">
          <option value="">Tất cả danh mục</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        {(search || catFilter) && (
          <button onClick={() => { setSearch(''); setCatFilter(''); }}
            className="text-xs text-slate-400 hover:text-slate-600">Xóa bộ lọc</button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <Loading /> : filtered.length === 0 ? <Empty icon="📦" text="Không tìm thấy sản phẩm" /> : (
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Sản phẩm', 'SKU', 'Danh mục', 'Giá nhập', 'Giá bán', 'Tồn kho', 'Trạng thái', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(p => {
                const { label, color } = stockBadge(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 text-sm">{p.name}</div>
                      {p.supplierName && <div className="text-xs text-slate-400">{p.supplierName}</div>}
                    </td>
                    <td className="px-5 py-4"><code className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{p.sku}</code></td>
                    <td className="px-5 py-4 text-sm text-slate-500">{p.category || '—'}</td>
                    <td className="px-5 py-4 text-sm text-slate-600 font-medium">{fmt(p.costPrice)}</td>
                    <td className="px-5 py-4 text-sm text-emerald-600 font-bold">{fmt(p.sellingPrice)}</td>
                    <td className="px-5 py-4 text-sm font-black text-slate-800">
                      {p.currentStock} <span className="text-xs font-normal text-slate-400">{p.unit}</span>
                    </td>
                    <td className="px-5 py-4"><Badge label={label} color={color} /></td>
                    <td className="px-5 py-4">
                      <div className="flex gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                        <Btn size="sm" variant="ghost" onClick={() => openEdit(p)}>Sửa</Btn>
                        <Btn size="sm" variant="danger" onClick={() => del(p)}>Xóa</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal !== 'none' && (
        <Modal
          title={modal === 'create' ? 'Thêm sản phẩm mới' : `Sửa: ${editing?.name}`}
          maxWidth="max-w-2xl"
          onClose={() => setModal('none')}
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tên sản phẩm *" value={form.name} onChange={f('name')} placeholder="VD: Nước suối Lavie" />
            <Input label="SKU / Mã hàng *" value={form.sku} onChange={f('sku')} placeholder="VD: LAVIE-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Danh mục" value={form.category} onChange={f('category')} placeholder="VD: Đồ uống" />
            <Input label="Đơn vị" value={form.unit} onChange={f('unit')} placeholder="cái, kg, hộp..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá nhập (₫)" type="number" value={form.costPrice} onChange={f('costPrice')} />
            <Input label="Giá bán (₫)" type="number" value={form.sellingPrice} onChange={f('sellingPrice')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Mức cảnh báo tồn" type="number" value={form.minStock} onChange={f('minStock')} />
            <Select label="Nhà cung cấp" value={form.supplierId ?? ''} onChange={f('supplierId')}>
              <option value="">-- Không chọn --</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={() => setModal('none')}>Hủy</Btn>
            <Btn variant="emerald" onClick={save} disabled={saving}>
              {saving ? 'Đang lưu...' : modal === 'create' ? 'Tạo sản phẩm' : 'Lưu thay đổi'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}