import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import { Toast, Modal, Btn, Input, Select, Loading, Empty, Badge } from '@/components';

interface Product  { id: number; name: string; sku: string; unit: string; costPrice: number; }
interface Supplier { id: number; name: string; }
interface OrderItem { productId: number; quantity: number; unitPrice: number; productName?: string; productUnit?: string; }
interface Order {
  id: number; supplierId?: number; status: string;
  note: string; totalAmount: number; createdAt: string;
  supplierName?: string; items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending:   { label: '⏳ Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  Confirmed: { label: '✅ Đã xác nhận',  color: 'bg-emerald-100 text-emerald-700' },
  Completed: { label: '✓ Hoàn thành',    color: 'bg-slate-100 text-slate-600' },
  Rejected:  { label: '❌ Từ chối',      color: 'bg-red-100 text-red-700' },
};

export default function OrderList() {
  const api               = useApi();
  const { user }          = useAuthStore();
  const isAdmin           = user?.role === 'Admin';

  const [orders, setOrders]       = useState<Order[]>([]);
  const [products, setProducts]   = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [createOpen, setCreateOpen]     = useState(false);
  const [editOpen, setEditOpen]         = useState(false);
  const [detailOrder, setDetailOrder]   = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Form tạo/sửa
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [note, setNote]             = useState('');
  const [items, setItems]           = useState([{ productId: 0, quantity: 1, unitPrice: 0 }]);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [o, p, s] = await Promise.all([
        api.get('/orders'),
        api.get('/products'),
        api.get('/suppliers'),
      ]);
      setOrders(o.data); setProducts(p.data); setSuppliers(s.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (o: Order) => {
    try {
      const res = await api.get(`/orders/${o.id}`);
      setDetailOrder(res.data);
    } catch { setDetailOrder(o); }
  };

  const openCreate = () => {
    setSupplierId(''); setNote('');
    setItems([{ productId: 0, quantity: 1, unitPrice: 0 }]);
    setCreateOpen(true);
  };

  const openEdit = (o: Order) => {
    setEditingOrder(o);
    setSupplierId(o.supplierId ?? '');
    setNote(o.note);
    setItems(o.items.map(i => ({
      productId: i.productId,
      quantity:  i.quantity,
      unitPrice: i.unitPrice,
    })));
    setDetailOrder(null);
    setEditOpen(true);
  };

  const addItem    = () => setItems(prev => [...prev, { productId: 0, quantity: 1, unitPrice: 0 }]);
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const setItem    = (i: number, k: string, v: number) =>
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it));
  const autoPrice  = (i: number, productId: number) => {
    const p = products.find(p => p.id === productId);
    if (p) setItems(prev => prev.map((it, idx) => idx === i ? { ...it, productId, unitPrice: p.costPrice } : it));
  };

  const total = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  const createOrder = async () => {
    if (items.some(i => !i.productId)) return setToast({ msg: 'Chọn sản phẩm cho tất cả dòng', type: 'err' });
    setSaving(true);
    try {
      await api.post('/orders', { supplierId: supplierId || null, note, items });
      setToast({ msg: 'Tạo đơn hàng thành công!', type: 'ok' });
      setCreateOpen(false);
      load();
    } catch { setToast({ msg: 'Lỗi tạo đơn hàng', type: 'err' }); }
    finally { setSaving(false); }
  };

