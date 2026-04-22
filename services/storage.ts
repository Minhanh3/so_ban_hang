import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';
import {
  Debt,
  ImportReceipt,
  Order,
  Product,
  ShopSettings,
  StockChangeReason,
  StockLog,
} from '../types';
import { getCurrentUserId, getScopedStorageKey, LEGACY_STORAGE_OWNER_KEY } from './auth';
import { firestoreDb, isFirebaseConfigured } from './firebase';

const KEYS = {
  PRODUCTS: 'sbh_products',
  ORDERS: 'sbh_orders',
  DEBTS: 'sbh_debts',
  IMPORTS: 'sbh_imports',
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
type DatasetEnvelope<T> = {
  value: T;
  updatedAt: string;
};

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

function loadLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(resolveStorageKey(key));
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function saveLocalArray<T>(key: string, data: T[]): void {
  localStorage.setItem(resolveStorageKey(key), JSON.stringify(data));
}

function loadLocalObject<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(resolveStorageKey(key));
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalObject<T>(key: string, data: T): void {
  localStorage.setItem(resolveStorageKey(key), JSON.stringify(data));
}

function genId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function canUseFirebase(userId?: string | null): userId is string {
  return Boolean(isFirebaseConfigured && firestoreDb && userId);
}

function getDatasetRef(baseKey: string, userId: string) {
  return doc(firestoreDb!, 'users', userId, 'app_data', baseKey);
}

function createEnvelope<T>(value: T): DatasetEnvelope<T> {
  return {
    value,
    updatedAt: new Date().toISOString(),
  };
}

function readArrayValue<T>(snapshot: { data(): Record<string, unknown> | undefined }): T[] {
  const value = snapshot.data()?.value;
  return Array.isArray(value) ? (value as T[]) : [];
}

function readObjectValue<T extends object>(
  snapshot: { data(): Record<string, unknown> | undefined },
  fallback: T,
): T {
  const value = snapshot.data()?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return fallback;
  }
  return { ...fallback, ...(value as Partial<T>) };
}

async function loadArray<T>(key: StorageKey): Promise<T[]> {
  const userId = getCurrentUserId();
  if (!canUseFirebase(userId)) {
    return loadLocalArray<T>(key);
  }

  try {
    const ref = getDatasetRef(key, userId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const value = readArrayValue<T>(snapshot);
      saveLocalArray(key, value);
      return value;
    }

    const localValue = loadLocalArray<T>(key);
    if (localValue.length > 0) {
      await setDoc(ref, createEnvelope(localValue));
    }
    return localValue;
  } catch (error) {
    console.error(`Failed to load ${key} from Firebase:`, error);
    return loadLocalArray<T>(key);
  }
}

async function saveArray<T>(key: StorageKey, data: T[]): Promise<void> {
  saveLocalArray(key, data);

  const userId = getCurrentUserId();
  if (!canUseFirebase(userId)) {
    return;
  }

  try {
    await setDoc(getDatasetRef(key, userId), createEnvelope(data));
  } catch (error) {
    console.error(`Failed to save ${key} to Firebase:`, error);
  }
}

async function loadObject<T extends object>(key: StorageKey, fallback: T): Promise<T> {
  const userId = getCurrentUserId();
  if (!canUseFirebase(userId)) {
    return loadLocalObject<T>(key, fallback);
  }

  try {
    const ref = getDatasetRef(key, userId);
    const snapshot = await getDoc(ref);
    if (snapshot.exists()) {
      const value = readObjectValue(snapshot, fallback);
      saveLocalObject(key, value);
      return value;
    }

    const localValue = loadLocalObject<T>(key, fallback);
    if (hasStoredValue(resolveStorageKey(key))) {
      await setDoc(ref, createEnvelope(localValue));
    }
    return localValue;
  } catch (error) {
    console.error(`Failed to load ${key} from Firebase:`, error);
    return loadLocalObject<T>(key, fallback);
  }
}

async function saveObject<T extends object>(key: StorageKey, data: T): Promise<void> {
  saveLocalObject(key, data);

  const userId = getCurrentUserId();
  if (!canUseFirebase(userId)) {
    return;
  }

  try {
    await setDoc(getDatasetRef(key, userId), createEnvelope(data));
  } catch (error) {
    console.error(`Failed to save ${key} to Firebase:`, error);
  }
}

