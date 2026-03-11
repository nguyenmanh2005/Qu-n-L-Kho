import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { Toast, Loading, Empty, Badge, Btn } from '@/components';

interface User {
  id: number; username: string; fullName: string;
  role: string; isActive: boolean; lastLoginAt?: string; createdAt: string;
}

export default function UserList() {
  const api = useApi();
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/auth/users/${u.id}/toggle`);
      setToast({ msg: u.isActive ? `Đã khóa ${u.username}` : `Đã mở khóa ${u.username}`, type: 'ok' });
      load();
    } catch {
      setToast({ msg: 'Lỗi cập nhật', type: 'err' });
    }
  };

  return (
    <div className="space-y-5">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-xl font-black text-slate-800">👥 Quản lý người dùng</h1>
        <p className="text-sm text-slate-400 mt-0.5">{users.length} tài khoản trong hệ thống</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <Loading /> : users.length === 0
          ? <Empty icon="👥" text="Chưa có người dùng nào" />
          : (
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Người dùng', 'Vai trò', 'Trạng thái', 'Đăng nhập lần cuối', ''].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black
                          ${u.role === 'Admin'
                            ? 'bg-gradient-to-br from-violet-500 to-purple-600'
                            : 'bg-gradient-to-br from-indigo-400 to-blue-500'}`}>
                          {u.fullName?.[0]?.toUpperCase() ?? u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-700">{u.fullName || u.username}</div>
                          <div className="text-xs text-slate-400">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={u.role === 'Admin' ? '👑 Admin' : '👤 Nhân viên'}
                        color={u.role === 'Admin' ? 'bg-violet-100 text-violet-700' : 'bg-indigo-100 text-indigo-700'}
                      />
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        label={u.isActive ? '✅ Đang hoạt động' : '🔒 Đã khóa'}
                        color={u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                      />
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-400">
                      {u.lastLoginAt
                        ? new Date(u.lastLoginAt).toLocaleString('vi-VN')
                        : 'Chưa đăng nhập'}
                    </td>
                    <td className="px-5 py-4">
                      <Btn size="sm"
                        variant={u.isActive ? 'danger' : 'emerald'}
                        onClick={() => toggleActive(u)}>
                        {u.isActive ? '🔒 Khóa' : '🔓 Mở khóa'}
                      </Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}