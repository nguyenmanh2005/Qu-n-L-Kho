import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Toast, Btn, Input, Select, Loading, Empty, Badge } from '@/components';

interface Product { id: number; name: string; sku: string; unit: string; currentStock: number; }
interface Transaction {
  id: number; type: 'Import' | 'Export';
  quantity: number; unitPrice: number;
  note: string; createdAt: string; createdBy: string;
  productName: string; productSKU: string; productUnit: string;
}

const FORM = { productId: 0, quantity: 1, unitPrice: 0, note: '', createdBy: '' };

// ── TransactionForm tách ra ngoài để tránh re-render mất focus ─────────────────
function TransactionForm({ type, products, form, setForm, saving, onSubmit }: {
  type: 'import' | 'export';
  products: Product[];
  form: typeof FORM;
  setForm: React.Dispatch<React.SetStateAction<typeof FORM>>;
  saving: boolean;
  onSubmit: (type: 'import' | 'export') => void;
}) {
  const selected = products.find(p => p.id === form.productId);

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({
        ...prev,
        [k]: ['productId', 'quantity', 'unitPrice'].includes(k) ? +e.target.value : e.target.value,
      }));

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-xl">
      <h2 className="font-bold text-slate-800">{type === 'import' ? '📥 Nhập kho' : '📤 Xuất kho'}</h2>

      <Select label="Chọn sản phẩm *" value={form.productId} onChange={f('productId')}>
        <option value={0}>-- Chọn sản phẩm --</option>
        {products.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.sku}) — tồn: {p.currentStock} {p.unit}
          </option>
        ))}
      </Select>

      {selected && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border text-sm
          ${type === 'export' && selected.currentStock === 0
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
          <span className="text-lg">
            {type === 'export' && selected.currentStock === 0 ? '🚨' : '📦'}
          </span>
          <span>
            Tồn kho hiện tại: <strong>{selected.currentStock} {selected.unit}</strong>
            {type === 'export' && selected.currentStock === 0 && ' — Không đủ hàng để xuất!'}
          </span>
        </div>
      )}

<div className="grid grid-cols-2 gap-3">
  <div className="space-y-1">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
      Số lượng {type === 'import' ? 'nhập' : 'xuất'} *
    </label>
    <input
      type="number" min={1}
      value={form.quantity || ''}
      onChange={e => setForm(prev => ({ ...prev, quantity: +e.target.value }))}
      onFocus={e => e.target.select()}
      placeholder="0"
      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
        placeholder:text-slate-300 text-center font-bold text-lg"
    />
  </div>

  <div className="space-y-1">
    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
      Đơn giá (₫)
    </label>
    <input
      type="number" min={0}
      value={form.unitPrice || ''}
      onChange={e => setForm(prev => ({ ...prev, unitPrice: +e.target.value }))}
      onFocus={e => e.target.select()}
      placeholder="0"
      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
        placeholder:text-slate-300 text-center font-bold text-lg"
    />
  </div>
</div>

      <Input
        label="Người thực hiện"
        value={form.createdBy} onChange={f('createdBy')}
        placeholder="Tên nhân viên..."
      />
      <Input
        label="Ghi chú"
        value={form.note} onChange={f('note')}
        placeholder="Lý do, nguồn hàng..."
      />

      {form.quantity > 0 && form.unitPrice > 0 && (
        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-medium">
          💰 Thành tiền: <strong>{(form.quantity * form.unitPrice).toLocaleString('vi-VN')}₫</strong>
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t border-slate-100">
        <Btn variant="ghost" onClick={() => setForm(FORM)} className="flex-1">Xóa form</Btn>
        <Btn
          variant={type === 'import' ? 'emerald' : 'amber'}
          disabled={saving}
          onClick={() => onSubmit(type)}
          className="flex-1"
        >
          {saving ? 'Đang xử lý...' : type === 'import' ? '✓ Xác nhận nhập kho' : '✓ Xác nhận xuất kho'}
        </Btn>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function Inventory() {
  const api = useApi();
  const [products, setProducts]     = useState<Product[]>([]);
  const [history, setHistory]       = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<'import' | 'export' | 'history'>('import');
  const [form, setForm]             = useState(FORM);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/history'),
      ]);
      setProducts(p.data);
      setHistory(h.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (type: 'import' | 'export') => {
    if (!form.productId) return setToast({ msg: 'Chọn sản phẩm', type: 'err' });
    if (form.quantity <= 0) return setToast({ msg: 'Số lượng phải > 0', type: 'err' });
    setSaving(true);
    try {
      const res = await api.post(`/inventory/${type}`, form);
      setToast({ msg: res.data.message, type: 'ok' });
      setForm(FORM);
      load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi thao tác', type: 'err' });
    } finally { setSaving(false); }
  };

  const filteredHistory = history.filter(t => !typeFilter || t.type === typeFilter);

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-xl font-black text-slate-800">🔄 Nhập / Xuất kho</h1>
        <p className="text-sm text-slate-400 mt-0.5">Quản lý giao dịch nhập xuất hàng hóa</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {([['import', '📥 Nhập kho'], ['export', '📤 Xuất kho'], ['history', '📋 Lịch sử']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'import' && (
        <TransactionForm
          type="import"
          products={products}
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={submit}
        />
      )}
      {tab === 'export' && (
        <TransactionForm
          type="export"
          products={products}
          form={form}
          setForm={setForm}
          saving={saving}
          onSubmit={submit}
        />
      )}

      {/* Lịch sử */}
      {tab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex gap-3 items-center">
            <span className="text-sm text-slate-400">Loại:</span>
            {[['', 'Tất cả'], ['Import', '📥 Nhập'], ['Export', '📤 Xuất']].map(([v, l]) => (
              <button key={v} onClick={() => setTypeFilter(v)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition
                  ${typeFilter === v ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {l}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? <Loading /> : filteredHistory.length === 0
              ? <Empty icon="📋" text="Chưa có giao dịch nào" />
              : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Thời gian', 'Sản phẩm', 'Loại', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Người t/h', 'Ghi chú'].map(h => (
                        <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredHistory.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {new Date(t.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-semibold text-slate-800">{t.productName}</div>
                          <div className="text-xs text-slate-400">{t.productSKU}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            label={t.type === 'Import' ? '📥 Nhập' : '📤 Xuất'}
                            color={t.type === 'Import' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}
                          />
                        </td>
                        <td className="px-4 py-3 font-black text-slate-800">
                          {t.quantity} <span className="text-xs font-normal text-slate-400">{t.productUnit}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">{t.unitPrice.toLocaleString('vi-VN')}₫</td>
                        <td className="px-4 py-3 text-sm font-bold text-indigo-600">
                          {(t.quantity * t.unitPrice).toLocaleString('vi-VN')}₫
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">{t.createdBy || '—'}</td>
                        <td className="px-4 py-3 text-sm text-slate-400 italic">{t.note || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      )}
    </div>
  );
}