import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Toast, Modal, Btn, Input, Loading, Empty } from '@/components';

interface Supplier {
  id: number; name: string; phone: string;
  email: string; address: string;
  isActive: boolean; createdAt: string;
}

const EMPTY = { name: '', phone: '', email: '', address: '' };

export default function SupplierList() {
  const api = useApi();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [modal, setModal]         = useState<'none' | 'create' | 'edit'>('none');
  const [editing, setEditing]     = useState<Supplier | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const load = async () => {
    setLoading(true);
    try { const res = await api.get('/suppliers'); setSuppliers(res.data); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  const openEdit   = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address });
    setModal('edit');
  };

  const save = async () => {
    if (!form.name) return setToast({ msg: 'Tên NCC bắt buộc', type: 'err' });
    setSaving(true);
    try {
      if (modal === 'create') await api.post('/suppliers', form);
      else await api.put(`/suppliers/${editing!.id}`, form);
      setToast({ msg: modal === 'create' ? 'Thêm NCC thành công!' : 'Cập nhật thành công!', type: 'ok' });
      setModal('none');
      load();
    } catch { setToast({ msg: 'Lỗi lưu nhà cung cấp', type: 'err' }); }
    finally { setSaving(false); }
  };

  const del = async (s: Supplier) => {
    if (!confirm(`Xóa "${s.name}"?`)) return;
    try {
      await api.delete(`/suppliers/${s.id}`);
      setToast({ msg: 'Đã xóa nhà cung cấp', type: 'ok' });
      load();
    } catch { setToast({ msg: 'Lỗi xóa', type: 'err' }); }
  };

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }));

  const filtered = suppliers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-800">🏭 Nhà cung cấp</h1>
          <p className="text-sm text-slate-400 mt-0.5">{suppliers.length} nhà cung cấp đang hoạt động</p>
        </div>
        <Btn variant="emerald" onClick={openCreate}>+ Thêm NCC</Btn>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <span className="text-slate-300">🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo tên, số điện thoại, email..."
          className="flex-1 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none" />
      </div>

      {loading ? <Loading /> : filtered.length === 0 ? <Empty icon="🏭" text="Chưa có nhà cung cấp nào" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-black text-base">
                  {s.name[0].toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Btn size="sm" variant="ghost" onClick={() => openEdit(s)}>Sửa</Btn>
                  <Btn size="sm" variant="danger" onClick={() => del(s)}>Xóa</Btn>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{s.name}</h3>
              <div className="space-y-1.5 text-sm text-slate-500">
                {s.phone   && <div className="flex items-center gap-2"><span>📞</span><span>{s.phone}</span></div>}
                {s.email   && <div className="flex items-center gap-2"><span>✉️</span><span>{s.email}</span></div>}
                {s.address && <div className="flex items-center gap-2"><span>📍</span><span className="line-clamp-1">{s.address}</span></div>}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-300">
                Thêm lúc: {new Date(s.createdAt).toLocaleDateString('vi-VN')}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal !== 'none' && (
        <Modal title={modal === 'create' ? 'Thêm nhà cung cấp' : `Sửa: ${editing?.name}`} onClose={() => setModal('none')}>
          <Input label="Tên NCC *" value={form.name} onChange={f('name')} placeholder="Công ty TNHH..." />
          <Input label="Số điện thoại" value={form.phone} onChange={f('phone')} placeholder="0901234567" />
          <Input label="Email" type="email" value={form.email} onChange={f('email')} placeholder="supplier@example.com" />
          <Input label="Địa chỉ" value={form.address} onChange={f('address')} placeholder="123 Đường ABC, TP.HCM" />
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Btn variant="ghost" onClick={() => setModal('none')}>Hủy</Btn>
            <Btn variant="primary" onClick={save} disabled={saving}>
              {saving ? 'Đang lưu...' : modal === 'create' ? 'Thêm NCC' : 'Lưu thay đổi'}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}