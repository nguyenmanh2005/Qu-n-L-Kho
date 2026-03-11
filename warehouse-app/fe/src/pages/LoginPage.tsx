import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export default function LoginPage({ onLogin }: { onLogin: () => void }) {
  const { setAuth } = useAuthStore();
  const [tab, setTab]         = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole]         = useState('Staff');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const submit = async () => {
    if (!username || !password) return setError('Vui lòng nhập đầy đủ thông tin');
    setLoading(true); setError('');
    try {
      const url  = tab === 'login' ? '/auth/login' : '/auth/register';
      const body = tab === 'login'
        ? { username, password }
        : { username, password, fullName, role };

      const res = await axios.post(`${BASE}${url}`, body);
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      onLogin();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Đăng nhập thất bại');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-indigo-200">
            🏪
          </div>
          <h1 className="text-2xl font-black text-slate-800">Warehouse Manager</h1>
          <p className="text-sm text-slate-400 mt-1">Hệ thống quản lý kho hàng</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-bold transition
                  ${tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                {t === 'login' ? '🔐 Đăng nhập' : '📝 Đăng ký'}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}

            {tab === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Họ tên</label>
                <input value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tên đăng nhập</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" />
            </div>

            {tab === 'register' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Vai trò</label>
                <select value={role} onChange={e => setRole(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition bg-white">
                  <option value="Staff">👤 Nhân viên</option>
                  <option value="Admin">👑 Quản trị viên</option>
                </select>
              </div>
            )}

            <button onClick={submit} disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition shadow-sm shadow-indigo-200 mt-2">
              {loading ? 'Đang xử lý...' : tab === 'login' ? '🔐 Đăng nhập' : '📝 Tạo tài khoản'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Warehouse Manager © 2026
        </p>
      </div>
    </div>
  );
}