function prependStockLogs(
  logs: StockLog[],
  entries: Omit<StockLog, 'id' | 'date'>[],
  dateISO?: string,
): StockLog[] {
  const now = dateISO || new Date().toISOString();
  const nextLogs = [...logs];
  for (const entry of entries) {
    nextLogs.unshift({
      ...entry,
      id: genId('log'),
      date: now,
    });
  }
  return nextLogs;
}

function applyLocalProductUpdate(product: Product): void {
  const list = loadLocalArray<Product>(KEYS.PRODUCTS);
  const idx = list.findIndex((item) => item.id === product.id);
  if (idx === -1) {
    return;
  }

  const oldProduct = list[idx];
  list[idx] = product;
  saveLocalArray(KEYS.PRODUCTS, list);

  const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];
  if (product.variants.length === 0) {
    if (oldProduct.totalStock !== product.totalStock) {
      logEntries.push({
        productId: product.id,
        productName: product.name,
        oldStock: oldProduct.totalStock,
        newStock: product.totalStock,
        change: product.totalStock - oldProduct.totalStock,
        reason: 'manual_edit',
        note: 'Chỉnh sửa thủ công',
      });
    }
  } else {
    for (const newVariant of product.variants) {
      const oldVariant = oldProduct.variants.find((variant) => variant.id === newVariant.id);
      const oldStock = oldVariant?.stock ?? 0;
      if (oldStock !== newVariant.stock) {
        logEntries.push({
          productId: product.id,
          productName: product.name,
          variantId: newVariant.id,
          variantName: newVariant.name,
          oldStock,
          newStock: newVariant.stock,
          change: newVariant.stock - oldStock,
          reason: 'manual_edit',
          note: 'Chỉnh sửa thủ công',
        });
      }
    }
  }

  if (logEntries.length > 0) {
    const logs = loadLocalArray<StockLog>(KEYS.STOCK_LOGS);
    saveLocalArray(KEYS.STOCK_LOGS, prependStockLogs(logs, logEntries));
  }
}

