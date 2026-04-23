import React, { useEffect, useState } from 'react';
import { BarChart3, ChevronRight, Package, RefreshCcw, ShoppingCart, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import TodoCard from '../components/TodoCard';
import { LOW_STOCK_THRESHOLD, TODO_CARDS } from '../constants';
import { db } from '../services/storage';
import { Customer, MockData } from '../types';

type DashboardData = MockData & {
  customers: Customer[];
};

const TodoPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCounts = async () => {
    setIsRefreshing(true);
    try {
      const [orders, products, debts, customers] = await Promise.all([
        db.getOrders(),
        db.getProducts(),
        db.getDebts(),
        db.getCustomers(),
      ]);
      setData({ orders, products, debts, customers });
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

  const totalRevenue = data?.orders.reduce((sum, order) => sum + order.totalAmount, 0) || 0;
  const totalProducts = data?.products.length || 0;
  const totalStockUnits = data?.products.reduce((sum, product) => sum + product.totalStock, 0) || 0;
  const totalCustomers = data?.customers.length || 0;
  const outstandingDebt = data?.debts.reduce((sum, debt) => sum + debt.amount, 0) || 0;
  const todayRevenue = data?.orders
    .filter((order) => new Date(order.date).toDateString() === new Date().toDateString())
    .reduce((sum, order) => sum + order.totalAmount, 0) || 0;

  const overviewCards = [
    { label: 'Doanh thu hôm nay', value: `${todayRevenue.toLocaleString('vi-VN')}đ`, icon: <Wallet size={20} />, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Tổng đơn hàng', value: String(data?.orders.length || 0), icon: <ShoppingCart size={20} />, tone: 'bg-blue-50 text-blue-700' },
    { label: 'Số sản phẩm', value: String(totalProducts), icon: <Package size={20} />, tone: 'bg-amber-50 text-amber-700' },
    { label: 'Khách hàng', value: String(totalCustomers), icon: <Users size={20} />, tone: 'bg-violet-50 text-violet-700' },
  ];

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
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-300">Tổng quan nhanh</h3>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>
                {card.icon}
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-slate-300">{card.label}</p>
              <p className="mt-2 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{card.value}</p>
            </div>
          ))}
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

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Ảnh chụp vận hành</h3>
            <span className="rounded-full bg-primary-light px-3 py-1 text-[10px] font-black uppercase tracking-wider text-primary">Live</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">Tổng doanh thu</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{totalRevenue.toLocaleString('vi-VN')}đ</p>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">Tất cả đơn hàng đã tạo trong hệ thống.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">Tồn kho hiện có</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{totalStockUnits.toLocaleString('vi-VN')}</p>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">Tổng số lượng hàng hóa đang còn trong kho.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">Sắp hết / hết hàng</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">
                {(data?.products.filter((product) => product.totalStock <= LOW_STOCK_THRESHOLD).length || 0).toLocaleString('vi-VN')}
              </p>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">Bao gồm sản phẩm tồn thấp và sản phẩm đã hết.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-300">Công nợ theo dõi</p>
              <p className="mt-2 text-3xl font-black text-slate-900 dark:text-slate-100">{outstandingDebt.toLocaleString('vi-VN')}đ</p>
              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">Tổng số tiền công nợ đang lưu trong sổ nợ.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-100 bg-slate-900 p-6 text-white shadow-2xl dark:border-slate-800">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-black">Đơn gần đây</h3>
            <BarChart3 size={18} className="text-primary" />
          </div>
          <div className="space-y-3">
            {(data?.orders.slice(0, 5) || []).map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">#{order.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-400">{order.customerName || 'Khách lẻ'} - {new Date(order.date).toLocaleString('vi-VN')}</p>
                  </div>
                  <span className="text-sm font-black text-primary">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            ))}
            {(data?.orders.length || 0) === 0 && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-medium text-slate-400">
                Chưa có đơn hàng nào để hiển thị.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TodoPage;