  const saveEdit = async () => {
    if (!editingOrder) return;
    if (items.some(i => !i.productId)) return setToast({ msg: 'Chọn sản phẩm cho tất cả dòng', type: 'err' });
    setSaving(true);
    try {
      await api.put(`/orders/${editingOrder.id}`, { supplierId: supplierId || null, note, items });
      setToast({ msg: 'Cập nhật đơn hàng thành công!', type: 'ok' });
      setEditOpen(false);
      setEditingOrder(null);
      load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi cập nhật đơn hàng', type: 'err' });
    } finally { setSaving(false); }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      setToast({ msg: `Cập nhật: ${STATUS_MAP[status]?.label}`, type: 'ok' });
      setDetailOrder(null); load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi cập nhật trạng thái', type: 'err' });
    }
  };

  const filtered = orders.filter(o => !statusFilter || o.status === statusFilter);

  // Form items UI (dùng chung cho tạo và sửa)
  const ItemsForm = () => (
    <div className="space-y-2">
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách hàng *</label>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <select value={item.productId} onChange={e => autoPrice(i, +e.target.value)}
            className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
            <option value={0}>-- Chọn sản phẩm --</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
          </select>
          <input type="number" min={1} value={item.quantity || ''}
            onChange={e => setItem(i, 'quantity', +e.target.value)}
            onFocus={e => e.target.select()}
            className="w-20 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="SL" />
          <input type="number" min={0} value={item.unitPrice || ''}
            onChange={e => setItem(i, 'unitPrice', +e.target.value)}
            onFocus={e => e.target.select()}
            className="w-32 border border-slate-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Đơn giá" />
          {items.length > 1 && (
            <button onClick={() => removeItem(i)}
              className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-red-500 transition text-xl">×</button>
          )}
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold">
        + Thêm dòng
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">📋 Đơn đặt hàng</h1>
          <p className="text-sm text-slate-400 mt-0.5">{orders.length} đơn hàng trong hệ thống</p>
        </div>
        {isAdmin && <Btn variant="emerald" onClick={openCreate}>+ Tạo đơn hàng</Btn>}
      </div>

      {/* Status filter */}
      <div className="flex gap-1.5 flex-wrap">
        {[['', 'Tất cả'], ...Object.entries(STATUS_MAP).map(([k, v]) => [k, v.label])].map(([k, l]) => (
          <button key={k} onClick={() => setStatusFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
              ${statusFilter === k ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
            {l} ({k ? orders.filter(o => o.status === k).length : orders.length})
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <Loading /> : filtered.length === 0
          ? <Empty icon="📋" text="Chưa có đơn hàng nào" />
          : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Mã đơn', 'Nhà cung cấp', 'Số mặt hàng', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => {
                  const st = STATUS_MAP[o.status] ?? { label: o.status, color: 'bg-slate-100 text-slate-600' };
                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 group">
                      <td className="px-5 py-4">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#{o.id}</code>
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-slate-700">{o.supplierName ?? '—'}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{o.items.length} mặt hàng</td>
                      <td className="px-5 py-4 text-sm font-black text-slate-800">{o.totalAmount.toLocaleString('vi-VN')}₫</td>
                      <td className="px-5 py-4"><Badge label={st.label} color={st.color} /></td>
                      <td className="px-5 py-4 text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                      <td className="px-5 py-4">
                        <Btn size="sm" variant="ghost"
                          className="opacity-60 group-hover:opacity-100"
                          onClick={() => openDetail(o)}>
                          Chi tiết
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
      </div>

      {/* Create Modal */}
      {createOpen && (
        <Modal title="Tạo đơn đặt hàng" maxWidth="max-w-2xl" onClose={() => setCreateOpen(false)}>
          <Select label="Nhà cung cấp" value={supplierId} onChange={e => setSupplierId(+e.target.value || '')}>
            <option value="">-- Không chọn --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <ItemsForm />
          <Input label="Ghi chú" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú đơn hàng..." />
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-bold">
            💰 Tổng đơn: {total.toLocaleString('vi-VN')}₫
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={() => setCreateOpen(false)}>Hủy</Btn>
            <Btn variant="primary" onClick={createOrder} disabled={saving}>
              {saving ? 'Đang tạo...' : 'Tạo đơn hàng'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editOpen && editingOrder && (
        <Modal
          title={`Sửa đơn hàng #${editingOrder.id}`}
          maxWidth="max-w-2xl"
          onClose={() => { setEditOpen(false); setEditingOrder(null); }}>
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700 font-medium">
            ⚠️ Chỉ có thể sửa đơn đang ở trạng thái <strong>Chờ xác nhận</strong>
          </div>
          <Select label="Nhà cung cấp" value={supplierId} onChange={e => setSupplierId(+e.target.value || '')}>
            <option value="">-- Không chọn --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
          <ItemsForm />
          <Input label="Ghi chú" value={note} onChange={e => setNote(e.target.value)} placeholder="Ghi chú đơn hàng..." />
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-bold">
            💰 Tổng đơn: {total.toLocaleString('vi-VN')}₫
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={() => { setEditOpen(false); setEditingOrder(null); }}>Hủy</Btn>
            <Btn variant="primary" onClick={saveEdit} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* Detail Modal */}
      {detailOrder && (
        <Modal
          title={`Đơn hàng #${detailOrder.id}`}
          subtitle={detailOrder.supplierName}
          maxWidth="max-w-xl"
          onClose={() => setDetailOrder(null)}>

          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              label={STATUS_MAP[detailOrder.status]?.label ?? detailOrder.status}
              color={STATUS_MAP[detailOrder.status]?.color ?? ''}
            />
            {isAdmin && (
              <span className="text-xs px-2 py-1 bg-violet-100 text-violet-700 rounded-full font-bold">
                👑 Bạn có quyền quản lý
              </span>
            )}
          </div>

          {detailOrder.note && (
            <p className="text-sm text-slate-500 italic">{detailOrder.note}</p>
          )}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền'].map(h => (
                  <th key={h} className="text-left p-2 text-xs font-bold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {detailOrder.items.map((it, i) => (
                <tr key={i}>
                  <td className="p-2 text-slate-700">{it.productName ?? `SP #${it.productId}`}</td>
                  <td className="p-2 text-slate-600">{it.quantity}</td>
                  <td className="p-2 text-slate-600">{it.unitPrice.toLocaleString('vi-VN')}₫</td>
                  <td className="p-2 font-bold text-slate-800">{(it.quantity * it.unitPrice).toLocaleString('vi-VN')}₫</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={3} className="p-2 font-bold text-slate-700 text-right">Tổng cộng:</td>
                <td className="p-2 font-black text-indigo-600">{detailOrder.totalAmount.toLocaleString('vi-VN')}₫</td>
              </tr>
            </tfoot>
          </table>

          {/* Action buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {/* Admin sửa đơn — chỉ khi Pending */}
            {isAdmin && detailOrder.status === 'Pending' && (
              <Btn variant="ghost" className="w-full" onClick={() => openEdit(detailOrder)}>
                ✏️ Sửa đơn hàng
              </Btn>
            )}

            {/* Admin hủy đơn */}
            {isAdmin && detailOrder.status === 'Pending' && (
              <Btn variant="danger" className="w-full"
                onClick={() => updateStatus(detailOrder.id, 'Rejected')}>
                ❌ Hủy đơn hàng
              </Btn>
            )}

            {/* Admin hoàn thành đơn đã confirmed */}
            {isAdmin && detailOrder.status === 'Confirmed' && (
              <Btn variant="primary" className="w-full"
                onClick={() => updateStatus(detailOrder.id, 'Completed')}>
                ✓ Đánh dấu hoàn thành
              </Btn>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}