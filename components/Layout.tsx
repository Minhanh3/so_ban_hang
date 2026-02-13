
import React, { useState } from 'react';
import { Menu, X, Bell, User, LayoutDashboard, ShoppingBag, Box, Users, CreditCard, PieChart, ChevronRight, Store } from 'lucide-react';
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const menuItems = [
    { label: 'Việc cần làm', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Đơn hàng', path: '/orders', icon: <ShoppingBag size={20} /> },
    { label: 'Sản phẩm', path: '/products', icon: <Box size={20} /> },
    { label: 'Sổ nợ', path: '/debts', icon: <Users size={20} /> },
    { label: 'Bán hàng (POS)', path: '/pos', icon: <CreditCard size={20} /> },
    { label: 'Tài chính', path: '/finance', icon: <PieChart size={20} /> },
  ];

  const currentLabel = menuItems.find(m => m.path === location.pathname)?.label || 'Bảng điều khiển';

  return (
    <div className="flex h-screen bg-[#f8fafc] w-full overflow-hidden text-slate-900">
      {/* Sidebar Desktop & Mobile */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-[70] 
        transform transition-transform duration-300 ease-in-out flex flex-col shrink-0
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
              <Store size={22} />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">Sổ Bán Hàng</span>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="md:hidden p-1 text-slate-400">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`
                  flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold transition-all group
                  ${isActive 
                    ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-green-600'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-green-600 transition-colors'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </div>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 border border-white">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">Admin Shop</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Phiên bản Pro</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#f8fafc]">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:block">
              {currentLabel}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200 mx-1"></div>
            <button className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded-xl pr-3 transition-colors">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
                <User size={16} />
              </div>
              <span className="text-sm font-bold text-slate-700 hidden lg:block">Quản trị viên</span>
            </button>
          </div>
        </header>

        {/* Page Scrolling Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Backdrop */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[65] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
