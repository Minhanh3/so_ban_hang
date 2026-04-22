
import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Plus, Calendar, Eye, Trash2, ArrowLeft, Package, CheckCircle2, Clock, ShoppingCart, Minus, ChevronRight, AlertCircle, Printer, Download, Check, Zap, Table, Grid, Info, X, Tag, Truck, Gift, MoreVertical, CreditCard, Edit2, Image as ImageIcon, FileText, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/storage';
import { Order, OrderItem, Product, ProductVariant } from '../types';
import { Link, useLocation, useNavigate } from "react-router-dom";

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPosOpen, setIsPosOpen] = useState(window.location.hash.includes('/pos') || window.location.pathname.includes('/pos'));
  const [checkoutSuccess, setCheckoutSuccess] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get('status');

  // POS Specific state
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);

  // State for editing price in cart
  const [editingCartItemIndex, setEditingCartItemIndex] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<'vnd' | '%'>('vnd');

  const sanitizeFilePart = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_');

  const buildOrderFilename = (
    prefix: string | undefined,
    base: string,
    orderCode?: string,
    dateISO?: string,
    includeDate = true,
  ) => {
    const datePart = dateISO
      ? new Date(dateISO).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const parts = [
      sanitizeFilePart(prefix || ''),
      sanitizeFilePart(base),
      orderCode ? sanitizeFilePart(orderCode) : '',
      includeDate ? datePart : '',
    ].filter(Boolean);
    return parts.join('_');
  };

  const refreshData = async () => {
    const prods = await db.getProducts();
    const ords = await db.getOrders();
    setProducts(prods);
    let list = ords;
    if (statusFilter) {
      list = list.filter(o => o.status === (statusFilter as any));
    }
    setOrders(list);
  };

  useEffect(() => {
    refreshData();
    // Auto-open POS if on /pos route or hash
    if (location.pathname.includes('pos') || window.location.hash.includes('pos')) {
      setIsPosOpen(true);
    }
  }, [statusFilter, location.pathname, location.hash]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPosOpen) return;
      if (e.key === 'F1') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'F3') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPosOpen, cart]);

  const filteredOrders = orders.filter(o =>
    o.id.toLowerCase().includes(search.toLowerCase()) ||
    o.items.some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredPosProducts = products.filter(p =>
    p.name.toLowerCase().includes(posSearch.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(posSearch.toLowerCase()))
  );

  const addToCart = (product: Product, variant?: ProductVariant) => {
    if (product.variants.length > 0 && !variant) {
      setSelectedProductForCart(product);
      return;
    }

    const targetVariant = variant || (product.variants.length === 0 ? { id: 'default', name: 'Mặc định', price: product.basePrice, stock: product.totalStock } : product.variants[0]);

    const existingIndex = cart.findIndex(item => item.productId === product.id && item.variantId === targetVariant.id);
    const currentQty = existingIndex > -1 ? cart[existingIndex].quantity : 0;

    if (currentQty + 1 > targetVariant.stock) {
      alert(`Sản phẩm ${product.name} đã hết hàng trong kho.`);
      return;
    }

    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        variantId: targetVariant.id,
        name: product.name,
        variantName: targetVariant.name,
        quantity: 1,
        price: targetVariant.price || product.basePrice
      }]);
    }
    setSelectedProductForCart(null);
  };

  const updateCartQuantity = (productId: string, variantId: string, delta: number) => {
    const item = cart.find(i => i.productId === productId && i.variantId === variantId);
    if (!item) return;

    if (delta > 0) {
      const product = products.find(p => p.id === productId);
      const variant = product?.variants.find(v => v.id === variantId) || (product?.variants.length === 0 ? { stock: product.totalStock } : null);
      if (variant && item.quantity + 1 > (variant as any).stock) {
        alert(`Không thể vượt quá tồn kho.`);
        return;
      }
    }

    setCart(cart.map(i => {
      if (i.productId === productId && i.variantId === variantId) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const removeFromCart = (productId: string, variantId: string) => {
    setCart(cart.filter(item => !(item.productId === productId && item.variantId === variantId)));
  };

  // Price Edit Logic
  const openPriceEdit = (index: number) => {
    const item = cart[index];
    setEditingCartItemIndex(index);
    setTempPrice(item.price);
    setDiscountValue(0);
    setDiscountType('vnd');
  };

  const applyPriceEdit = () => {
    if (editingCartItemIndex === null) return;
    const newCart = [...cart];
    let finalPrice = tempPrice;

    if (discountType === 'vnd') {
      finalPrice -= discountValue;
    } else {
      finalPrice -= (tempPrice * discountValue / 100);
    }

    newCart[editingCartItemIndex].price = Math.max(0, finalPrice);
    setCart(newCart);
    setEditingCartItemIndex(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const settings = await db.getShopSettings();
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      status: 'completed',
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount,
      distributorName: settings.distributor.name,
      distributorPhone: settings.distributor.phone,
      distributorAddress: settings.distributor.address,
    };

    const result = await db.createOrder(newOrder);
    if (result.success) {
      setCheckoutSuccess(newOrder);
      setCart([]);
      refreshData();
    } else {
      setError(result.message || 'Lỗi không xác định.');
    }
  };

  const handleExportPDF = async (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const settings = await db.getShopSettings();
    const fileBase = buildOrderFilename(settings.orderFilePrefix, 'hoa_don', order.id.slice(-6), order.date);
    const distributorName = order.distributorName || settings.distributor.name || 'Chưa cấu hình';
    const distributorPhone = order.distributorPhone || settings.distributor.phone || 'Chưa cấu hình';
    const distributorAddress = order.distributorAddress || settings.distributor.address || 'Chưa cấu hình';
    const totalQty = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const itemsHtml = order.items.map((item) => `
      <tr>
        <td style="padding:8px; border:1px solid #111;">${item.name}</td>
        <td style="padding:8px; border:1px solid #111;">${item.variantName}</td>
        <td style="padding:8px; border:1px solid #111; text-align:center;">${item.quantity}</td>
        <td style="padding:8px; border:1px solid #111; text-align:right;">${item.price.toLocaleString('vi-VN')}</td>
        <td style="padding:8px; border:1px solid #111; text-align:right;">${(item.price * item.quantity).toLocaleString('vi-VN')}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${fileBase}.pdf</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; font-size: 14px; }
            .muted { color: #444; }
            .title { text-align: center; font-size: 28px; font-weight: 700; margin: 20px 0 8px; }
            .subtitle { text-align: center; margin: 0 0 16px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            .summary { width: 320px; margin-left: auto; margin-top: 10px; }
            .summary-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #ccc; padding: 6px 0; }
            .summary-total { font-size: 24px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div>
            <div style="font-size: 22px; font-weight: 700;">${distributorName}</div>
            <div class="muted">Địa chỉ: ${distributorAddress}</div>
            <div class="muted">SĐT: ${distributorPhone}</div>
          </div>

          <div class="title">HÓA ĐƠN BÁN HÀNG</div>
          <p class="subtitle muted">Mã đơn: #${order.id.slice(-6).toUpperCase()} - Ngày: ${new Date(order.date).toLocaleString('vi-VN')}</p>

          <table>
            <thead>
              <tr>
                <th style="padding:8px; border:1px solid #111;">Sản phẩm</th>
                <th style="padding:8px; border:1px solid #111;">Phân loại</th>
                <th style="padding:8px; border:1px solid #111;">SL</th>
                <th style="padding:8px; border:1px solid #111;">Giá bán</th>
                <th style="padding:8px; border:1px solid #111;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row"><span>Tạm tính (${totalQty} SP)</span><span>${order.totalAmount.toLocaleString('vi-VN')}</span></div>
            <div class="summary-row summary-total"><span>Tổng cộng</span><span>${order.totalAmount.toLocaleString('vi-VN')}</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };
  const closePos = () => {
    setIsPosOpen(false);
    if (location.pathname === '/pos') {
      navigate('/');
    }
  };

  const handleClearAll = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa TẤT CẢ đơn hàng? Hành động này không thể hoàn tác!')) {
      await db.clearAllOrders();
      refreshData();
    }
  };

  const handleExportAll = () => {
    import('../utils/csvExport').then(async ({ exportToCSV }) => {
      const settings = await db.getShopSettings();
      const filename = buildOrderFilename(settings.orderFilePrefix, 'danh_sach_don_hang', undefined, undefined, false);
      const dataToExport = orders.map(o => ({
        id: o.id,
        date: new Date(o.date).toLocaleString('vi-VN'),
        items: o.items.map(i => `${i.name} x${i.quantity}`).join('; '),
        total: o.totalAmount,
        status: o.status,
        distributor_name: o.distributorName || '',
        distributor_phone: o.distributorPhone || '',
        distributor_address: o.distributorAddress || '',
      }));
      exportToCSV(dataToExport, filename);
    });
  };

  const handleExportAllPDF = () => {
    import('../utils/pdfExport').then(async ({ exportOrdersToPDF }) => {
      const settings = await db.getShopSettings();
      const filename = `${buildOrderFilename(settings.orderFilePrefix, 'danh_sach_don_hang')}.pdf`;
      exportOrdersToPDF(orders, filename);
    });
  };

  return (
    <div className={`${isPosOpen ? 'h-full' : 'space-y-6'} animate-in fade-in duration-500`}>
      {/* List Orders View */}
      {!isPosOpen && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-slate-300">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Quản lý Đơn hàng</h2>
                <p className="text-gray-500 dark:text-slate-300 text-sm">Theo dõi doanh số và lịch sử bán hàng.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleClearAll}
                className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100 shadow-sm"
                title="Xóa tất cả"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={handleExportAllPDF}
                className="bg-orange-50 text-orange-600 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-orange-100 transition-all border border-orange-100 shadow-sm"
                title="Xuất PDF"
              >
                <FileText width={18} />
              </button>
              <button
                onClick={handleExportAll}
                className="bg-blue-50 text-blue-600 px-3 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100 shadow-sm"
                title="Xuất Excel"
              >
                <FileSpreadsheet width={18} />
              </button>
              <button
                onClick={() => { setCart([]); setIsPosOpen(true); setError(null); setCheckoutSuccess(null); }}
                className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-primary-light"
              >
                <Plus size={20} />
                Tạo đơn hàng mới
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300 dark:text-slate-300" size={18} />
                <input
                  type="text"
                  placeholder="Tìm mã đơn hoặc tên sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-400 dark:text-slate-300 dark:text-slate-300 uppercase">
                  <tr>
                    <th className="px-6 py-4">Đơn hàng</th>
                    <th className="px-6 py-4">Ngày bán</th>
                    <th className="px-6 py-4">Sản phẩm</th>
                    <th className="px-6 py-4">Tổng cộng</th>
                    <th className="px-6 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {filteredOrders.map(order => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-mono font-medium text-primary">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-slate-300">{new Date(order.date).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{order.items.map(i => i.name).join(', ')}</td>
                      <td className="px-6 py-4 font-bold">{order.totalAmount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 text-right">
                                                <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPDF(order);
                          }}
                          className="p-2 text-gray-400 dark:text-slate-300 dark:text-slate-300 hover:text-primary"
                        >
                          <Download size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 dark:text-slate-300 dark:text-slate-300 italic">Không tìm thấy đơn hàng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedOrder && (
            <div
              className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <div
                className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-800 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-gray-900 dark:text-slate-100 font-bold">
                      <Eye size={18} />
                      <span>Chi tiet don hang #{selectedOrder.id.slice(-6).toUpperCase()}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-slate-300 mt-1">
                      Ngay ban: {new Date(selectedOrder.date).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 rounded-lg text-gray-400 dark:text-slate-300 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold text-gray-500 dark:text-slate-300 uppercase">
                      <tr>
                        <th className="px-5 py-3 text-left">San pham</th>
                        <th className="px-5 py-3 text-left">Phan loai</th>
                        <th className="px-5 py-3 text-center">SL</th>
                        <th className="px-5 py-3 text-right">Don gia</th>
                        <th className="px-5 py-3 text-right">Thanh tien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={`${item.productId}-${item.variantId}-${idx}`}>
                          <td className="px-5 py-3 font-medium text-gray-800 dark:text-slate-200">{item.name}</td>
                          <td className="px-5 py-3 text-gray-500 dark:text-slate-300">{item.variantName}</td>
                          <td className="px-5 py-3 text-center font-semibold text-gray-700 dark:text-slate-300">{item.quantity}</td>
                          <td className="px-5 py-3 text-right text-gray-700 dark:text-slate-300">{item.price.toLocaleString('vi-VN')} VND</td>
                          <td className="px-5 py-3 text-right font-bold text-gray-900 dark:text-slate-100">
                            {(item.price * item.quantity).toLocaleString('vi-VN')} VND
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-300">
                    Tong {selectedOrder.items.reduce((sum, i) => sum + i.quantity, 0)} san pham
                  </span>
                  <span className="text-lg font-black text-gray-900 dark:text-slate-100">
                    {selectedOrder.totalAmount.toLocaleString('vi-VN')} VND
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* POS UI - Inline Mode (Fullscreen within Layout) */}
      {isPosOpen && (
        <div className="flex flex-col bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 overflow-hidden select-none h-full w-full relative">
          {/* POS Header - Removed shadow for flush look */}
          <header className="h-14 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between px-4 shrink-0 transition-all">
            <div className="flex items-center gap-4 flex-1 mr-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300 dark:text-slate-300" size={16} />
                <input
                  id="pos-search-input"
                  type="text"
                  placeholder="Tìm kiếm theo tên sản phẩm, SKU (F3)..."
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-none pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary text-gray-900 dark:text-slate-100 placeholder-gray-500 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-slate-300">
                <button title="Chế độ nhanh" className="p-2 bg-gray-100 rounded-none hover:bg-gray-200"><Zap size={18} /></button>
                <button title="Danh sách" className="p-2 bg-gray-100 rounded-none hover:bg-gray-200"><Grid size={18} /></button>
                <button className="bg-gray-100 text-gray-700 dark:text-slate-300 px-4 py-1.5 rounded-none flex items-center gap-2 text-sm font-bold hover:bg-gray-200 transition-colors border border-gray-200 dark:border-slate-700">
                  <Table size={16} /> Quản lý bàn
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600 dark:text-slate-300">
              <div className="bg-primary-light text-primary px-4 py-1.5 rounded-none flex items-center gap-2 text-sm font-bold border border-primary/20">
                Mang về 1 <Plus size={14} />
              </div>
              <div className="h-8 w-[1px] bg-gray-300 mx-2"></div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none border border-transparent hover:border-gray-200 dark:border-slate-700 transition-colors"><ChevronRight size={18} className="rotate-180" /></button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none border border-transparent hover:border-gray-200 dark:border-slate-700 transition-colors"><Info size={18} /></button>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-none border border-transparent hover:border-gray-200 dark:border-slate-700 transition-colors"><Table size={18} /></button>
              <button onClick={closePos} className="p-2 hover:bg-red-50 text-red-500 rounded-none border border-transparent hover:border-red-200 transition-colors ml-2"><X size={20} /></button>
            </div>
          </header>

          {/* Main POS Content */}
          <div className="flex flex-1 overflow-hidden relative">
            
            {/* Product Grid */}
            <main className="flex-1 overflow-y-auto p-4 bg-gray-50 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredPosProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="aspect-square bg-white dark:bg-slate-900 rounded-none border border-gray-200 dark:border-slate-700 p-0 flex flex-col justify-between items-center text-center relative group active:scale-95 transition-all overflow-hidden hover:border-primary"
                  >
                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 bg-gray-900/70 px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10">
                      {p.basePrice.toLocaleString()}
                    </div>

                    {/* Stock Badge */}
                    {p.totalStock > 0 && (
                      <div className="absolute top-2 left-2 bg-primary px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10">
                        {p.totalStock}
                      </div>
                    )}

                    {/* Initials / Visual */}
                    <div className="flex-1 w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <span className="text-3xl font-black text-gray-300 group-hover:text-primary transition-colors">
                        {p.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>

                    {/* Name Footer */}
                    <div className="w-full bg-white dark:bg-slate-900 py-2 px-2 border-t border-gray-100 dark:border-slate-800">
                      <p className="text-[12px] font-bold truncate text-gray-700 dark:text-slate-300">{p.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </main>

            {/* Shopping Cart (Right) - Removed shadow for flush look */}
            <aside className="w-[400px] bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-700 flex flex-col shrink-0 z-10 transition-all">
              {/* Customer Search Section */}
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex gap-2 bg-white dark:bg-slate-900">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300 dark:text-slate-300" size={16} />
                  <input
                    className="w-full bg-gray-50 border border-gray-200 dark:border-slate-700 rounded-none pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 outline-none focus:border-primary focus:ring-0 transition-all"
                    placeholder="Tìm tên/số điện thoại khách (ALT+C)"
                  />
                </div>
                <button className="bg-blue-50 text-blue-600 px-3 py-2 rounded-none text-xs font-bold flex items-center gap-1 border border-blue-100 hover:bg-blue-100">
                  <ShoppingCart size={14} /> Mang về
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-4 border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors relative group bg-white dark:bg-slate-900">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 dark:text-slate-300 mt-0.5">{item.variantName}</p>
                        <button className="text-[11px] text-blue-500 italic flex items-center gap-1 mt-2 hover:text-blue-600 transition-colors">
                          <Edit2 size={10} /> Nhập ghi chú
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-none px-2 py-1">
                          <button onClick={() => updateCartQuantity(item.productId, item.variantId, -1)} className="p-1 text-gray-400 dark:text-slate-300 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 dark:text-slate-300 transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-black w-6 text-center text-primary">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.productId, item.variantId, 1)} className="p-1 text-primary hover:opacity-80 transition-colors"><Plus size={12} /></button>
                        </div>
                        <div className="text-right min-w-[85px]">
                          <button
                            onClick={() => openPriceEdit(idx)}
                            className="text-sm font-black text-gray-800 dark:text-slate-200 border-b border-dotted border-gray-300 hover:text-blue-600 hover:border-blue-600 transition-all"
                          >
                            {(item.price * item.quantity).toLocaleString()}
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.productId, item.variantId)} className="p-1 text-gray-400 dark:text-slate-300 dark:text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* POPUP SỬA GIÁ */}
                    {editingCartItemIndex === idx && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setEditingCartItemIndex(null)} />
                        <div className="absolute right-4 top-16 z-[90] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg p-6 w-[350px] animate-in fade-in zoom-in duration-200">
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500 dark:text-slate-300 font-medium">Giá bán kèm</span>
                              <span className="font-bold text-gray-800 dark:text-slate-200">0</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-500 dark:text-slate-300 w-24 font-medium">Giá bán</span>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(Number(e.target.value))}
                                  className="w-full bg-white dark:bg-slate-900 border border-primary rounded-xl px-4 py-3 text-right text-lg font-black text-gray-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
                                  autoFocus
                                />
                                <div className="absolute right-3 bottom-0 text-[10px] text-gray-400 dark:text-slate-300 dark:text-slate-300 font-bold mb-1">VNĐ</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 w-24">
                                <span className="text-sm text-gray-500 dark:text-slate-300 font-medium">Chiết khấu</span>
                                <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200 dark:border-slate-700">
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('vnd')}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded ${discountType === 'vnd' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 dark:text-slate-300'}`}
                                  >VNĐ</button>
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('%')}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded ${discountType === '%' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 dark:text-slate-300'}`}
                                  >%</button>
                                </div>
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={discountValue}
                                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                                  className="w-full bg-gray-50 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-right text-lg font-black text-gray-900 dark:text-slate-100 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/40"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => setEditingCartItemIndex(null)}
                                className="flex-1 bg-gray-100 py-3.5 rounded-xl text-sm font-black text-gray-600 dark:text-slate-300 hover:bg-gray-200 transition-colors border border-gray-200 dark:border-slate-700"
                              >Thiết lập lại</button>
                              <button
                                onClick={applyPriceEdit}
                                className="flex-1 bg-primary py-3.5 rounded-xl text-sm font-black text-white hover:opacity-90 shadow-xl shadow-primary-light active:scale-95 transition-all"
                              >Áp dụng</button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-slate-300 dark:text-slate-300 opacity-80">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart size={40} className="text-gray-300" />
                    </div>
                    <p className="font-bold mt-2 uppercase tracking-widest text-[11px] text-gray-500 dark:text-slate-300">Chưa có sản phẩm</p>
                  </div>
                )}
              </div>

              {/* Cart Summary & Actions Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-500 dark:text-slate-300 font-bold">Tổng {cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-gray-900 dark:text-slate-100">
                      {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
                    </span>
                    <span className="text-[12px] text-gray-500 dark:text-slate-300 font-bold ml-1">VNĐ</span>
                  </div>
                </div>

                {/* Icon Actions Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full bg-gray-50 border border-gray-200 dark:border-slate-700 rounded-none pl-4 pr-10 py-2.5 text-xs text-gray-800 dark:text-slate-200 outline-none placeholder-gray-400 focus:border-primary/40 focus:ring-0"
                      placeholder="Ghi chú đơn hàng..."
                    />
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300 dark:text-slate-300" size={16} />
                  </div>
                  <div className="flex gap-1">
                    {[Tag, Truck, CreditCard, Gift, MoreVertical].map((Icon, idx) => (
                      <button key={idx} className="p-2.5 bg-gray-50 rounded-none text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-0 border border-gray-200 dark:border-slate-700">
                  <button
                    onClick={handleCheckout}
                    className="bg-blue-600 text-white py-3.5 rounded-none font-black text-sm hover:bg-blue-700 flex flex-col items-center justify-center leading-tight active:scale-95 transition-all group border-r border-blue-500"
                  >
                    <span>Lưu đơn</span>
                    <span className="text-[10px] opacity-80 font-medium">(F2)</span>
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="bg-primary text-white py-3.5 rounded-none font-black text-sm hover:opacity-90 flex flex-col items-center justify-center leading-tight active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Thanh toán</span>
                      <span className="text-[10px] opacity-80 font-medium">(F1)</span>
                    </div>
                    <span className="text-[12px] font-black mt-0.5 text-white/90">
                      {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()} VNĐ
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </div>

          {/* Checkout Error UI */}
          {error && (
            <div className="absolute inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-200 rounded-none">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-red-200 w-full max-w-sm text-center shadow-none animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-none flex items-center justify-center mb-4 mx-auto border border-red-100">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-slate-100 mb-2">Không thể thanh toán</h3>
                <p className="text-gray-500 dark:text-slate-300 text-sm mb-6">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-full bg-red-500 text-white py-3.5 rounded-none font-bold hover:bg-red-600 transition-all shadow-none"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          )}

          {checkoutSuccess && (
            <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300 rounded-none">
              <div className="w-24 h-24 bg-primary text-white rounded-none flex items-center justify-center mb-8 shadow-none animate-in zoom-in-50">
                <Check size={56} strokeWidth={4} />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight text-gray-900 dark:text-slate-100">THANH TOÁN XONG!</h2>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-700 w-full max-w-sm mb-12 text-center shadow-none">
                <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">Mã hóa đơn</p>
                <p className="text-2xl font-black font-mono text-primary">#{checkoutSuccess.id.slice(-6).toUpperCase()}</p>
                <div className="h-[1px] bg-gray-100 my-4"></div>
                <p className="text-gray-500 dark:text-slate-300 text-sm mb-2">Tổng thanh toán</p>
                <p className="text-3xl font-black text-gray-900 dark:text-slate-100">{checkoutSuccess.totalAmount.toLocaleString()} VNĐ</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                  onClick={() => handleExportPDF(checkoutSuccess)}
                  className="flex-1 bg-primary text-white py-4 rounded-none font-black shadow-none hover:opacity-90 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <Printer size={24} /> In hóa đơn
                </button>
                <button
                  onClick={() => { setCheckoutSuccess(null); setIsPosOpen(false); if (location.pathname === '/pos') navigate('/'); }}
                  className="flex-1 bg-gray-200 text-gray-800 dark:text-slate-200 py-4 rounded-none font-black hover:bg-gray-300 transition-all text-lg"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          )}

          {/* Variant Selector Backdrop */}
          {selectedProductForCart && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200 rounded-none">
              <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-none border border-gray-100 dark:border-slate-800 shadow-none overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50">
                  <div>
                    <h4 className="font-black text-lg text-gray-900 dark:text-slate-100">{selectedProductForCart.name}</h4>
                    <p className="text-[10px] text-primary uppercase font-black tracking-widest">Chọn phân loại sản phẩm</p>
                  </div>
                  <button onClick={() => setSelectedProductForCart(null)} className="p-2 hover:bg-gray-200 text-gray-500 dark:text-slate-300 rounded-none transition-colors"><X size={20} /></button>
                </div>
                <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                  {selectedProductForCart.variants.map(v => (
                    <button
                      key={v.id}
                      disabled={v.stock === 0}
                      onClick={() => addToCart(selectedProductForCart, v)}
                      className={`w-full flex justify-between items-center p-4 rounded-none mb-2 transition-all border ${v.stock > 0 ? 'bg-gray-50 border-gray-100 dark:border-slate-800 hover:bg-primary-light hover:border-primary/20 text-gray-800 dark:text-slate-200 active:scale-95' : 'opacity-50 bg-gray-50 border-gray-100 dark:border-slate-800 cursor-not-allowed'}`}
                    >
                      <div className="text-left">
                        <p className={`font-bold text-sm ${v.stock === 0 ? 'text-gray-400 dark:text-slate-300 dark:text-slate-300' : 'text-gray-900 dark:text-slate-100'}`}>{v.name}</p>
                        <p className={`text-[10px] font-black mt-1 uppercase tracking-tighter ${v.stock === 0 ? 'text-gray-400 dark:text-slate-300 dark:text-slate-300' : 'text-gray-500 dark:text-slate-300'}`}>Tồn kho: {v.stock}</p>
                      </div>
                      <div className="text-right">
                        <span className={`font-black ${v.stock === 0 ? 'text-gray-400 dark:text-slate-300 dark:text-slate-300' : 'text-primary'}`}>{v.price.toLocaleString()}đ</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;


