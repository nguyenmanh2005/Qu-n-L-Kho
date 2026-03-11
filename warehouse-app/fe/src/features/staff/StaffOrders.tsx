import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Toast, Modal, Btn, Loading, Empty, Badge } from '@/components';

interface OrderItem { productId: number; quantity: number; unitPrice: number; productName?: string; }
interface Order {
  id: number; status: string; note: string;
  totalAmount: number; createdAt: string;
  supplierName?: string; items: OrderItem[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  Pending:   { label: '⏳ Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  Confirmed: { label: '✅ Đã xác nhận',  color: 'bg-emerald-100 text-emerald-700' },
  Completed: { label: '✓ Hoàn thành',    color: 'bg-slate-100 text-slate-600' },
  Rejected:  { label: '❌ Đã hủy',       color: 'bg-red-100 text-red-700' },
};

export default function StaffOrders() {
  const api = useApi();
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [detail, setDetail]         = useState<Order | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [toast, setToast]           = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders');
      setOrders(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openDetail = async (o: Order) => {
    try {
      const res = await api.get(`/orders/${o.id}`);
      setDetail(res.data);
    } catch { setDetail(o); }
  };

  const confirm = async () => {
    if (!detail) return;
    setConfirming(true);
    try {
      await api.put(`/orders/${detail.id}/confirm`);
      setToast({ msg: '✅ Đã xác nhận nhận hàng!', type: 'ok' });
      setDetail(null);
      load();
    } catch (e: any) {
      setToast({ msg: e.response?.data?.message || 'Lỗi xác nhận', type: 'err' });
    } finally { setConfirming(false); }
  };

  const pending   = orders.filter(o => o.status === 'Pending');
  const confirmed = orders.filter(o => o.status !== 'Pending');

  return (
    <div className="space-y-4">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h2 className="text-lg font-black text-slate-800">📋 Đơn hàng</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          {pending.length > 0
            ? <span className="text-amber-600 font-semibold">{pending.length} đơn đang chờ bạn xác nhận</span>
            : 'Không có đơn nào đang chờ'}
        </p>
      </div>

      {loading ? <Loading /> : orders.length === 0 ? <Empty icon="📋" text="Chưa có đơn hàng nào" /> : (
        <>
          {/* Chờ xác nhận */}
          {pending.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider px-1">
                ⏳ Chờ xác nhận ({pending.length})
              </div>
              {pending.map(o => (
                <div key={o.id}
                  className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition"
                  onClick={() => openDetail(o)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200">#{o.id}</code>
                      {o.supplierName && <span className="text-xs text-slate-500">{o.supplierName}</span>}
                    </div>
                    <div className="text-sm font-bold text-slate-700 mt-1">
                      {o.items.length} mặt hàng · {o.totalAmount.toLocaleString('vi-VN')}₫
                    </div>
                    <div className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-xs font-bold text-amber-700 bg-white border border-amber-200 px-3 py-1.5 rounded-lg">
                      Xem & Xác nhận →
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Đã xử lý */}
          {confirmed.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                Đã xử lý ({confirmed.length})
              </div>
              {confirmed.map(o => {
                const st = STATUS_MAP[o.status] ?? { label: o.status, color: 'bg-slate-100 text-slate-600' };
                return (
                  <div key={o.id}
                    className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition"
                    onClick={() => openDetail(o)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#{o.id}</code>
                        <Badge label={st.label} color={st.color} />
                      </div>
                      <div className="text-sm text-slate-600 mt-1">
                        {o.items.length} mặt hàng · {o.totalAmount.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {detail && (
        <Modal
          title={`Đơn hàng #${detail.id}`}
          subtitle={detail.supplierName}
          maxWidth="max-w-lg"
          onClose={() => setDetail(null)}
        >
          <Badge
            label={STATUS_MAP[detail.status]?.label ?? detail.status}
            color={STATUS_MAP[detail.status]?.color ?? ''}
          />

          {detail.note && <p className="text-sm text-slate-500 italic">{detail.note}</p>}

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {['Sản phẩm', 'SL', 'Đơn giá', 'Thành tiền'].map(h => (
                  <th key={h} className="text-left p-2 text-xs font-bold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {detail.items.map((it, i) => (
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
                <td className="p-2 font-black text-indigo-600">{detail.totalAmount.toLocaleString('vi-VN')}₫</td>
              </tr>
            </tfoot>
          </table>

          {detail.status === 'Pending' && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <p className="text-sm text-slate-500 text-center">
                Kiểm tra hàng hóa và bấm xác nhận khi đã nhận đủ
              </p>
              <Btn variant="emerald" className="w-full" onClick={confirm} disabled={confirming}>
                {confirming ? 'Đang xác nhận...' : '✅ Xác nhận đã nhận hàng'}
              </Btn>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}