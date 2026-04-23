
import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Package, ClipboardList, Search,
  ChevronDown, CheckCircle, X, History, ShoppingCart, Building2
} from 'lucide-react';
import { db } from '../services/storage';
import { Product, ImportItem, ImportReceipt } from '../types';

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function parsePositiveInteger(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(1, Math.floor(parsed));
}

function parseNonNegativeNumber(value: string): number | null {
  if (value.trim() === '') {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return Math.max(0, parsed);
}

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const Badge = ({ children, color = 'slate' }: { children: React.ReactNode; color?: string }) => {
  const colors: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    slate: 'bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${colors[color] || colors.slate}`}>
      {children}
    </span>
  );
};

// â”€â”€â”€ Product Picker Row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface PickerRowProps {
  products: Product[];
  item: ImportItem;
  onUpdate: (item: ImportItem) => void;
  onRemove: () => void;
}

const ProductPickerRow: React.FC<PickerRowProps> = ({ products, item, onUpdate, onRemove }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(!item.productId);
  const [quantityInput, setQuantityInput] = useState(item.quantity > 0 ? String(item.quantity) : '');
  const [costPriceInput, setCostPriceInput] = useState(item.costPrice > 0 ? String(item.costPrice) : '');

  useEffect(() => {
    setQuantityInput(item.quantity > 0 ? String(item.quantity) : '');
  }, [item.quantity]);

  useEffect(() => {
    setCostPriceInput(item.costPrice > 0 ? String(item.costPrice) : '');
  }, [item.costPrice]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === item.productId);

  const selectProduct = (p: Product) => {
    const firstVariant = p.variants[0];
    onUpdate({
      ...item,
      productId: p.id,
      productName: p.name,
      variantId: firstVariant?.id,
      variantName: firstVariant?.name,
      costPrice: p.costPrice || p.basePrice || 0,
    });
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm">
      {/* Product selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Package size={16} className="text-slate-400 dark:text-slate-300 shrink-0" />
            <span className="truncate">{selectedProduct ? selectedProduct.name : 'Chọn sản phẩmâ€¦'}</span>
          </div>
          <ChevronDown size={16} className={`text-slate-400 dark:text-slate-300 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-300" />
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm sản phẩmâ€¦"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-primary"
                />
              </div>
            </div>
            <ul className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-slate-400 dark:text-slate-300 text-center">Không tìm thấy</li>
              )}
              {filtered.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => selectProduct(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800 flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary">{p.name}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-300 font-bold">Tồn: {p.totalStock} {p.unit || 'món'}</p>
                    </div>
                    {p.id === item.productId && <CheckCircle size={16} className="text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Variant selector (if product has variants) */}
      {selectedProduct && selectedProduct.variants.length > 0 && (
        <div>
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Phân loại</label>
          <select
            value={item.variantId || ''}
            onChange={e => {
              const v = selectedProduct.variants.find(vv => vv.id === e.target.value);
              onUpdate({ ...item, variantId: v?.id, variantName: v?.name });
            }}
            className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-primary"
          >
            {selectedProduct.variants.map(v => (
              <option key={v.id} value={v.id}>{v.name} (tồn: {v.stock})</option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity + Cost price row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Số lượng nhập</label>
          <input
            type="number"
            min={1}
            value={quantityInput}
            onChange={e => {
              const nextValue = e.target.value;
              setQuantityInput(nextValue);

              const parsed = parsePositiveInteger(nextValue);
              if (parsed !== null) {
                onUpdate({ ...item, quantity: parsed });
              }
            }}
            onBlur={() => {
              const normalized = parsePositiveInteger(quantityInput) ?? Math.max(1, item.quantity || 1);
              setQuantityInput(String(normalized));
              if (normalized !== item.quantity) {
                onUpdate({ ...item, quantity: normalized });
              }
            }}
            placeholder="0"
            className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary text-center"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Giá nhập (đ)</label>
          <input
            type="number"
            min={0}
            value={costPriceInput}
            onChange={e => {
              const nextValue = e.target.value;
              setCostPriceInput(nextValue);

              const parsed = parseNonNegativeNumber(nextValue);
              if (parsed !== null) {
                onUpdate({ ...item, costPrice: parsed });
              }
            }}
            onBlur={() => {
              const normalized = parseNonNegativeNumber(costPriceInput) ?? Math.max(0, item.costPrice || 0);
              setCostPriceInput(normalized > 0 ? String(normalized) : '');
              if (normalized !== item.costPrice) {
                onUpdate({ ...item, costPrice: normalized });
              }
            }}
            placeholder="0"
            className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary text-right"
          />
        </div>
      </div>

      {/* Row footer: subtotal + remove */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs text-slate-400 dark:text-slate-300 font-bold">
          Thành tiền: <span className="text-slate-700 dark:text-slate-300">{formatVND(item.quantity * item.costPrice)}</span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

// â”€â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type Tab = 'create' | 'history';

const ImportPage: React.FC = () => {
  const [tab, setTab] = useState<Tab>('create');
  const [products, setProducts] = useState<Product[]>([]);
  const [receipts, setReceipts] = useState<ImportReceipt[]>([]);

  // Form state
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<ImportItem[]>([]);
  // Import date & time â€” defaults to now
  const [importDate, setImportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [importTime, setImportTime] = useState(() => new Date().toTimeString().slice(0, 5));

  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const loadData = useCallback(async () => {
    const [p, r] = await Promise.all([db.getProducts(), db.getImports()]);
    setProducts(p);
    setReceipts(r);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const addRow = () => {
    setItems(prev => {
      const hasPendingRow = prev.some(it => !it.productId);
      if (hasPendingRow) return prev;
      return [...prev, {
        productId: '',
        productName: '',
        quantity: 1,
        costPrice: 0,
      }];
    });
  };

  const updateRow = (idx: number, updated: ImportItem) => {
    setItems(prev => prev.map((it, i) => i === idx ? updated : it));
  };

  const removeRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalCost = items.reduce((sum, it) => sum + it.quantity * it.costPrice, 0);
  const hasPendingRow = items.some(it => !it.productId);

  const resetForm = () => {
    setSupplierName('');
    setNote('');
    setItems([]);
    setImportDate(new Date().toISOString().slice(0, 10));
    setImportTime(new Date().toTimeString().slice(0, 5));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(it => it.productId && it.quantity > 0);
    if (validItems.length === 0) return;

    setSaving(true);
    // Combine date + time into ISO string
    const combinedISO = new Date(`${importDate}T${importTime}:00`).toISOString();

    const receipt: ImportReceipt = {
      id: genId('imp'),
      supplierName: supplierName.trim() || 'Không rõ',
      note: note.trim(),
      items: validItems,
      totalCost,
      date: combinedISO,
    };

    const result = await db.addImport(receipt);
    setSaving(false);

    if (result.success) {
      setSavedMsg('Nhập hàng thành công! Tồn kho đã được cập nhật.');
      setTimeout(() => setSavedMsg(''), 3500);
      resetForm();
      loadData();
      setTab('history');
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Nhập hàng</h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm font-medium mt-1">Tạo phiếu nhập kho và cập nhật tồn hàng tự động.</p>
        </div>
      </div>

      {/* Success toast */}
      {savedMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl px-5 py-3.5 font-bold text-sm shadow-sm">
          <CheckCircle size={18} className="shrink-0" />
          {savedMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {([['create', <ShoppingCart size={16} />, 'Tạo phiếu nhập'], ['history', <History size={16} />, 'Lịch sử nhập']] as const).map(
          ([key, icon, label]) => (
            <button
              key={key}
              onClick={() => setTab(key as Tab)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                tab === key
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
                  : 'text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-200 dark:text-slate-300'
              }`}
            >
              {icon}{label}
            </button>
          )
        )}
      </div>

      {/* â”€â”€ TAB: Create â”€â”€ */}
      {tab === 'create' && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left â€” product rows */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Danh sách sản phẩm nhập</h2>
              <button
                type="button"
                onClick={addRow}
                disabled={hasPendingRow}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
                title={hasPendingRow ? 'Hay chon san pham cho dong hien tai truoc.' : ''}
              >
                <Plus size={16} /> Thêm sản phẩm
              </button>
            </div>

            {items.length === 0 && (
              <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl py-16 flex flex-col items-center text-slate-300 dark:text-slate-300 gap-3">
                <Package size={40} />
                <p className="text-sm font-bold">Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm".</p>
              </div>
            )}

            {items.map((item, idx) => (
              <ProductPickerRow
                key={idx}
                products={products}
                item={item}
                onUpdate={updated => updateRow(idx, updated)}
                onRemove={() => removeRow(idx)}
              />
            ))}
          </div>

          {/* Right â€” receipt info + summary */}
          <div className="space-y-4">
            {/* Supplier & note card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-primary" /> Thông tin phiếu
              </h3>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Nhà cung cấp</label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={e => setSupplierName(e.target.value)}
                  placeholder="Tên nhà cung cấp (tuỳ chọn)"
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Ngày nhập</label>
                <input
                  type="date"
                  value={importDate}
                  onChange={e => setImportDate(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Giờ nhập</label>
                <input
                  type="time"
                  value={importTime}
                  onChange={e => setImportTime(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-wider">Ghi chú</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ghi chú thêmâ€¦"
                  rows={2}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            {/* Summary card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList size={16} className="text-primary" /> Tóm tắt
              </h3>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-300 font-bold">Số mặt hàng</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{items.filter(i => i.productId).length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-300 font-bold">Tổng số lượng</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <span className="text-slate-700 dark:text-slate-300 font-black">Tổng tiền nhập</span>
                <span className="text-xl font-black text-primary">{formatVND(totalCost)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || items.filter(i => i.productId).length === 0}
              className="w-full py-3.5 bg-primary text-white rounded-2xl font-black text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? 'Đang lưuâ€¦' : <><CheckCircle size={18} /> Xác nhận nhập hàng</>}
            </button>
          </div>
        </form>
      )}

      {/* â”€â”€ TAB: History â”€â”€ */}
      {tab === 'history' && (
        <div className="space-y-4">
          {receipts.length === 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-20 flex flex-col items-center text-slate-300 dark:text-slate-300 gap-3 shadow-sm">
              <History size={40} />
              <p className="text-sm font-bold">Chưa có phiếu nhập nào.</p>
            </div>
          )}

          {receipts.map(r => {
            const { date, time } = formatDateTime(r.date);
            return (
              <div key={r.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Receipt header */}
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center text-primary">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="font-black text-slate-800 dark:text-slate-200">{r.supplierName}</p>
                      {r.note && <p className="text-xs text-slate-400 dark:text-slate-300 font-bold italic">{r.note}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {/* Date badge */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">Ngày</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{date}</span>
                    </div>
                    {/* Time badge */}
                    <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">Giờ</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">{time}</span>
                    </div>
                    <span className="text-lg font-black text-primary">{formatVND(r.totalCost)}</span>
                  </div>
                </div>

                {/* Receipt items */}
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest">
                      <th className="px-6 py-3 text-left">Sản phẩm</th>
                      <th className="px-4 py-3 text-center">SL</th>
                      <th className="px-4 py-3 text-right">Giá nhập</th>
                      <th className="px-6 py-3 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {r.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800 dark:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-bold text-slate-800 dark:text-slate-200">{it.productName}</p>
                          {it.variantName && (
                            <Badge color="slate">{it.variantName}</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-black text-slate-700 dark:text-slate-300">{it.quantity}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-600 dark:text-slate-300">{formatVND(it.costPrice)}</td>
                        <td className="px-6 py-3 text-right font-black text-slate-800 dark:text-slate-200">{formatVND(it.quantity * it.costPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 dark:bg-slate-800/60">
                      <td colSpan={3} className="px-6 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-wider">Tổng cộng</td>
                      <td className="px-6 py-3 text-right font-black text-primary">{formatVND(r.totalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImportPage;


