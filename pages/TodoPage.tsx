
import React, { useState, useEffect } from 'react';
import { RefreshCcw, LayoutDashboard, ShoppingCart, Package, BarChart3, ChevronRight } from 'lucide-react';
import { TODO_CARDS, LOW_STOCK_THRESHOLD } from '../constants';
import { db } from '../services/storage';
import { MockData } from '../types';
import TodoCard from '../components/TodoCard';
import { Link } from "react-router-dom";

const TodoPage: React.FC = () => {
  const [data, setData] = useState<MockData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCounts = async () => {
    setIsRefreshing(true);
    try {
      const [orders, products, debts] = await Promise.all([
        db.getOrders(),
        db.getProducts(),
        db.getDebts()
      ]);
      setData({ orders, products, debts });
    } catch (err) {
      console.error("DB Load error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  const getCount = (cardId: string): number => {
    if (!data) return 0;
    switch (cardId) {
      case 'pending_confirm':
        return data.orders.filter(o => o.status === 'pending_confirm').length;
      case 'shipping':
        return data.orders.filter(o => o.status === 'shipping').length;
      case 'unpaid':
        return data.orders.filter(o => o.status === 'unpaid').length;
      case 'stock_out':
        return data.products.filter(p => p.totalStock === 0).length;
      case 'stock_low':
        return data.products.filter(p => p.totalStock > 0 && p.totalStock <= LOW_STOCK_THRESHOLD).length;
      case 'remind_due':
        return data.debts.filter(d => d.remindStatus === 'due').length;
      case 'remind_missing':
        return data.debts.filter(d => d.remindStatus === 'missing').length;
      case 'collect_needed':
        return data.debts.filter(d => d.remindStatus === 'needed').length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Việc cần làm</h2>
          <p className="text-slate-500 mt-1 font-medium">Chào buổi sáng! Đây là những gì bạn cần lưu ý hôm nay.</p>
        </div>
        <button
          onClick={fetchCounts}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 active:scale-95"
        >
          <RefreshCcw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-primary`} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Quick Actions Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phím tắt tác vụ</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link to="/pos" className="flex items-center gap-4 p-5 bg-primary rounded-3xl text-white shadow-xl shadow-primary-light hover:opacity-90 hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Bán hàng</p>
              <p className="opacity-90 text-xs font-medium">Mở màn hình POS nhanh</p>
            </div>
            <ChevronRight size={20} className="opacity-50 group-hover:opacity-100" />
          </Link>

          <Link to="/products" className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl text-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Hàng hóa</p>
              <p className="text-slate-400 text-xs font-medium">Danh mục & Tồn kho</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600" />
          </Link>

          <Link to="/finance" className="flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-3xl text-slate-900 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <BarChart3 size={24} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">Báo cáo</p>
              <p className="text-slate-400 text-xs font-medium">Doanh thu & Lợi nhuận</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 group-hover:text-purple-600" />
          </Link>
        </div>
      </section>

      {/* Task List Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Chỉ số vận hành</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TODO_CARDS.map((config) => (
            <TodoCard key={config.id} config={config} count={getCount(config.id)} />
          ))}
        </div>
      </section>

      {/* Info Card */}
      <section className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block bg-primary text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-6">Hệ thống ổn định</span>
          <h3 className="text-3xl md:text-4xl font-black mb-6 leading-tight">Mô phỏng cơ sở dữ liệu SQL Real-time</h3>
          <p className="text-slate-400 mb-8 leading-relaxed font-medium text-lg">
            Ứng dụng đang chạy trên cơ chế LocalStorage SQL-Engine mô phỏng, đảm bảo dữ liệu được lưu trữ an toàn ngay cả khi tải lại trang.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold">SQL Indexing</span>
            <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold">Atomic Transactions</span>
            <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-xs font-bold">Gemini AI Support</span>
          </div>
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 opacity-5 pointer-events-none hidden lg:block">
          <LayoutDashboard size={400} />
        </div>
      </section>
    </div>
  );
};

export default TodoPage;