export const db = {
  async connect(): Promise<void> {
    return Promise.resolve();
  },

  async getProducts(): Promise<Product[]> {
    return loadArray<Product>(KEYS.PRODUCTS);
  },

  async addProduct(product: Product): Promise<void> {
    const list = await loadArray<Product>(KEYS.PRODUCTS);
    const logs = await loadArray<StockLog>(KEYS.STOCK_LOGS);
    const newProduct: Product = {
      ...product,
      id: product.id || genId('prod'),
    };

    let nextLogs = logs;
    if (newProduct.totalStock > 0) {
      if (newProduct.variants.length === 0) {
        nextLogs = prependStockLogs(nextLogs, [{
          productId: newProduct.id,
          productName: newProduct.name,
          oldStock: 0,
          newStock: newProduct.totalStock,
          change: newProduct.totalStock,
          reason: 'manual_edit',
          note: 'Tạo sản phẩm mới',
        }]);
      } else {
        nextLogs = prependStockLogs(
          nextLogs,
          newProduct.variants
            .filter((variant) => variant.stock > 0)
            .map((variant) => ({
              productId: newProduct.id,
              productName: newProduct.name,
              variantId: variant.id,
              variantName: variant.name,
              oldStock: 0,
              newStock: variant.stock,
              change: variant.stock,
              reason: 'manual_edit' as StockChangeReason,
              note: 'Tạo sản phẩm mới',
            })),
        );
      }
    }

    await saveArray(KEYS.PRODUCTS, [...list, newProduct]);
    if (nextLogs !== logs) {
      await saveArray(KEYS.STOCK_LOGS, nextLogs);
    }
  },

  async updateProduct(product: Product): Promise<void> {
    const userId = getCurrentUserId();
    if (!canUseFirebase(userId)) {
      applyLocalProductUpdate(product);
      return;
    }

    let nextProducts: Product[] = [];
    let nextLogs: StockLog[] = [];

    try {
      await runTransaction(firestoreDb!, async (transaction) => {
        const productsRef = getDatasetRef(KEYS.PRODUCTS, userId);
        const logsRef = getDatasetRef(KEYS.STOCK_LOGS, userId);
        const productsSnapshot = await transaction.get(productsRef);
        const logsSnapshot = await transaction.get(logsRef);

        const currentProducts = readArrayValue<Product>(productsSnapshot);
        const idx = currentProducts.findIndex((item) => item.id === product.id);
        if (idx === -1) {
          nextProducts = currentProducts;
          nextLogs = readArrayValue<StockLog>(logsSnapshot);
          return;
        }

        const oldProduct = currentProducts[idx];
        nextProducts = [...currentProducts];
        nextProducts[idx] = product;

        const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];
        if (product.variants.length === 0) {
          if (oldProduct.totalStock !== product.totalStock) {
            logEntries.push({
              productId: product.id,
              productName: product.name,
              oldStock: oldProduct.totalStock,
              newStock: product.totalStock,
              change: product.totalStock - oldProduct.totalStock,
              reason: 'manual_edit',
              note: 'Chỉnh sửa thủ công',
            });
          }
        } else {
          for (const newVariant of product.variants) {
            const oldVariant = oldProduct.variants.find((variant) => variant.id === newVariant.id);
            const oldStock = oldVariant?.stock ?? 0;
            if (oldStock !== newVariant.stock) {
              logEntries.push({
                productId: product.id,
                productName: product.name,
                variantId: newVariant.id,
                variantName: newVariant.name,
                oldStock,
                newStock: newVariant.stock,
                change: newVariant.stock - oldStock,
                reason: 'manual_edit',
                note: 'Chỉnh sửa thủ công',
              });
            }
          }
        }

        nextLogs = prependStockLogs(readArrayValue<StockLog>(logsSnapshot), logEntries);

        transaction.set(productsRef, createEnvelope(nextProducts));
        if (logEntries.length > 0) {
          transaction.set(logsRef, createEnvelope(nextLogs));
        }
      });
    } catch (error) {
      console.error('Failed to update product in Firebase:', error);
      applyLocalProductUpdate(product);
      return;
    }

    saveLocalArray(KEYS.PRODUCTS, nextProducts);
    saveLocalArray(KEYS.STOCK_LOGS, nextLogs);
  },

  async deleteProduct(id: string): Promise<void> {
    const list = await loadArray<Product>(KEYS.PRODUCTS);
    await saveArray(
      KEYS.PRODUCTS,
      list.filter((product) => product.id !== id),
    );
  },

  async clearAllProducts(): Promise<void> {
    await saveArray(KEYS.PRODUCTS, []);
  },

  async getOrders(): Promise<Order[]> {
    return loadArray<Order>(KEYS.ORDERS);
  },

  async createOrder(order: Order): Promise<{ success: boolean; message?: string }> {
    const userId = getCurrentUserId();
    const newOrder: Order = {
      ...order,
      id: order.id || genId('ord'),
      date: order.date || new Date().toISOString(),
      status: 'completed',
    };

    if (!canUseFirebase(userId)) {
      const products = loadLocalArray<Product>(KEYS.PRODUCTS);

      for (const item of order.items) {
        const product = products.find((entry) => entry.id === item.productId);
        if (!product) {
          continue;
        }

        if (product.variants.length === 0) {
          if (product.totalStock < item.quantity) {
            return { success: false, message: `Sản phẩm "${item.name}" không đủ tồn kho.` };
          }
        } else {
          const variant = product.variants.find((entry) => entry.id === item.variantId);
          if (!variant || variant.stock < item.quantity) {
            return {
              success: false,
              message: `Sản phẩm "${item.name}" (${item.variantName}) không đủ tồn kho.`,
            };
          }
        }
      }

      const orders = loadLocalArray<Order>(KEYS.ORDERS);
      const logs = loadLocalArray<StockLog>(KEYS.STOCK_LOGS);
      const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];

      const updatedProducts = products.map((product) => {
        const affectedItems = order.items.filter((item) => item.productId === product.id);
        if (affectedItems.length === 0) {
          return product;
        }

        if (product.variants.length === 0) {
          const totalQty = affectedItems.reduce((sum, item) => sum + item.quantity, 0);
          const newStock = Math.max(0, product.totalStock - totalQty);
          logEntries.push({
            productId: product.id,
            productName: product.name,
            oldStock: product.totalStock,
            newStock,
            change: newStock - product.totalStock,
            reason: 'order',
            note: `Đơn hàng #${newOrder.id.slice(-6)}`,
          });
          return { ...product, totalStock: newStock };
        }

        const updatedVariants = product.variants.map((variant) => {
          const matchedItem = affectedItems.find((item) => item.variantId === variant.id);
          if (!matchedItem) {
            return variant;
          }

          const newStock = Math.max(0, variant.stock - matchedItem.quantity);
          logEntries.push({
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantName: variant.name,
            oldStock: variant.stock,
            newStock,
            change: newStock - variant.stock,
            reason: 'order' as StockChangeReason,
            note: `Đơn hàng #${newOrder.id.slice(-6)}`,
          });
          return { ...variant, stock: newStock };
        });

        const newTotalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
        return { ...product, variants: updatedVariants, totalStock: newTotalStock };
      });

      saveLocalArray(KEYS.ORDERS, [newOrder, ...orders]);
      saveLocalArray(KEYS.PRODUCTS, updatedProducts);
      saveLocalArray(KEYS.STOCK_LOGS, prependStockLogs(logs, logEntries, newOrder.date));
      return { success: true };
    }

    let nextProducts: Product[] = [];
    let nextOrders: Order[] = [];
    let nextLogs: StockLog[] = [];
    let failureMessage: string | null = null;

    try {
      await runTransaction(firestoreDb!, async (transaction) => {
        const productsRef = getDatasetRef(KEYS.PRODUCTS, userId);
        const ordersRef = getDatasetRef(KEYS.ORDERS, userId);
        const logsRef = getDatasetRef(KEYS.STOCK_LOGS, userId);

        const productsSnapshot = await transaction.get(productsRef);
        const ordersSnapshot = await transaction.get(ordersRef);
        const logsSnapshot = await transaction.get(logsRef);

        const products = readArrayValue<Product>(productsSnapshot);
        const orders = readArrayValue<Order>(ordersSnapshot);
        const logs = readArrayValue<StockLog>(logsSnapshot);

        for (const item of order.items) {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) {
            continue;
          }

          if (product.variants.length === 0) {
            if (product.totalStock < item.quantity) {
              failureMessage = `Sản phẩm "${item.name}" không đủ tồn kho.`;
              return;
            }
          } else {
            const variant = product.variants.find((entry) => entry.id === item.variantId);
            if (!variant || variant.stock < item.quantity) {
              failureMessage = `Sản phẩm "${item.name}" (${item.variantName}) không đủ tồn kho.`;
              return;
            }
          }
        }

        const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];
        nextProducts = products.map((product) => {
          const affectedItems = order.items.filter((item) => item.productId === product.id);
          if (affectedItems.length === 0) {
            return product;
          }

          if (product.variants.length === 0) {
            const totalQty = affectedItems.reduce((sum, item) => sum + item.quantity, 0);
            const newStock = Math.max(0, product.totalStock - totalQty);
            logEntries.push({
              productId: product.id,
              productName: product.name,
              oldStock: product.totalStock,
              newStock,
              change: newStock - product.totalStock,
              reason: 'order',
              note: `Đơn hàng #${newOrder.id.slice(-6)}`,
            });
            return { ...product, totalStock: newStock };
          }

          const updatedVariants = product.variants.map((variant) => {
            const matchedItem = affectedItems.find((item) => item.variantId === variant.id);
            if (!matchedItem) {
              return variant;
            }

            const newStock = Math.max(0, variant.stock - matchedItem.quantity);
            logEntries.push({
              productId: product.id,
              productName: product.name,
              variantId: variant.id,
              variantName: variant.name,
              oldStock: variant.stock,
              newStock,
              change: newStock - variant.stock,
              reason: 'order' as StockChangeReason,
              note: `Đơn hàng #${newOrder.id.slice(-6)}`,
            });
            return { ...variant, stock: newStock };
          });

          const newTotalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);
          return { ...product, variants: updatedVariants, totalStock: newTotalStock };
        });

        nextOrders = [newOrder, ...orders];
        nextLogs = prependStockLogs(logs, logEntries, newOrder.date);

        transaction.set(productsRef, createEnvelope(nextProducts));
        transaction.set(ordersRef, createEnvelope(nextOrders));
        transaction.set(logsRef, createEnvelope(nextLogs));
      });
    } catch (error) {
      console.error('Failed to create order in Firebase:', error);
      return { success: false, message: 'Không thể lưu đơn hàng lên Firebase.' };
    }

    if (failureMessage) {
      return { success: false, message: failureMessage };
    }

    saveLocalArray(KEYS.PRODUCTS, nextProducts);
    saveLocalArray(KEYS.ORDERS, nextOrders);
    saveLocalArray(KEYS.STOCK_LOGS, nextLogs);

    return { success: true };
  },

  async clearAllOrders(): Promise<void> {
    await saveArray(KEYS.ORDERS, []);
  },

  async getShopSettings(): Promise<ShopSettings> {
    const settings = await loadObject<ShopSettings>(KEYS.SHOP_SETTINGS, DEFAULT_SETTINGS);
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

    await saveObject(KEYS.SHOP_SETTINGS, normalized);
  },

  async getDebts(): Promise<Debt[]> {
    return loadArray<Debt>(KEYS.DEBTS);
  },

  async addDebt(debt: Debt): Promise<void> {
    const list = await loadArray<Debt>(KEYS.DEBTS);
    const newDebt: Debt = {
      ...debt,
      id: debt.id || genId('debt'),
      date: debt.date || new Date().toISOString(),
    };

    await saveArray(KEYS.DEBTS, [newDebt, ...list]);
  },

  async clearAllDebts(): Promise<void> {
    await saveArray(KEYS.DEBTS, []);
  },

  async getImports(): Promise<ImportReceipt[]> {
    return loadArray<ImportReceipt>(KEYS.IMPORTS);
  },

  async addImport(receipt: ImportReceipt): Promise<{ success: boolean; message?: string }> {
    const userId = getCurrentUserId();
    const newReceipt: ImportReceipt = {
      ...receipt,
      id: receipt.id || genId('imp'),
      date: receipt.date || new Date().toISOString(),
    };

    if (!canUseFirebase(userId)) {
      const receipts = loadLocalArray<ImportReceipt>(KEYS.IMPORTS);
      const products = loadLocalArray<Product>(KEYS.PRODUCTS);
      const logs = loadLocalArray<StockLog>(KEYS.STOCK_LOGS);
      const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];

      const updatedProducts = products.map((product) => {
        const matchedItems = receipt.items.filter((item) => item.productId === product.id);
        if (matchedItems.length === 0) {
          return product;
        }

        if (product.variants.length === 0) {
          const addQty = matchedItems.reduce((sum, item) => sum + item.quantity, 0);
          const newStock = product.totalStock + addQty;
          logEntries.push({
            productId: product.id,
            productName: product.name,
            oldStock: product.totalStock,
            newStock,
            change: addQty,
            reason: 'import',
            note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
          });
          return {
            ...product,
            totalStock: newStock,
            inStock: true,
            costPrice: matchedItems[matchedItems.length - 1].costPrice,
          };
        }

        const updatedVariants = product.variants.map((variant) => {
          const item = matchedItems.find((entry) => entry.variantId === variant.id);
          if (!item) {
            return variant;
          }

          const newStock = variant.stock + item.quantity;
          logEntries.push({
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantName: variant.name,
            oldStock: variant.stock,
            newStock,
            change: item.quantity,
            reason: 'import' as StockChangeReason,
            note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
          });
          return { ...variant, stock: newStock };
        });

        const latestCostPrice = matchedItems[matchedItems.length - 1].costPrice;
        const newTotalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);

        return {
          ...product,
          variants: updatedVariants,
          totalStock: newTotalStock,
          inStock: newTotalStock > 0,
          costPrice: latestCostPrice,
        };
      });

      saveLocalArray(KEYS.IMPORTS, [newReceipt, ...receipts]);
      saveLocalArray(KEYS.PRODUCTS, updatedProducts);
      saveLocalArray(KEYS.STOCK_LOGS, prependStockLogs(logs, logEntries, newReceipt.date));
      return { success: true };
    }

    let nextImports: ImportReceipt[] = [];
    let nextProducts: Product[] = [];
    let nextLogs: StockLog[] = [];

    try {
      await runTransaction(firestoreDb!, async (transaction) => {
        const importsRef = getDatasetRef(KEYS.IMPORTS, userId);
        const productsRef = getDatasetRef(KEYS.PRODUCTS, userId);
        const logsRef = getDatasetRef(KEYS.STOCK_LOGS, userId);

        const importsSnapshot = await transaction.get(importsRef);
        const productsSnapshot = await transaction.get(productsRef);
        const logsSnapshot = await transaction.get(logsRef);

        const receipts = readArrayValue<ImportReceipt>(importsSnapshot);
        const products = readArrayValue<Product>(productsSnapshot);
        const logs = readArrayValue<StockLog>(logsSnapshot);
        const logEntries: Omit<StockLog, 'id' | 'date'>[] = [];

        nextProducts = products.map((product) => {
          const matchedItems = receipt.items.filter((item) => item.productId === product.id);
          if (matchedItems.length === 0) {
            return product;
          }

          if (product.variants.length === 0) {
            const addQty = matchedItems.reduce((sum, item) => sum + item.quantity, 0);
            const newStock = product.totalStock + addQty;
            logEntries.push({
              productId: product.id,
              productName: product.name,
              oldStock: product.totalStock,
              newStock,
              change: addQty,
              reason: 'import',
              note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
            });
            return {
              ...product,
              totalStock: newStock,
              inStock: true,
              costPrice: matchedItems[matchedItems.length - 1].costPrice,
            };
          }

          const updatedVariants = product.variants.map((variant) => {
            const item = matchedItems.find((entry) => entry.variantId === variant.id);
            if (!item) {
              return variant;
            }

            const newStock = variant.stock + item.quantity;
            logEntries.push({
              productId: product.id,
              productName: product.name,
              variantId: variant.id,
              variantName: variant.name,
              oldStock: variant.stock,
              newStock,
              change: item.quantity,
              reason: 'import' as StockChangeReason,
              note: `Nhập từ: ${receipt.supplierName || 'Không rõ'}`,
            });
            return { ...variant, stock: newStock };
          });

          const latestCostPrice = matchedItems[matchedItems.length - 1].costPrice;
          const newTotalStock = updatedVariants.reduce((sum, variant) => sum + variant.stock, 0);

          return {
            ...product,
            variants: updatedVariants,
            totalStock: newTotalStock,
            inStock: newTotalStock > 0,
            costPrice: latestCostPrice,
          };
        });

        nextImports = [newReceipt, ...receipts];
        nextLogs = prependStockLogs(logs, logEntries, newReceipt.date);

        transaction.set(importsRef, createEnvelope(nextImports));
        transaction.set(productsRef, createEnvelope(nextProducts));
        transaction.set(logsRef, createEnvelope(nextLogs));
      });
    } catch (error) {
      console.error('Failed to add import receipt in Firebase:', error);
      return { success: false, message: 'Không thể lưu phiếu nhập lên Firebase.' };
    }

    saveLocalArray(KEYS.IMPORTS, nextImports);
    saveLocalArray(KEYS.PRODUCTS, nextProducts);
    saveLocalArray(KEYS.STOCK_LOGS, nextLogs);

    return { success: true };
  },

  async clearAllImports(): Promise<void> {
    await saveArray(KEYS.IMPORTS, []);
  },

  async getStockLogs(productId?: string): Promise<StockLog[]> {
    const logs = await loadArray<StockLog>(KEYS.STOCK_LOGS);
    return productId ? logs.filter((log) => log.productId === productId) : logs;
  },

  async clearAllStockLogs(): Promise<void> {
    await saveArray(KEYS.STOCK_LOGS, []);
  },

  async queryAll(): Promise<{ products: Product[]; orders: Order[]; debts: Debt[] }> {
    const [products, orders, debts] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getDebts(),
    ]);

    return { products, orders, debts };
  },
};
