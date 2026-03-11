import { useEffect, useRef, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { Toast, Loading, Empty } from '@/components';

interface Product {
  id: number; name: string; sku: string; unit: string;
  costPrice: number; sellingPrice: number;
  currentStock: number; minStock: number;
}
interface Transaction {
  id: number; type: string; quantity: number; unitPrice: number;
  note: string; createdBy: string; createdAt: string;
  productId?: number; productName?: string; unit?: string;
  product?: { name: string; sku: string; unit: string };
}

type TxType = 'Import' | 'Export';
const initForm = () => ({ productId: 0, quantity: 1, unitPrice: 0, note: '' });

export default function StaffInventory() {
  const api      = useApi();
  const { user } = useAuthStore();
  const qtyRef   = useRef<HTMLInputElement>(null);

  const [products, setProducts]     = useState<Product[]>([]);
  const [history, setHistory]       = useState<Transaction[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeType, setActiveType] = useState<TxType>('Import');
  const [form, setForm]             = useState(initForm());
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [search, setSearch]         = useState('');
  const [showDrop, setShowDrop]     = useState(false);
  const searchRef                   = useRef<HTMLDivElement>(null);

  const selectedProduct = products.find(p => p.id === form.productId);

  const filteredProducts = products.filter(p =>
    search === '' ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const load = async () => {
    setLoading(true);
    try {
      const [p, h] = await Promise.all([
        api.get('/products'),
        api.get('/inventory/history'),
      ]);
      setProducts(p.data);
      const raw = h.data;
      setHistory(Array.isArray(raw) ? raw : (raw.items ?? []));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDrop(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectProduct = (p: Product) => {
    const price = activeType === 'Import' ? p.costPrice : p.sellingPrice;
    setForm(f => ({ ...f, productId: p.id, unitPrice: price }));
    setSearch(p.name);
    setShowDrop(false);
    setTimeout(() => { qtyRef.current?.focus(); qtyRef.current?.select(); }, 50);
  };

  const handleTypeChange = (t: TxType) => {
    setActiveType(t);
    if (selectedProduct) {
      const price = t === 'Import' ? selectedProduct.costPrice : selectedProduct.sellingPrice;
      setForm(f => ({ ...f, unitPrice: price }));
    }
  };

  const resetForm = () => { setForm(initForm()); setSearch(''); };

  const submit = async () => {
    if (!form.productId) return setToast({ msg: 'Chọn sản phẩm', type: 'err' });
    if (form.quantity <= 0) return setToast({ msg: 'Số lượng phải lớn hơn 0', type: 'err' });
    setSaving(true);
    try {
      const endpoint = activeType === 'Import' ? '/inventory/import' : '/inventory/export';
      await api.post(endpoint, { ...form, createdBy: user?.fullName || user?.username });
      setToast({ msg: `${activeType === 'Import' ? 'Nhập' : 'Xuất'} kho thành công!`, type: 'ok' });
      resetForm();
      load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi thao tác kho', type: 'err' });
    } finally { setSaving(false); }
  };

  const getName = (tx: Transaction) =>
    tx.product?.name ?? tx.productName ?? `SP #${tx.productId}`;
  const getUnit = (tx: Transaction) =>
    tx.product?.unit ?? tx.unit ?? '';

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-lg font-black text-slate-800">🔄 Nhập / Xuất kho</h2>
        <p className="text-sm text-slate-400 mt-0.5">Ghi nhận hàng hóa ra vào kho</p>
      </div>

      {/* Toggle */}
      <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
        {(['Import', 'Export'] as TxType[]).map(t => (
          <button key={t} onClick={() => handleTypeChange(t)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition
              ${activeType === t
                ? t === 'Import'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}>
            {t === 'Import' ? '📥 Nhập kho' : '📤 Xuất kho'}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">

        {/* Search sản phẩm */}
        <div className="space-y-1" ref={searchRef}>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm *</label>
          <div className="relative">
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setShowDrop(true);
                setForm(f => ({ ...f, productId: 0, unitPrice: 0 }));
              }}
              onFocus={() => setShowDrop(true)}
              placeholder="🔍 Tìm tên hoặc mã SKU..."
              className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition
                ${form.productId
                  ? 'border-emerald-300 bg-emerald-50 focus:ring-emerald-400'
                  : 'border-slate-200 focus:ring-indigo-400'}`}
            />
            {form.productId > 0 && (
              <button onClick={resetForm}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-400 transition text-xl leading-none">
                ×
              </button>
            )}

            {/* Dropdown */}
            {showDrop && filteredProducts.length > 0 && (
              <div className="absolute z-50 w-full top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.map(p => {
                  const isLow = p.currentStock <= p.minStock && p.currentStock > 0;
                  const isOut = p.currentStock === 0;
                  return (
                    <button key={p.id} onClick={() => selectProduct(p)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition flex items-center justify-between gap-3 border-b border-slate-50 last:border-0">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-700 truncate">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.sku} · {p.unit}</div>
                      </div>
                      <div className="text-right flex-shrink-0 space-y-1">
                        <div className={`text-xs font-bold px-2 py-0.5 rounded-full
                          ${isOut ? 'bg-red-100 text-red-600'
                            : isLow ? 'bg-amber-100 text-amber-600'
                            : 'bg-emerald-100 text-emerald-600'}`}>
                          {isOut ? '🚨 Hết' : `${p.currentStock} ${p.unit}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          {(activeType === 'Import' ? p.costPrice : p.sellingPrice).toLocaleString('vi-VN')}₫
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thông tin sản phẩm đã chọn */}
          {selectedProduct && (
            <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 rounded-xl text-xs border
              ${activeType === 'Import'
                ? 'bg-emerald-50 border-emerald-100'
                : 'bg-rose-50 border-rose-100'}`}>
              <div className="font-bold text-slate-700 truncate">{selectedProduct.name}</div>
              <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                <span className="text-slate-500">
                  Tồn kho:{' '}
                  <span className={`font-black ${
                    selectedProduct.currentStock === 0 ? 'text-red-600'
                    : selectedProduct.currentStock <= selectedProduct.minStock ? 'text-amber-600'
                    : 'text-slate-800'}`}>
                    {selectedProduct.currentStock} {selectedProduct.unit}
                  </span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  Giá:{' '}
                  <span className="font-black text-indigo-600">
                    {(activeType === 'Import'
                      ? selectedProduct.costPrice
                      : selectedProduct.sellingPrice
                    ).toLocaleString('vi-VN')}₫
                  </span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Số lượng + Đơn giá */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Số lượng *</label>
            <input ref={qtyRef} type="number" min={1}
              value={form.quantity || ''}
              onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))}
              onFocus={e => e.target.select()}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đơn giá</label>
            <input type="number" min={0}
              value={form.unitPrice || ''}
              onChange={e => setForm(f => ({ ...f, unitPrice: +e.target.value }))}
              onFocus={e => e.target.select()}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
        </div>

        {/* Tổng tiền preview */}
        {form.productId > 0 && form.quantity > 0 && form.unitPrice > 0 && (
          <div className={`px-3 py-2 rounded-xl text-sm font-bold flex justify-between
            ${activeType === 'Import' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            <span>💰 Thành tiền:</span>
            <span>{(form.quantity * form.unitPrice).toLocaleString('vi-VN')}₫</span>
          </div>
        )}

        {/* Ghi chú */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ghi chú</label>
          <input value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            placeholder="Ghi chú thêm..."
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>

        <button onClick={submit} disabled={saving}
          className={`w-full py-3 rounded-xl font-bold text-white transition disabled:opacity-50
            ${activeType === 'Import'
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-rose-500 hover:bg-rose-600'}`}>
          {saving
            ? 'Đang lưu...'
            : activeType === 'Import' ? '📥 Xác nhận nhập kho' : '📤 Xác nhận xuất kho'}
        </button>
      </div>

      {/* Lịch sử */}
      <div>
        <h3 className="text-sm font-bold text-slate-600 mb-2">📜 Lịch sử gần đây</h3>
        {loading
          ? <Loading />
          : history.length === 0
          ? <Empty icon="📋" text="Chưa có giao dịch nào" />
          : (
            <div className="space-y-2">
              {history.slice(0, 20).map(tx => (
                <div key={tx.id}
                  className="bg-white rounded-xl border border-slate-100 px-4 py-3 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0
                    ${tx.type === 'Import' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                    {tx.type === 'Import' ? '📥' : '📤'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-700 truncate">{getName(tx)}</div>
                    <div className="text-xs text-slate-400">
                      {tx.createdBy} · {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className={`text-sm font-black ${tx.type === 'Import' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Import' ? '+' : '-'}{tx.quantity} {getUnit(tx)}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(tx.quantity * tx.unitPrice).toLocaleString('vi-VN')}₫
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}