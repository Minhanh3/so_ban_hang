
import React, { useState, useEffect } from 'react';
import {
  PieChart, TrendingUp, TrendingDown, Calendar, ArrowLeft, Download, Trash2, FileText,
  DollarSign, Info, ChevronRight, BarChart3
} from 'lucide-react';
import { db } from '../services/storage';
import { Order, Product } from '../types';
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell
} from 'recharts';

const FinancePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ revenue: 0, profit: 0, cost: 0 });
  const [timeRange, setTimeRange] = useState<'this_month' | 'last_month'>('this_month');

  useEffect(() => {
    const fetchData = async () => {
      const allOrders = await db.getOrders();
      const allProducts = await db.getProducts();
      setProducts(allProducts);

      // Filter by time range
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Helpers within effect to avoid dependency issues or move outside
      const getRange = (range: 'this_month' | 'last_month') => {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        if (range === 'last_month') {
          start.setMonth(start.getMonth() - 1);
          end.setDate(0);
          // Handle January edge case for previous year if needed, but Date handles setMonth(-1) correctly
          if (currentMonth === 0) {
            start.setFullYear(currentYear - 1);
            start.setMonth(11);
            end.setFullYear(currentYear - 1);
            end.setMonth(11);
            end.setDate(31); // approximately
          }
        }
        // Correct logic for last month:
        if (range === 'last_month') {
          const firstDayLastMonth = new Date(currentYear, currentMonth - 1, 1);
          const lastDayLastMonth = new Date(currentYear, currentMonth, 0);
          return { start: firstDayLastMonth, end: lastDayLastMonth };
        }

        return { start: new Date(currentYear, currentMonth, 1), end: new Date(currentYear, currentMonth + 1, 0) };
      };

      const { start, end } = getRange(timeRange);

      const filteredOrders = allOrders.filter(o => {
        const d = new Date(o.date);
        return d >= start && d <= end && o.status === 'completed';
      });

      setOrders(filteredOrders);

      // Calculate Summary & Chart Data
      let totalRevenue = 0;
      let totalCost = 0;

      const dailyData: Record<string, { revenue: number, profit: number, cost: number }> = {};

      filteredOrders.forEach(order => {
        totalRevenue += order.totalAmount;

        let orderCost = 0;
        order.items.forEach(item => {
          const product = allProducts.find(p => p.id === item.productId);
          const cost = (product as any)?.costPrice || (product ? product.basePrice * 0.7 : item.price * 0.7);
          orderCost += cost * item.quantity;
        });

        totalCost += orderCost;

        const dateKey = new Date(order.date).getDate().toString();
        if (!dailyData[dateKey]) dailyData[dateKey] = { revenue: 0, profit: 0, cost: 0 };
        dailyData[dateKey].revenue += order.totalAmount;
        dailyData[dateKey].cost += orderCost;
        dailyData[dateKey].profit += (order.totalAmount - orderCost);
      });

      setSummary({
        revenue: totalRevenue,
        cost: totalCost,
        profit: totalRevenue - totalCost
      });

      // Format for Recharts
      const daysInMonth = end.getDate();
      const data = [];

      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(start.getFullYear(), start.getMonth(), i);
        const dateKey = i.toString();
        const dayData = dailyData[dateKey] || { revenue: 0, profit: 0, cost: 0 };

        const showLabel = dayData.revenue > 0 || i % 5 === 0;

        data.push({
          name: showLabel ? `${i}/${start.getMonth() + 1}` : '',
          revenue: dayData.revenue,
          profit: dayData.profit,
          date: date.getDate()
        });
      }

      setChartData(data);
    };

    fetchData();
  }, [timeRange]);

  // Product Ranking Logic
  const productRanking = orders
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      const existing = acc.find((x: any) => x.productId === item.productId);
      const product = products.find(p => p.id === item.productId);
      const cost = (product as any)?.costPrice || (product ? product.basePrice * 0.7 : item.price * 0.7);
      const itemProfit = (item.price - cost) * item.quantity;
      const itemRevenue = item.price * item.quantity;

      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += itemRevenue;
        existing.profit += itemProfit;
      } else {
        acc.push({
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          revenue: itemRevenue,
          profit: itemProfit
        });
      }
      return acc;
    }, [] as any[])
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const handleClearData = async () => {
    if (confirm('CẢNH BÁO: Hành động này sẽ xóa TOÀN BỘ dữ liệu Đơn hàng để reset báo cáo tài chính. Bạn có chắc chắn không?')) {
      await db.clearAllOrders();
      window.location.reload();
    }
  };

  const handleExportReport = () => {
    import('../utils/csvExport').then(({ exportToCSV }) => {
      const dataToExport = chartData.map(d => ({
        ...d,
        revenue: d.revenue,
        profit: d.profit,
        date: `${d.date}/${new Date().getMonth() + 1}`
      }));
      exportToCSV(dataToExport, 'bao_cao_tai_chinh');
    });
  };

  const handleExportPDF = () => {
    import('../utils/pdfExport').then(({ exportFinanceToPDF }) => {
      const dataToExport = chartData.map(d => ({
        ...d,
        revenue: d.revenue,
        profit: d.profit,
        date: `${d.date}/${new Date().getMonth() + 1}`
      }));
      exportFinanceToPDF(dataToExport);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 dark:text-slate-300 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              Báo cáo lãi lỗ <Info size={16} className="text-slate-400 dark:text-slate-300" />
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearData}
            className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-100"
            title="Reset dữ liệu"
          >
            <Trash2 size={18} />
            <span className="hidden sm:inline">Reset dữ liệu</span>
          </button>
          <div className="h-8 w-[1px] bg-slate-200 mx-2"></div>
          <button
            onClick={handleExportPDF}
            className="bg-orange-50 text-orange-600 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-100 transition-colors border border-orange-100 shadow-sm"
            title="Xuất PDF"
          >
            <FileText size={18} />
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-300 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="this_month">Tháng này</option>
            <option value="last_month">Tháng trước</option>
          </select>
          <button
            onClick={handleExportReport}
            className="bg-primary text-white px-3 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-colors shadow-lg shadow-primary-light"
            title="Xuất Excel"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-slate-500 dark:text-slate-300 font-bold text-sm">Doanh thu</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{summary.revenue.toLocaleString()}đ</p>
          <div className="flex items-center gap-1 text-green-500 text-xs font-bold mt-2">
            <TrendingUp size={14} /> +12% so với tháng trước
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <PieChart size={20} />
            </div>
            <span className="text-slate-500 dark:text-slate-300 font-bold text-sm">Chi phí (Giá vốn)</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100">{summary.cost.toLocaleString()}đ</p>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(summary.cost / (summary.revenue || 1)) * 100}%` }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary-light text-primary rounded-lg">
              <BarChart3 size={20} />
            </div>
            <span className="text-slate-500 dark:text-slate-300 font-bold text-sm">Lợi nhuận ròng</span>
          </div>
          <p className="text-3xl font-black text-primary">{summary.profit.toLocaleString()}đ</p>
          <div className="flex items-center gap-1 text-primary text-xs font-bold mt-2">
            <TrendingUp size={14} /> Tỷ suất: {summary.revenue ? Math.round((summary.profit / summary.revenue) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-6">Biểu đồ tăng trưởng</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip
                  cursor={{ fill: '#F1F5F9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: number, name: string) => [`${value.toLocaleString()}đ`, name]}
                />
                <Legend />
                <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="profit" name="Lợi nhuận" fill="var(--primary-color)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2 w-full text-left">Cấu trúc dòng tiền</h3>
          <div className="h-[250px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={[
                    { name: 'Giá vốn', value: summary.cost },
                    { name: 'Lợi nhuận', value: summary.profit }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#F97316" />
                  <Cell fill="var(--primary-color)" />
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value.toLocaleString()}đ`, name]}
                />
              </RePieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 dark:text-slate-200">{summary.revenue ? Math.round((summary.profit / summary.revenue) * 100) : 0}%</span>
              <span className="text-xs text-slate-500 dark:text-slate-300 font-bold uppercase">Margin</span>
            </div>
          </div>
          <div className="flex gap-4 mt-4 w-full justify-center">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div> Giá vốn
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <div className="w-3 h-3 rounded-full bg-primary"></div> Lợi nhuận
            </div>
          </div>
        </div>
      </div>

      {/* Details Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Chi tiết lãi lỗ</h3>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Doanh thu bán hàng</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{summary.revenue.toLocaleString()}</span>
            </div>
            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-300 pl-4">Khuyến mãi</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">0</span>
            </div>
            <div className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 transition-colors">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-300 pl-4">Phụ thu</span>
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">0</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-red-50/50">
              <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Giá vốn hàng bán</span>
              <span className="font-bold text-red-500">-{summary.cost.toLocaleString()}</span>
            </div>
            <div className="p-4 flex justify-between items-center bg-primary-light">
              <span className="text-sm font-black text-slate-800 dark:text-slate-200">Lợi nhuận gộp</span>
              <span className="font-black text-primary">{summary.profit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Top Lợi Nhuận</h3>
            <Link to="/products" className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
              Xem tất cả <ChevronRight size={14} />
            </Link>
          </div>
          <div className="p-2">
            {productRanking.length > 0 ? (
              productRanking.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 rounded-2xl transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black
                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                        idx === 1 ? 'bg-slate-100 text-slate-600 dark:text-slate-300' :
                          idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-300'}
                                `}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">Đã bán: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary text-sm">{item.profit.toLocaleString()}đ</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-300">Lãi/sp</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 dark:text-slate-300 text-sm font-bold">
                Chưa có dữ liệu bán hàng
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancePage;


