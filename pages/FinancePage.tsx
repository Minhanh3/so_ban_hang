
import React, { useState, useEffect } from 'react';
import { 
  PieChart, TrendingUp, TrendingDown, Calendar, ArrowLeft, Download, 
  DollarSign, Info, ChevronRight, BarChart3
} from 'lucide-react';
import { db } from '../services/storage';
import { Order, Product } from '../types';
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const FinancePage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [timeRange, setTimeRange] = useState<'this_month' | 'last_month'>('this_month');

  useEffect(() => {
    const fetchData = async () => {
      const dbOrders = await db.getOrders();
      const dbProducts = await db.getProducts();
      setOrders(dbOrders);
      setProducts(dbProducts);
    };
    fetchData();
  }, []);

  // Helpers
  const getDateRange = (range: 'this_month' | 'last_month') => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (range === 'last_month') {
      start.setMonth(start.getMonth() - 1);
      end.setDate(0); 
    }
    return { start, end };
  };

  const filterOrders = (range: 'this_month' | 'last_month') => {
    const { start, end } = getDateRange(range);
    return orders.filter(o => {
      const d = new Date(o.date);
      return d >= start && d <= end && o.status === 'completed';
    });
  };

  // Calculations
  const currentOrders = filterOrders(timeRange);
  const revenue = currentOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  
  // Calculate COGS (Cost of Goods Sold)
  const cogs = currentOrders.reduce((sum, o) => {
    return sum + o.items.reduce((itemSum, item) => {
      const product = products.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0; // Default to 0 if not set
      return itemSum + (cost * item.quantity);
    }, 0);
  }, 0);

  const profit = revenue - cogs;
  
  // Chart Data Preparation (Daily Revenue)
  const getChartData = () => {
    const { start, end } = getDateRange(timeRange);
    const daysInMonth = end.getDate();
    const data = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(start.getFullYear(), start.getMonth(), i);
        const dayOrders = currentOrders.filter(o => new Date(o.date).getDate() === i);
        
        const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
        
        // Calculate Profit for the day
        const dayCOGS = dayOrders.reduce((sum, o) => {
            return sum + o.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.productId);
                const cost = product?.costPrice || 0;
                return itemSum + (cost * item.quantity);
            }, 0);
        }, 0);

        const dayProfit = dayRevenue - dayCOGS;

        // Chỉ hiện label cho các ngày có doanh thu hoặc các mốc quan trọng (để đỡ rối)
        const showLabel = dayRevenue > 0 || i % 5 === 0;

        data.push({
            name: showLabel ? `${i}/${start.getMonth() + 1}` : '',
            revenue: dayRevenue,
            profit: dayProfit,
            date: date.getDate()
        });
    }
    return data;
  };

  const chartData = getChartData();

  // Product Ranking Logic (Profit based)
  const productRanking = currentOrders
    .flatMap(o => o.items)
    .reduce((acc, item) => {
      const existing = acc.find((x: any) => x.productId === item.productId);
      const product = products.find(p => p.id === item.productId);
      const cost = product?.costPrice || 0;
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

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Báo cáo lãi lỗ <Info size={16} className="text-slate-400" />
             </h2>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-white border border-slate-200 text-sm font-bold text-slate-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
            >
                <option value="this_month">Tháng này</option>
                <option value="last_month">Tháng trước</option>
            </select>
            <button className="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition-colors shadow-lg shadow-green-200">
                <Download size={18} />
            </button>
        </div>
      </div>

      {/* Main Stats Formula */}
      <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <PieChart size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
             <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Doanh thu bán hàng</p>
                <h3 className="text-3xl font-black">{revenue.toLocaleString()}</h3>
             </div>
             <div className="text-slate-500 font-bold text-xl">-</div>
             <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Giá vốn</p>
                <h3 className="text-3xl font-bold text-slate-300">{cogs.toLocaleString()}</h3>
             </div>
             <div className="text-slate-500 font-bold text-xl">+</div>
             <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Lợi nhuận khác</p>
                <h3 className="text-3xl font-bold text-slate-300">0</h3>
             </div>
             <div className="text-slate-500 font-bold text-xl text-green-500">=</div>
             <div className="bg-green-500/20 p-4 rounded-2xl border border-green-500/30 backdrop-blur-sm">
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-1">Lợi nhuận ròng</p>
                <h3 className="text-4xl font-black text-green-400">{profit.toLocaleString()}</h3>
             </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500" />
                Xu hướng lãi lỗ (Lợi nhuận thuần)
            </h3>
            <div className="flex gap-4 text-xs font-bold">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span> Lợi nhuận
                </div>
            </div>
        </div>
        
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }} 
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ fill: '#f8fafc' }}
                        formatter={(value: number) => [value.toLocaleString() + 'đ', 'Lợi nhuận']}
                    />
                    <Bar dataKey="profit" radius={[6, 6, 6, 6]} barSize={32}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#3b82f6' : '#ef4444'} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Details Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Chi tiết lãi lỗ</h3>
            </div>
            <div className="divide-y divide-slate-50">
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-bold text-slate-600">Doanh thu bán hàng</span>
                    <span className="font-bold text-slate-900">{revenue.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 pl-4">Khuyến mãi</span>
                    <span className="text-sm font-bold text-slate-600">0</span>
                </div>
                 <div className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                    <span className="text-sm font-medium text-slate-500 pl-4">Phụ thu</span>
                    <span className="text-sm font-bold text-slate-600">0</span>
                </div>
                <div className="p-4 flex justify-between items-center bg-red-50/50">
                    <span className="text-sm font-bold text-slate-600">Giá vốn hàng bán</span>
                    <span className="font-bold text-red-500">-{cogs.toLocaleString()}</span>
                </div>
                <div className="p-4 flex justify-between items-center bg-green-50/50">
                    <span className="text-sm font-black text-slate-800">Lợi nhuận gộp</span>
                    <span className="font-black text-green-600">{profit.toLocaleString()}</span>
                </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Top Lợi Nhuận</h3>
                <Link to="/products" className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1">
                    Xem tất cả <ChevronRight size={14} />
                </Link>
            </div>
            <div className="p-2">
                {productRanking.length > 0 ? (
                    productRanking.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black
                                    ${idx === 0 ? 'bg-yellow-100 text-yellow-600' : 
                                      idx === 1 ? 'bg-slate-100 text-slate-600' : 
                                      idx === 2 ? 'bg-orange-100 text-orange-600' : 'bg-slate-50 text-slate-400'}
                                `}>
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{item.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Đã bán: {item.quantity}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-green-600 text-sm">{item.profit.toLocaleString()}đ</p>
                                <p className="text-[10px] font-bold text-slate-400">Lãi/sp</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-slate-400 text-sm font-bold">
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
