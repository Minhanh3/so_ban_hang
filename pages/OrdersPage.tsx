
import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Plus, Calendar, Eye, Trash2, ArrowLeft, Package, CheckCircle2, Clock, ShoppingCart, Minus, ChevronRight, AlertCircle, Printer, Download, Check, Zap, Table, Grid, Info, X, Tag, Truck, Gift, MoreVertical, CreditCard, Edit2, Image as ImageIcon } from 'lucide-react';
import { db } from '../services/storage';
import { Order, OrderItem, Product, ProductVariant } from '../types';
import { Link, useLocation, useNavigate } from "react-router-dom";

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isPosOpen, setIsPosOpen] = useState(false);
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
    // Auto-open POS if on /pos route
    if (location.pathname === '/pos') {
      setIsPosOpen(true);
    }
  }, [statusFilter, location.pathname]);

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
    p.name.toLowerCase().includes(posSearch.toLowerCase())
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
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      status: 'completed',
      date: new Date().toISOString(),
      items: [...cart],
      totalAmount
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

  const handleExportPDF = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.name}<br/><small>${item.variantName}</small></td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${item.price.toLocaleString()}đ</td>
        <td style="text-align: right;">${(item.price * item.quantity).toLocaleString()}đ</td>
      </tr>
    `).join('');
    printWindow.document.write(`<html><head><title>Hóa đơn #${order.id}</title></head><body><h1>SỔ BÁN HÀNG</h1><p>Mã hóa đơn: #${order.id.slice(-6).toUpperCase()}</p><table style="width:100%">${itemsHtml}</table><h2 style="text-align:right">Tổng: ${order.totalAmount.toLocaleString()}đ</h2></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const closePos = () => {
    setIsPosOpen(false);
    if (location.pathname === '/pos') {
      navigate('/');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* List Orders View */}
      {!isPosOpen && (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Quản lý Đơn hàng</h2>
                <p className="text-gray-500 text-sm">Theo dõi doanh số và lịch sử bán hàng.</p>
              </div>
            </div>
            <button
              onClick={() => { setCart([]); setIsPosOpen(true); setError(null); setCheckoutSuccess(null); }}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-all shadow-lg shadow-green-100"
            >
              <Plus size={20} />
              Tạo đơn hàng mới
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tìm mã đơn hoặc tên sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
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
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-medium text-green-600">#{order.id.slice(-6).toUpperCase()}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(order.date).toLocaleString('vi-VN')}</td>
                      <td className="px-6 py-4 truncate max-w-[200px]">{order.items.map(i => i.name).join(', ')}</td>
                      <td className="px-6 py-4 font-bold">{order.totalAmount.toLocaleString()}đ</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleExportPDF(order)} className="p-2 text-gray-400 hover:text-green-600"><Download size={18} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 italic">Không tìm thấy đơn hàng nào.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* POS Modal - Full Screen Dark Mode */}
      {isPosOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#121212] text-white overflow-hidden select-none">
          {/* POS Header */}
          <header className="h-14 bg-[#10b981] flex items-center justify-between px-4 shrink-0 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70" size={16} />
                <input
                  id="pos-search-input"
                  type="text"
                  placeholder="Tìm tên sản phẩm, mã SKU (F3)"
                  value={posSearch}
                  onChange={(e) => setPosSearch(e.target.value)}
                  className="bg-black/20 border-none rounded-lg pl-9 pr-4 py-1.5 text-sm w-72 focus:ring-2 focus:ring-white/30 text-white placeholder-white/50 outline-none"
                />
              </div>
              <div className="flex items-center gap-1">
                <button title="Chế độ nhanh" className="p-2 bg-black/10 rounded-lg hover:bg-black/20"><Zap size={18} /></button>
                <button title="Danh sách" className="p-2 bg-black/10 rounded-lg hover:bg-black/20"><Grid size={18} /></button>
                <button className="bg-black/10 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold hover:bg-black/20 transition-colors">
                  <Table size={16} /> Quản lý bàn
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-black/80 px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-bold shadow-inner">
                Mang về 1 <Plus size={14} />
              </div>
              <div className="h-8 w-[1px] bg-white/20 mx-2"></div>
              <button className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight size={18} className="rotate-180" /></button>
              <button className="p-2 hover:bg-white/10 rounded-lg"><Info size={18} /></button>
              <button className="p-2 hover:bg-white/10 rounded-lg"><Table size={18} /></button>
              <button onClick={closePos} className="p-2 hover:bg-red-500 rounded-lg transition-colors ml-2"><X size={20} /></button>
            </div>
          </header>

          {/* Main POS Content */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Categories */}
            <aside className="w-44 border-r border-[#262626] flex flex-col shrink-0 bg-[#1a1a1a]">
              <button className="px-4 py-4 text-left font-bold text-sm bg-white/5 border-l-4 border-[#10b981] text-[#10b981]">Tất cả</button>
              <button className="px-4 py-4 text-left text-sm text-gray-400 hover:bg-white/5 transition-colors">Đồ uống</button>
              <button className="px-4 py-4 text-left text-sm text-gray-400 hover:bg-white/5 transition-colors">Thức ăn</button>
            </aside>

            {/* Product Grid */}
            <main className="flex-1 overflow-y-auto p-4 bg-[#121212] custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {filteredPosProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="aspect-square bg-[#262626] rounded-lg border border-[#333] p-0 flex flex-col justify-between items-center text-center relative group active:scale-95 transition-all overflow-hidden hover:border-[#10b981]/50"
                  >
                    {/* Price Badge */}
                    <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] font-bold text-white z-10">
                      {p.basePrice.toLocaleString()}
                    </div>

                    {/* Stock Badge */}
                    {p.totalStock > 0 && (
                      <div className="absolute top-2 left-2 bg-[#10b981] px-1.5 py-0.5 rounded text-[10px] font-bold z-10">
                        {p.totalStock}
                      </div>
                    )}

                    {/* Initials / Visual */}
                    <div className="flex-1 w-full flex items-center justify-center bg-gradient-to-br from-[#333] to-[#222]">
                      <span className="text-3xl font-black text-[#10b981] opacity-30 group-hover:opacity-100 transition-opacity">
                        {p.name.split(' ').map(s => s[0]).join('').toUpperCase().slice(0, 2)}
                      </span>
                    </div>

                    {/* Name Footer */}
                    <div className="w-full bg-[#1a1a1a] py-2 px-2 border-t border-[#333]">
                      <p className="text-[12px] font-bold truncate text-gray-200">{p.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </main>

            {/* Shopping Cart (Right) */}
            <aside className="w-[400px] bg-[#1a1a1a] border-l border-[#262626] flex flex-col shrink-0 shadow-2xl z-10">
              {/* Customer Search Section */}
              <div className="p-4 border-b border-[#262626] flex gap-2 bg-[#1a1a1a]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input
                    className="w-full bg-[#262626] border border-[#333] rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-[#10b981]/50 transition-colors"
                    placeholder="Tìm tên/số điện thoại khách (ALT+C)"
                  />
                </div>
                <button className="bg-blue-600/10 text-[#3b82f6] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-[#3b82f6]/20 hover:bg-blue-600/20">
                  <ShoppingCart size={14} /> Mang về
                </button>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {cart.map((item, idx) => (
                  <div key={idx} className="p-4 border-b border-[#262626] hover:bg-white/5 transition-colors relative group">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-gray-100 truncate">{item.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{item.variantName}</p>
                        <button className="text-[11px] text-[#3b82f6] italic flex items-center gap-1 mt-2 hover:text-blue-400 transition-colors">
                          <Edit2 size={10} /> Nhập ghi chú
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-[#262626] border border-[#333] rounded-lg px-2 py-1 shadow-sm">
                          <button onClick={() => updateCartQuantity(item.productId, item.variantId, -1)} className="p-1 text-gray-500 hover:text-white transition-colors"><Minus size={12} /></button>
                          <span className="text-sm font-black w-6 text-center text-[#10b981]">{item.quantity}</span>
                          <button onClick={() => updateCartQuantity(item.productId, item.variantId, 1)} className="p-1 text-[#10b981] hover:text-green-400 transition-colors"><Plus size={12} /></button>
                        </div>
                        <div className="text-right min-w-[85px]">
                          <button
                            onClick={() => openPriceEdit(idx)}
                            className="text-sm font-black text-gray-100 border-b border-dotted border-gray-600 hover:text-[#3b82f6] hover:border-[#3b82f6] transition-all"
                          >
                            {(item.price * item.quantity).toLocaleString()}
                          </button>
                        </div>
                        <button onClick={() => removeFromCart(item.productId, item.variantId)} className="p-1 text-gray-600 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* POPUP SỬA GIÁ (Giống hệt hình ảnh mô tả) */}
                    {editingCartItemIndex === idx && (
                      <>
                        <div className="fixed inset-0 z-[80]" onClick={() => setEditingCartItemIndex(null)} />
                        <div className="absolute right-4 top-16 z-[90] bg-[#1a1a1a] border border-[#333] rounded-2xl shadow-2xl p-6 w-[350px] animate-in fade-in zoom-in duration-200">
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-400 font-medium">Giá bán kèm</span>
                              <span className="font-bold text-gray-200">0</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-gray-400 w-24 font-medium">Giá bán</span>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={tempPrice}
                                  onChange={(e) => setTempPrice(Number(e.target.value))}
                                  className="w-full bg-transparent border border-[#10b981] rounded-xl px-4 py-3 text-right text-lg font-black text-white outline-none focus:ring-2 focus:ring-[#10b981]/20"
                                  autoFocus
                                />
                                <div className="absolute right-3 bottom-0 text-[10px] text-gray-500 font-bold mb-1">VNĐ</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 w-24">
                                <span className="text-sm text-gray-400 font-medium">Chiết khấu</span>
                                <div className="flex bg-[#262626] rounded-lg p-0.5 border border-[#333]">
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('vnd')}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded ${discountType === 'vnd' ? 'bg-[#10b981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                  >VNĐ</button>
                                  <button
                                    type="button"
                                    onClick={() => setDiscountType('%')}
                                    className={`px-2 py-0.5 text-[9px] font-black rounded ${discountType === '%' ? 'bg-[#10b981] text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                                  >%</button>
                                </div>
                              </div>
                              <div className="flex-1 relative">
                                <input
                                  type="number"
                                  value={discountValue}
                                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                                  className="w-full bg-[#262626] border border-[#333] rounded-xl px-4 py-3 text-right text-lg font-black text-white outline-none focus:border-gray-500"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => setEditingCartItemIndex(null)}
                                className="flex-1 bg-[#262626] py-3.5 rounded-xl text-sm font-black text-gray-400 hover:bg-[#333] transition-colors border border-[#333]"
                              >Thiết lập lại</button>
                              <button
                                onClick={applyPriceEdit}
                                className="flex-1 bg-[#10b981] py-3.5 rounded-xl text-sm font-black text-white hover:bg-[#0e9f6e] shadow-lg shadow-[#10b981]/20 active:scale-95 transition-all"
                              >Áp dụng</button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-gray-600 opacity-25">
                    <div className="w-20 h-20 bg-[#262626] rounded-full flex items-center justify-center mb-4">
                      <ShoppingCart size={40} />
                    </div>
                    <p className="font-black mt-2 uppercase tracking-widest text-[11px]">Chưa có sản phẩm</p>
                  </div>
                )}
              </div>

              {/* Cart Summary & Actions Footer */}
              <div className="p-4 border-t border-[#262626] bg-[#1a1a1a] space-y-4 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-gray-400 font-bold">Tổng {cart.reduce((s, i) => s + i.quantity, 0)} sản phẩm</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">
                      {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
                    </span>
                    <span className="text-[12px] text-gray-500 font-bold ml-1">VNĐ</span>
                  </div>
                </div>

                {/* Icon Actions Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      className="w-full bg-[#262626] border border-[#333] rounded-xl pl-4 pr-10 py-2.5 text-xs text-white outline-none placeholder-gray-600 focus:border-gray-500"
                      placeholder="Ghi chú đơn hàng..."
                    />
                    <ImageIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={16} />
                  </div>
                  <div className="flex gap-1">
                    {[Tag, Truck, CreditCard, Gift, MoreVertical].map((Icon, idx) => (
                      <button key={idx} className="p-2.5 bg-[#262626] rounded-xl text-gray-500 hover:text-white border border-[#333] hover:bg-[#333] transition-colors">
                        <Icon size={18} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCheckout}
                    className="bg-[#2563eb] text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-blue-700 flex flex-col items-center justify-center leading-tight active:scale-95 transition-all group"
                  >
                    <span>Lưu đơn</span>
                    <span className="text-[10px] opacity-60 font-medium">(F2)</span>
                  </button>
                  <button
                    onClick={handleCheckout}
                    className="bg-[#10b981] text-white py-3.5 rounded-2xl font-black text-sm shadow-xl shadow-green-900/10 hover:bg-[#0e9f6e] flex flex-col items-center justify-center leading-tight active:scale-95 transition-all"
                  >
                    <div className="flex items-center gap-1">
                      <span>Thanh toán</span>
                      <span className="text-[10px] opacity-60 font-medium">(F1)</span>
                    </div>
                    <span className="text-[12px] font-black mt-0.5">
                      {cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()} VNĐ
                    </span>
                  </button>
                </div>
              </div>
            </aside>
          </div>


          {/* Checkout Success UI */}
          {error && (
            <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-8 animate-in fade-in duration-200">
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-red-500/50 w-full max-w-sm text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-bouncer">
                <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto border border-red-500/50">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Không thể thanh toán</h3>
                <p className="text-gray-400 text-sm mb-6">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-black hover:bg-red-600 transition-all"
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          )}

          {checkoutSuccess && (
            <div className="fixed inset-0 z-[200] bg-[#121212] flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
              <div className="w-24 h-24 bg-[#10b981] text-white rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.3)] animate-bounce">
                <Check size={56} strokeWidth={4} />
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">THANH TOÁN XONG!</h2>
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-[#262626] w-full max-w-sm mb-12 text-center">
                <p className="text-gray-400 text-sm mb-2">Mã hóa đơn</p>
                <p className="text-2xl font-black font-mono text-[#10b981]">#{checkoutSuccess.id.slice(-6).toUpperCase()}</p>
                <div className="h-[1px] bg-[#262626] my-4"></div>
                <p className="text-gray-400 text-sm mb-2">Tổng thanh toán</p>
                <p className="text-3xl font-black text-white">{checkoutSuccess.totalAmount.toLocaleString()} VNĐ</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <button
                  onClick={() => handleExportPDF(checkoutSuccess)}
                  className="flex-1 bg-[#10b981] text-white py-5 rounded-2xl font-black shadow-xl shadow-green-900/20 hover:bg-green-700 transition-all flex items-center justify-center gap-3 text-lg"
                >
                  <Printer size={24} /> In hóa đơn
                </button>
                <button
                  onClick={() => { setCheckoutSuccess(null); setIsPosOpen(false); if (location.pathname === '/pos') navigate('/'); }}
                  className="flex-1 bg-[#262626] text-white py-5 rounded-2xl font-black hover:bg-[#333] transition-all text-lg"
                >
                  Đóng cửa sổ
                </button>
              </div>
            </div>
          )}

          {/* Variant Selector Backdrop */}
          {selectedProductForCart && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
              <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl border border-[#333] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in duration-200">
                <div className="p-5 border-b border-[#333] flex justify-between items-center bg-[#262626]">
                  <div>
                    <h4 className="font-black text-lg text-white">{selectedProductForCart.name}</h4>
                    <p className="text-[10px] text-[#10b981] uppercase font-black tracking-widest">Chọn phân loại sản phẩm</p>
                  </div>
                  <button onClick={() => setSelectedProductForCart(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  {selectedProductForCart.variants.map(v => (
                    <button
                      key={v.id}
                      disabled={v.stock === 0}
                      onClick={() => addToCart(selectedProductForCart, v)}
                      className={`w-full flex justify-between items-center p-4 rounded-2xl mb-2 transition-all border border-transparent ${v.stock > 0 ? 'bg-[#262626] hover:bg-[#333] hover:border-[#10b981]/30 text-white active:scale-95' : 'opacity-40 grayscale cursor-not-allowed'}`}
                    >
                      <div className="text-left">
                        <p className="font-bold text-sm">{v.name}</p>
                        <p className="text-[10px] text-gray-500 font-black mt-1 uppercase tracking-tighter">Tồn kho: {v.stock}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#10b981]">{v.price.toLocaleString()}đ</span>
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
