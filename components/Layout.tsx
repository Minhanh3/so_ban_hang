import React, { useState } from 'react';
import {
  Bell,
  Box,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Palette,
  PieChart,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const { primaryColor, setPrimaryColor, themeMode, toggleThemeMode } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();

  const userInitials = (user?.displayName || user?.username || 'AD')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'AD';

  const colorPresets = [
    { name: 'Green', value: '#16a34a' },
    { name: 'Blue', value: '#2563eb' },
    { name: 'Indigo', value: '#4f46e5' },
    { name: 'Violet', value: '#7c3aed' },
    { name: 'Rose', value: '#e11d48' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Amber', value: '#d97706' },
    { name: 'Slate', value: '#475569' },
  ];

  const menuItems = [
    { label: 'Việc cần làm', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingBag size={20} /> },
    { label: 'Sản phẩm', path: '/products', icon: <Box size={20} /> },
    { label: 'Nhập hàng', path: '/import', icon: <Truck size={20} /> },
    { label: 'Sổ nợ', path: '/debts', icon: <Users size={20} /> },
    { label: 'Bán hàng (POS)', path: '/pos', icon: <CreditCard size={20} /> },
    { label: 'Tài chính', path: '/finance', icon: <PieChart size={20} /> },
    { label: 'Cài đặt', path: '/settings', icon: <Settings size={20} /> },
  ];

  const currentLabel = menuItems.find((item) => item.path === location.pathname)?.label || 'Bảng điều khiển';
  const isPosPage = location.pathname.includes('pos') || window.location.hash.includes('pos');

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside
        className={`
          fixed inset-y-0 left-0 z-[70] flex w-64 shrink-0 transform flex-col border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out md:relative dark:border-slate-800 dark:bg-slate-900
          ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary-light">
              <Store size={22} />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800 dark:text-slate-100">Sổ Bán Hàng</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400 md:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  group flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-bold transition-all
                  ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary-light'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800/70'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400 transition-colors group-hover:text-primary dark:text-slate-500'}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white bg-slate-200 font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">{user?.displayName || 'Tài khoản'}</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                @{user?.username || 'guest'}
              </p>
            </div>
            <button
              onClick={logout}
              className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-rose-500"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[#f8fafc] dark:bg-slate-950">
        {!isPosPage && (
          <header className="z-50 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              >
                <Menu size={24} />
              </button>
              <h2 className="hidden text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 sm:block">
                {currentLabel}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={toggleThemeMode}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                title={themeMode === 'dark' ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
              >
                {themeMode === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsThemeOpen(!isThemeOpen)}
                  className={`rounded-xl p-2 transition-colors ${isThemeOpen ? 'bg-primary-light text-primary' : 'text-slate-400 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                  title="Đổi màu giao diện"
                >
                  <Palette size={20} />
                </button>

                {isThemeOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsThemeOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                      <p className="mb-3 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Màu chủ đạo</p>
                      <div className="mb-4 grid grid-cols-4 gap-2">
                        {colorPresets.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => {
                              setPrimaryColor(color.value);
                              setIsThemeOpen(false);
                            }}
                            className={`aspect-square w-full rounded-lg border-2 transition-transform hover:scale-110 ${primaryColor === color.value ? 'border-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          />
                        ))}
                      </div>
                      <div className="border-t border-slate-100 pt-3 dark:border-slate-700">
                        <p className="mb-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">MÀU TỰ CHỌN</p>
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(event) => setPrimaryColor(event.target.value)}
                          className="h-8 w-full cursor-pointer rounded-lg border-none bg-transparent"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button className="relative rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
                <Bell size={20} />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>
              <div className="mx-1 h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl p-1 pr-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                title="Đăng xuất"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                  {userInitials}
                </div>
                <span className="hidden text-sm font-bold text-slate-700 dark:text-slate-200 lg:block">{user?.displayName || 'Tài khoản'}</span>
              </button>
            </div>
          </header>
        )}

        <main className={`custom-scrollbar flex-1 overflow-y-auto ${isPosPage ? 'p-0' : 'p-4 md:p-8'}`}>
          <div className={isPosPage ? 'h-full w-full' : 'mx-auto max-w-7xl pb-12'}>
            {children}
          </div>
        </main>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-[65] bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
