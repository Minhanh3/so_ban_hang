
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, Box,
  Filter, FileText, FileSpreadsheet,
  History, ArrowUp, ArrowDown, Minus,
  Package, ClipboardList
} from 'lucide-react';
import { db } from '../services/storage';
import { Product, StockLog } from '../types';
import ProductModal from '../components/ProductModal';
import { useLocation } from 'react-router-dom';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

const REASON_LABELS: Record<string, { label: string; color: string }> = {
  manual_edit: { label: 'Sửa thủ công', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  import:      { label: 'Nhập hàng',    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  order:       { label: 'Đơn bán',      color: 'bg-orange-50 text-orange-700 border-orange-200' },
  adjustment:  { label: 'Điều chỉnh',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'list' | 'stock_log';

const ProductsPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('list');
  const [products, setProducts] = useState<Product[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [search, setSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get('status');

  const refreshAll = useCallback(async () => {
    const [list, logs] = await Promise.all([db.getProducts(), db.getStockLogs()]);

    let filteredList = list;
    if (statusFilter === 'out') {
      filteredList = filteredList.filter(p => p.totalStock === 0);
    } else if (statusFilter === 'low') {
      filteredList = filteredList.filter(p => p.totalStock > 0 && p.totalStock <= 10);
    }

    setProducts(filteredList);
    setStockLogs(logs);
  }, [statusFilter]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredLogs = stockLogs.filter(l =>
    l.productName.toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.variantName || '').toLowerCase().includes(logSearch.toLowerCase()) ||
    (l.note || '').toLowerCase().includes(logSearch.toLowerCase())
  );

  const handleSave = async (product: Product) => {
    if (editingProduct) {
      await db.updateProduct(product);
    } else {
      await db.addProduct(product);
    }
    refreshAll();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      await db.deleteProduct(id);
      refreshAll();
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleClearAll = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa TẤT CẢ sản phẩm? Hành động này không thể hoàn tác!')) {
      await db.clearAllProducts();
      refreshAll();
    }
  };

  const handleExport = () => {
    import('../utils/csvExport').then(({ exportToCSV }) => {
      const dataToExport = products.map(p => ({
        ...p,
        variants: p.variants.map(v => `${v.name} (${v.stock})`).join('; ')
      }));
      exportToCSV(dataToExport, 'danh_sach_san_pham');
    });
  };

  const handleExportPDF = () => {
    import('../utils/pdfExport').then(({ exportProductsToPDF }) => {
      exportProductsToPDF(products);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Danh mục sản phẩm</h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Quản lý kho hàng và giá bán của bạn.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            className="bg-red-50 text-red-600 px-3 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100 shadow-sm"
            title="Xóa tất cả"
          >
            <Trash2 size={20} />
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-orange-50 text-orange-600 px-3 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-all border border-orange-100 shadow-sm"
            title="Xuất PDF"
          >
            <FileText width={20} />
          </button>
          <button
            onClick={handleExport}
            className="bg-blue-50 text-blue-600 px-3 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
            title="Xuất Excel"
          >
            <FileSpreadsheet width={20} />
          </button>
          <button
            onClick={() => { setEditingProduct(undefined); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary-light active:scale-95"
          >
            <Plus size={20} />
            Thêm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setTab('list')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'list' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Package size={16} /> Danh sách
        </button>
        <button
          onClick={() => setTab('stock_log')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'stock_log' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <History size={16} /> Lịch sử tồn kho
          {stockLogs.length > 0 && (
            <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {stockLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* ── TAB: Danh sách sản phẩm ── */}
      {tab === 'list' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm, SKU..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium"
              />
            </div>
            <button className="px-4 py-3 border border-slate-200 rounded-2xl flex items-center justify-center gap-2 text-slate-600 font-bold text-sm bg-white hover:bg-slate-50">
              <Filter size={18} />
              Bộ lọc
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-6 py-5">Sản phẩm</th>
                  <th className="px-6 py-5">Giá bán</th>
                  <th className="px-6 py-5">Tồn kho</th>
                  <th className="px-6 py-5">Phân loại</th>
                  <th className="px-6 py-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                          <Box size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{product.sku || 'Không có SKU'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{product.basePrice.toLocaleString()}đ</p>
                      {product.promoPrice ? <p className="text-[10px] text-red-500 line-through">{product.promoPrice.toLocaleString()}đ</p> : null}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        product.totalStock === 0
                          ? 'bg-red-50 text-red-600'
                          : product.totalStock <= 10
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-primary-light text-primary'
                      }`}>
                        {product.totalStock} {product.unit || 'món'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {product.variants.length > 0 ? (
                          product.variants.map(v => (
                            <span key={v.id} className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {v.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-300 text-[10px] font-bold italic">Mặc định</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(product)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Chỉnh sửa (tồn kho sẽ được ghi log)"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredProducts.length === 0 && (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Box size={32} />
                </div>
                <p className="text-slate-400 font-bold italic">Không tìm thấy sản phẩm nào.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Lịch sử tồn kho ── */}
      {tab === 'stock_log' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, lý do, ghi chú..."
              value={logSearch}
              onChange={e => setLogSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all text-sm font-medium shadow-sm"
            />
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng lượt thay đổi', value: stockLogs.length, icon: <ClipboardList size={20} />, color: 'text-slate-700' },
              { label: 'Nhập hàng', value: stockLogs.filter(l => l.reason === 'import').length, icon: <ArrowUp size={20} />, color: 'text-emerald-600' },
              { label: 'Đơn bán', value: stockLogs.filter(l => l.reason === 'order').length, icon: <ArrowDown size={20} />, color: 'text-orange-600' },
              { label: 'Sửa thủ công', value: stockLogs.filter(l => l.reason === 'manual_edit').length, icon: <Minus size={20} />, color: 'text-blue-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className={`${stat.color} opacity-70`}>{stat.icon}</div>
                <div>
                  <p className="text-xl font-black text-slate-800">{stat.value}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Log table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/60 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Ngày &amp; Giờ</th>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-4 py-4 text-center">Trước</th>
                    <th className="px-4 py-4 text-center">Sau</th>
                    <th className="px-4 py-4 text-center">Thay đổi</th>
                    <th className="px-6 py-4">Lý do</th>
                    <th className="px-6 py-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center text-slate-300 gap-3">
                          <History size={36} />
                          <p className="text-sm font-bold">Chưa có lịch sử thay đổi tồn kho.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                  {filteredLogs.map(log => {
                    const { date, time } = formatDateTime(log.date);
                    const reason = REASON_LABELS[log.reason] || { label: log.reason, color: 'bg-slate-100 text-slate-600' };
                    const isPositive = log.change > 0;
                    const isNeutral = log.change === 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                        {/* Date & Time */}
                        <td className="px-6 py-3">
                          <p className="text-sm font-bold text-slate-800">{date}</p>
                          <p className="text-[11px] font-bold text-slate-400">{time}</p>
                        </td>
                        {/* Product */}
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-800 text-sm">{log.productName}</p>
                          {log.variantName && (
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
                              {log.variantName}
                            </span>
                          )}
                        </td>
                        {/* Before */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-black text-slate-600">{log.oldStock}</span>
                        </td>
                        {/* After */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-black text-slate-800">{log.newStock}</span>
                        </td>
                        {/* Change */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
                            isNeutral ? 'bg-slate-100 text-slate-500' :
                            isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                          }`}>
                            {isPositive ? <ArrowUp size={12} /> : !isNeutral ? <ArrowDown size={12} /> : <Minus size={12} />}
                            {isPositive ? '+' : ''}{log.change}
                          </span>
                        </td>
                        {/* Reason */}
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${reason.color}`}>
                            {reason.label}
                          </span>
                        </td>
                        {/* Note */}
                        <td className="px-6 py-3">
                          <p className="text-xs text-slate-500 font-bold">{log.note || '—'}</p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialProduct={editingProduct}
      />
    </div>
  );
};

export default ProductsPage;
