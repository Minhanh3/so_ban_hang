
import { Order, Product, Debt, ImportReceipt, ShopSettings, StockLog, StockChangeReason } from '../types';
import { getCurrentUserId, getScopedStorageKey, LEGACY_STORAGE_OWNER_KEY } from './auth';

// ─── Storage Keys ───────────────────────────────────────────────────────────
const KEYS = {
  PRODUCTS:   'sbh_products',
  ORDERS:     'sbh_orders',
  DEBTS:      'sbh_debts',
  IMPORTS:    'sbh_imports',
  STOCK_LOGS: 'sbh_stock_logs',
  SHOP_SETTINGS: 'sbh_shop_settings',
} as const;

const DEFAULT_SETTINGS: ShopSettings = {
  distributor: {
    name: '',
    phone: '',
    address: '',
  },
  orderFilePrefix: '',
};

type StorageKey = typeof KEYS[keyof typeof KEYS];

const STORAGE_KEYS: StorageKey[] = Object.values(KEYS);

function hasStoredValue(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

function getLegacyOwnerId(): string | null {
  return localStorage.getItem(LEGACY_STORAGE_OWNER_KEY);
}

function ensureLegacyMigration(userId: string): void {
  const ownerId = getLegacyOwnerId();
  if (ownerId && ownerId !== userId) {
    return;
  }

  const hasLegacyData = STORAGE_KEYS.some((key) => hasStoredValue(key));
  if (!hasLegacyData) {
    return;
  }

  for (const legacyKey of STORAGE_KEYS) {
    const scopedKey = getScopedStorageKey(legacyKey, userId);
    if (!hasStoredValue(scopedKey) && hasStoredValue(legacyKey)) {
      const legacyValue = localStorage.getItem(legacyKey);
      if (legacyValue !== null) {
        localStorage.setItem(scopedKey, legacyValue);
      }
    }
  }

  if (!ownerId) {
    localStorage.setItem(LEGACY_STORAGE_OWNER_KEY, userId);
  }
}

function resolveStorageKey(baseKey: string): string {
  const userId = getCurrentUserId();
  if (!userId) {
    return baseKey;
  }

  ensureLegacyMigration(userId);
  return getScopedStorageKey(baseKey, userId);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(resolveStorageKey(key));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]): void {
  localStorage.setItem(resolveStorageKey(key), JSON.stringify(data));
}

function loadObject<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(resolveStorageKey(key));
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Push one or more stock log entries
function pushStockLogs(entries: Omit<StockLog, 'id' | 'date'>[], dateISO?: string): void {
  const logs = load<StockLog>(KEYS.STOCK_LOGS);
  const now = dateISO || new Date().toISOString();
  for (const entry of entries) {
    logs.unshift({
      ...entry,
      id: genId('log'),
      date: now,
    });
  }
  save(KEYS.STOCK_LOGS, logs);
}

