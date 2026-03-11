import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import LoginPage    from '@/pages/LoginPage';
import StaffApp     from '@/features/staff/StaffApp';
import Dashboard    from '@/features/dashboard/Dashboard';
import ProductList  from '@/features/products/ProductList';
import Inventory    from '@/features/inventory/Inventory';
import SupplierList from '@/features/suppliers/SupplierList';
import OrderList    from '@/features/orders/OrderList';
import StockReport  from '@/features/reports/StockReport';

import UserList from '@/features/user/UserList';
type Page = 'dashboard' | 'products' | 'inventory' | 'suppliers' | 'orders' | 'reports' | 'users';

const NAV: { key: Page; icon: string; label: string; section?: string }[] = [
  { key: 'dashboard',  icon: '📊', label: 'Tổng quan',       section: 'Tổng quan' },
  { key: 'products',   icon: '📦', label: 'Hàng hóa',        section: 'Quản lý' },
  { key: 'inventory',  icon: '🔄', label: 'Nhập / Xuất kho' },
  { key: 'suppliers',  icon: '🏭', label: 'Nhà cung cấp' },
  { key: 'orders',     icon: '📋', label: 'Đơn hàng' },
  { key: 'reports',    icon: '📈', label: 'Báo cáo',         section: 'Phân tích' },
  { key: 'users',      icon: '👥', label: 'Người dùng',      section: 'Hệ thống' },
];

const PAGES: Record<Page, React.ReactNode> = {
  dashboard: <Dashboard />,
  products:  <ProductList />,
  inventory: <Inventory />,
  suppliers: <SupplierList />,
  orders:    <OrderList />,
  reports:   <StockReport />,
  users:     <UserList />,
};

export default function App() {
  const { user, clearAuth, accessToken } = useAuthStore();
  const [page, setPage]               = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogout, setShowLogout]   = useState(false);

  if (!user || !accessToken) {
    return <LoginPage onLogin={() => setPage('dashboard')} />;
  }

  if (user.role === 'Staff') {
    return <StaffApp />;
  }

  const current = NAV.find(n => n.key === page)!;

  return (
    <div className="min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} flex-shrink-0 bg-white border-r border-slate-100 shadow-sm flex flex-col transition-all duration-200`}>

        {/* Logo */}
        <div className="px-4 py-5 flex items-center gap-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm flex-shrink-0">
            🏪
          </div>
          {sidebarOpen && (
            <div className="min-w-0">
              <div className="text-sm font-black text-slate-800 leading-tight">Kho hàng</div>
              <div className="text-xs text-slate-400">Warehouse Manager</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map((item, i) => (
            <div key={item.key}>
              {sidebarOpen && item.section && (
                <div className={`text-xs font-bold text-slate-400 uppercase tracking-widest px-2 pb-1 ${i > 0 ? 'pt-4' : 'pt-1'}`}>
                  {item.section}
                </div>
              )}
              <button onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-semibold transition-all
                  ${page === item.key
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                title={!sidebarOpen ? item.label : undefined}>
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && page === item.key && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0" />
                )}
              </button>
            </div>
          ))}
        </nav>

        {/* Toggle sidebar */}
        <div className="px-2 py-3 border-t border-slate-100">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition text-xs font-medium">
            <span>{sidebarOpen ? '◀' : '▶'}</span>
            {sidebarOpen && 'Thu gọn'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">

        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>🏪 Kho hàng</span>
            <span>›</span>
            <span className="font-semibold text-slate-700">{current.icon} {current.label}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden md:block">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>

            <div className="relative">
              <button onClick={() => setShowLogout(!showLogout)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black bg-gradient-to-br from-violet-500 to-purple-600">
                  {user.fullName?.[0]?.toUpperCase() ?? user.username[0].toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-700">{user.fullName || user.username}</div>
                  <div className="text-xs font-semibold text-violet-600">👑 Admin</div>
                </div>
                <span className="text-slate-300 text-xs">▼</span>
              </button>

              {showLogout && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-48 z-50">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <div className="text-xs font-bold text-slate-700">{user.fullName || user.username}</div>
                    <div className="text-xs text-slate-400">{user.username}</div>
                  </div>
                  <button onClick={clearAuth}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition font-medium">
                    🚪 Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {PAGES[page]}
        </div>
      </main>

      {showLogout && <div className="fixed inset-0 z-40" onClick={() => setShowLogout(false)} />}
    </div>
  );
}