import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import StaffStock     from './StaffStock';
import StaffInventory from './StaffInventory';
import StaffOrders    from './StaffOrders';

type Tab = 'stock' | 'inventory' | 'orders';

const TABS: { key: Tab; icon: string; label: string }[] = [
  { key: 'stock',     icon: '📦', label: 'Tồn kho' },
  { key: 'inventory', icon: '🔄', label: 'Nhập / Xuất kho' },
  { key: 'orders',    icon: '📋', label: 'Đơn hàng' },
];

export default function StaffApp() {
  const { user, clearAuth }   = useAuthStore();
  const [tab, setTab]         = useState<Tab>('stock');
  const [showLogout, setShowLogout] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* Topbar */}
      <header className="bg-white border-b border-slate-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm">
            🏪
          </div>
          <div>
            <div className="text-sm font-black text-slate-800">Warehouse Manager</div>
            <div className="text-xs text-slate-400">Cổng nhân viên</div>
          </div>
        </div>

        <div className="relative">
          <button onClick={() => setShowLogout(!showLogout)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-xs font-black">
              {user?.fullName?.[0]?.toUpperCase() ?? user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-700">{user?.fullName || user?.username}</div>
              <div className="text-xs text-indigo-500 font-semibold">👤 Nhân viên</div>
            </div>
            <span className="text-slate-300 text-xs">▼</span>
          </button>

          {showLogout && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-44 z-50">
              <div className="px-4 py-2 border-b border-slate-50">
                <div className="text-xs font-bold text-slate-700">{user?.fullName || user?.username}</div>
                <div className="text-xs text-slate-400">{user?.username}</div>
              </div>
              <button onClick={clearAuth}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium">
                🚪 Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-100 px-4">
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold transition border-b-2
                ${tab === t.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full">
        {tab === 'stock'     && <StaffStock />}
        {tab === 'inventory' && <StaffInventory />}
        {tab === 'orders'    && <StaffOrders />}
      </main>

      {showLogout && <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />}
    </div>
  );
}