// ─── DB Object ────────────────────────────────────────────────────────────────
export const db = {
  async connect(): Promise<void> {
    return Promise.resolve();
  },

  // ── PRODUCTS ──────────────────────────────────────────────────────────────
  async getProducts(): Promise<Product[]> {
    return load<Product>(KEYS.PRODUCTS);
  },

  async addProduct(product: Product): Promise<void> {
    const list = load<Product>(KEYS.PRODUCTS);
    const newProduct: Product = {
      ...product,
      id: product.id || genId('prod'),
    };
    list.push(newProduct);
    save(KEYS.PRODUCTS, list);

    // Log initial stock if > 0
    if (newProduct.totalStock > 0) {
      if (newProduct.variants.length === 0) {
        pushStockLogs([{
          productId: newProduct.id,
          productName: newProduct.name,
          oldStock: 0,
          newStock: newProduct.totalStock,
          change: newProduct.totalStock,
          reason: 'manual_edit',
          note: 'Tạo sản phẩm mới',
        }]);
      } else {
        pushStockLogs(newProduct.variants.filter(v => v.stock > 0).map(v => ({
          productId: newProduct.id,
          productName: newProduct.name,
          variantId: v.id,
          variantName: v.name,
          oldStock: 0,
          newStock: v.stock,
          change: v.stock,
          reason: 'manual_edit' as StockChangeReason,
          note: 'Tạo sản phẩm mới',
        })));
      }
    }
  },

  async updateProduct(product: Product): Promise<void> {
    const list = load<Product>(KEYS.PRODUCTS);
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx === -1) return;

    const old = list[idx];
    list[idx] = product;
    save(KEYS.PRODUCTS, list);

    // ── Auto-log stock changes ─────────────────────────────────────────────
    const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];

    if (product.variants.length === 0) {
      // Simple product — compare totalStock
      if (old.totalStock !== product.totalStock) {
        logEntries.push({
          productId: product.id,
          productName: product.name,
          oldStock: old.totalStock,
          newStock: product.totalStock,
          change: product.totalStock - old.totalStock,
          reason: 'manual_edit',
          note: 'Chỉnh sửa thủ công',
        });
      }
    } else {
      // Variant product — compare each variant's stock
      for (const newV of product.variants) {
        const oldV = old.variants.find((v) => v.id === newV.id);
        const oldStock = oldV?.stock ?? 0;
        if (oldStock !== newV.stock) {
          logEntries.push({
            productId: product.id,
            productName: product.name,
            variantId: newV.id,
            variantName: newV.name,
            oldStock,
            newStock: newV.stock,
            change: newV.stock - oldStock,
            reason: 'manual_edit',
            note: 'Chỉnh sửa thủ công',
          });
        }
      }
    }

    if (logEntries.length > 0) {
      pushStockLogs(logEntries);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    const list = load<Product>(KEYS.PRODUCTS).filter((p) => p.id !== id);
    save(KEYS.PRODUCTS, list);
  },

  async clearAllProducts(): Promise<void> {
    save(KEYS.PRODUCTS, []);
  },

  // ── ORDERS ────────────────────────────────────────────────────────────────
  async getOrders(): Promise<Order[]> {
    return load<Order>(KEYS.ORDERS);
  },

  async createOrder(order: Order): Promise<{ success: boolean; message?: string }> {
    const products = await this.getProducts();

    // Stock validation
    for (const item of order.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product) {
        if (product.variants.length === 0) {
          if (product.totalStock < item.quantity) {
            return { success: false, message: `Sản phẩm "${item.name}" không đủ tồn kho.` };
          }
        } else {
          const variant = product.variants.find((v) => v.id === item.variantId);
          if (!variant || variant.stock < item.quantity) {
            return {
              success: false,
              message: `Sản phẩm "${item.name}" (${item.variantName}) không đủ tồn kho.`,
            };
          }
        }
      }
    }

    // Save order
    const newOrder: Order = {
      ...order,
      id: order.id || genId('ord'),
      date: order.date || new Date().toISOString(),
      status: 'completed',
    };
    const orders = load<Order>(KEYS.ORDERS);
    orders.unshift(newOrder);
    save(KEYS.ORDERS, orders);

    // Deduct stock + log
    const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];
    const updatedProducts = products.map((p) => {
      const affectedItems = order.items.filter((i) => i.productId === p.id);
      if (affectedItems.length === 0) return p;

      if (p.variants.length === 0) {
        const totalQty = affectedItems.reduce((sum, i) => sum + i.quantity, 0);
        const newStock = Math.max(0, p.totalStock - totalQty);
        logEntries.push({
          productId: p.id,
          productName: p.name,
          oldStock: p.totalStock,
          newStock,
          change: newStock - p.totalStock,
          reason: 'order',
          note: `Đơn hàng #${newOrder.id.slice(-6)}`,
        });
        return { ...p, totalStock: newStock };
      } else {
        const updatedVariants = p.variants.map((v) => {
          const matchedItem = affectedItems.find((i) => i.variantId === v.id);
          if (!matchedItem) return v;
          const newStock = Math.max(0, v.stock - matchedItem.quantity);
          logEntries.push({
            productId: p.id,
            productName: p.name,
            variantId: v.id,
            variantName: v.name,
            oldStock: v.stock,
            newStock,
            change: newStock - v.stock,
            reason: 'order' as StockChangeReason,
            note: `Đơn hàng #${newOrder.id.slice(-6)}`,
          });
          return { ...v, stock: newStock };
        });
        const newTotalStock = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        return { ...p, variants: updatedVariants, totalStock: newTotalStock };
      }
    });
    save(KEYS.PRODUCTS, updatedProducts);
    if (logEntries.length > 0) pushStockLogs(logEntries, newOrder.date);

    return { success: true };
  },

  async clearAllOrders(): Promise<void> {
    save(KEYS.ORDERS, []);
  },

  async getShopSettings(): Promise<ShopSettings> {
    const settings = loadObject<ShopSettings>(KEYS.SHOP_SETTINGS, DEFAULT_SETTINGS);
    return {
      distributor: {
        name: settings?.distributor?.name || '',
        phone: settings?.distributor?.phone || '',
        address: settings?.distributor?.address || '',
      },
      orderFilePrefix: settings?.orderFilePrefix || '',
    };
  },

  async saveShopSettings(settings: ShopSettings): Promise<void> {
    const normalized: ShopSettings = {
      distributor: {
        name: settings?.distributor?.name?.trim() || '',
        phone: settings?.distributor?.phone?.trim() || '',
        address: settings?.distributor?.address?.trim() || '',
      },
      orderFilePrefix: settings?.orderFilePrefix?.trim() || '',
    };
    localStorage.setItem(resolveStorageKey(KEYS.SHOP_SETTINGS), JSON.stringify(normalized));
  },

  // ── DEBTS ─────────────────────────────────────────────────────────────────
  async getDebts(): Promise<Debt[]> {
    return load<Debt>(KEYS.DEBTS);
  },

  async addDebt(debt: Debt): Promise<void> {
    const list = load<Debt>(KEYS.DEBTS);
    const newDebt: Debt = {
      ...debt,
      id: debt.id || genId('debt'),
      date: debt.date || new Date().toISOString(),
    };
    list.unshift(newDebt);
    save(KEYS.DEBTS, list);
  },

  async clearAllDebts(): Promise<void> {
    save(KEYS.DEBTS, []);
  },

  // ── IMPORTS (Nhập hàng) ───────────────────────────────────────────────────
  async getImports(): Promise<ImportReceipt[]> {
    return load<ImportReceipt>(KEYS.IMPORTS);
  },

  async addImport(receipt: ImportReceipt): Promise<{ success: boolean; message?: string }> {
    // Save receipt
    const receipts = load<ImportReceipt>(KEYS.IMPORTS);
    const newReceipt: ImportReceipt = {
      ...receipt,
      id: receipt.id || genId('imp'),
      date: receipt.date || new Date().toISOString(),
    };
    receipts.unshift(newReceipt);
    save(KEYS.IMPORTS, receipts);

    // Update product stock + log
    const products = load<Product>(KEYS.PRODUCTS);
    const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];

    const updatedProducts = products.map((p) => {
      const matchedItems = receipt.items.filter((i) => i.productId === p.id);
      if (matchedItems.length === 0) return p;

      if (p.variants.length === 0) {
        const addQty = matchedItems.reduce((sum, i) => sum + i.quantity, 0);
        const newStock = p.totalStock + addQty;
        logEntries.push({
          productId: p.id,
          productName: p.name,
          oldStock: p.totalStock,
          newStock,
          change: addQty,
          reason: 'import',
          note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
        });
        return {
          ...p,
          totalStock: newStock,
          inStock: true,
          costPrice: matchedItems[matchedItems.length - 1].costPrice // Update base costPrice
        };
      } else {
        const updatedVariants = p.variants.map((v) => {
          const item = matchedItems.find((i) => i.variantId === v.id);
          if (!item) return v;
          const newStock = v.stock + item.quantity;
          logEntries.push({
            productId: p.id,
            productName: p.name,
            variantId: v.id,
            variantName: v.name,
            oldStock: v.stock,
            newStock,
            change: item.quantity,
            reason: 'import' as StockChangeReason,
            note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
          });
          return { ...v, stock: newStock };
        });
        
        // Cập nhật giá vốn của sản phẩm bằng giá nhập gần nhất
        const latestCostPrice = matchedItems[matchedItems.length - 1].costPrice;

        const newTotal = updatedVariants.reduce((sum, v) => sum + v.stock, 0);
        return { 
          ...p, 
          variants: updatedVariants, 
          totalStock: newTotal, 
          inStock: newTotal > 0,
          costPrice: latestCostPrice
        };
      }
    });
    save(KEYS.PRODUCTS, updatedProducts);
    if (logEntries.length > 0) pushStockLogs(logEntries, newReceipt.date);

    return { success: true };
  },

  async clearAllImports(): Promise<void> {
    save(KEYS.IMPORTS, []);
  },

  // ── STOCK LOGS ────────────────────────────────────────────────────────────
  async getStockLogs(productId?: string): Promise<StockLog[]> {
    const logs = load<StockLog>(KEYS.STOCK_LOGS);
    return productId ? logs.filter((l) => l.productId === productId) : logs;
  },

  async clearAllStockLogs(): Promise<void> {
    save(KEYS.STOCK_LOGS, []);
  },

  // ── COMPOSITE ─────────────────────────────────────────────────────────────
  async queryAll(): Promise<{ products: Product[]; orders: Order[]; debts: Debt[] }> {
    const [products, orders, debts] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getDebts(),
    ]);
    return { products, orders, debts };
  },
};
