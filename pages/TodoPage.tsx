import React, { useEffect, useState } from 'react';
import { BarChart3, ChevronRight, LayoutDashboard, Package, RefreshCcw, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import TodoCard from '../components/TodoCard';
import { LOW_STOCK_THRESHOLD, TODO_CARDS } from '../constants';
import { db } from '../services/storage';
import { MockData } from '../types';

const TodoPage: React.FC = () => {
  const [data, setData] = useState<MockData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCounts = async () => {
    setIsRefreshing(true);
    try {
      const [orders, products, debts] = await Promise.all([
        db.getOrders(),
        db.getProducts(),
        db.getDebts(),
      ]);
      setData({ orders, products, debts });
    } catch (error) {
      console.error('DB Load error:', error);
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
        return data.orders.filter((order) => order.status === 'pending_confirm').length;
      case 'shipping':
        return data.orders.filter((order) => order.status === 'shipping').length;
      case 'unpaid':
        return data.orders.filter((order) => order.status === 'unpaid').length;
      case 'stock_out':
        return data.products.filter((product) => product.totalStock === 0).length;
      case 'stock_low':
        return data.products.filter((product) => product.totalStock > 0 && product.totalStock <= LOW_STOCK_THRESHOLD).length;
      case 'remind_due':
        return data.debts.filter((debt) => debt.remindStatus === 'due').length;
      case 'remind_missing':
        return data.debts.filter((debt) => debt.remindStatus === 'missing').length;
      case 'collect_needed':
        return data.debts.filter((debt) => debt.remindStatus === 'needed').length;
      default:
        return 0;
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">Việc cần làm</h2>
          <p className="mt-1 font-medium text-slate-500 dark:text-slate-300">
            Chào buổi sáng! Đây là những gì bạn cần lưu ý hôm nay.
          </p>
        </div>
        <button
          onClick={fetchCounts}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-95 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCcw size={18} className={`${isRefreshing ? 'animate-spin' : ''} text-primary`} />
          Làm mới dữ liệu
        </button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Phím tắt tác vụ</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link to="/pos" className="group flex items-center gap-4 rounded-3xl bg-primary p-5 text-white shadow-xl shadow-primary-light transition-all hover:-translate-y-1 hover:opacity-90">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 dark:bg-white/10">
              <ShoppingCart size={24} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">Bán hàng</p>
              <p className="text-xs font-medium opacity-90">Mở màn hình POS nhanh</p>
            </div>
            <ChevronRight size={20} className="opacity-50 group-hover:opacity-100" />
          </Link>

          <Link to="/products" className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Package size={24} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">Hàng hóa</p>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-300">Danh mục và tồn kho</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-300 group-hover:text-blue-600" />
          </Link>

          <Link to="/finance" className="group flex items-center gap-4 rounded-3xl border border-slate-100 bg-white p-5 text-slate-900 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
              <BarChart3 size={24} />
            </div>
            <div className="flex-1">
              <p className="text-lg font-bold">Báo cáo</p>
              <p className="text-xs font-medium text-slate-400 dark:text-slate-300">Doanh thu và lợi nhuận</p>
            </div>
            <ChevronRight size={20} className="text-slate-300 dark:text-slate-300 group-hover:text-purple-600" />
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Chỉ số vận hành</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TODO_CARDS.map((config) => (
            <TodoCard key={config.id} config={config} count={getCount(config.id)} />
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 text-white shadow-2xl md:p-12">
        <div className="relative z-10 max-w-2xl">
          <span className="mb-6 inline-block rounded-full bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
            Hệ thống ổn định
          </span>
          <h3 className="mb-6 text-3xl font-black leading-tight md:text-4xl">Mô phỏng cơ sở dữ liệu SQL real-time</h3>
          <p className="mb-8 text-lg font-medium leading-relaxed text-slate-400 dark:text-slate-300">
            Ứng dụng đang chạy trên cơ chế LocalStorage SQL Engine mô phỏng, đảm bảo dữ liệu được lưu trữ an toàn ngay cả khi tải lại trang.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold dark:bg-white/10">SQL Indexing</span>
            <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold dark:bg-white/10">Atomic Transactions</span>
            <span className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold dark:bg-white/10">Gemini AI Support</span>
          </div>
        </div>
        <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 translate-x-1/4 opacity-5 lg:block">
          <LayoutDashboard size={400} />
        </div>
      </section>
    </div>
  );
};

export default TodoPage;
