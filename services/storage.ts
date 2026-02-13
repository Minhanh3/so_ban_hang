
import { MockData, Order, Product, Debt } from '../types';

const STORAGE_KEY = 'sobanhang_todo_db_sim';

const initialData: MockData = {
  orders: [
    {
      id: 'ord-1',
      status: 'completed',
      items: [{ productId: '1', variantId: 'v1', name: 'Trà sữa truyền thống', variantName: 'Size M', quantity: 2, price: 25000 }],
      totalAmount: 50000,
      date: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  products: [
    {
      id: '1',
      name: 'Trà sữa truyền thống',
      unit: 'Ly',
      basePrice: 25000,
      costPrice: 15000,
      totalStock: 20,
      variants: [
        { id: 'v1', name: 'Size M', price: 25000, stock: 10 },
        { id: 'v2', name: 'Size L', price: 35000, stock: 10 }
      ],
      inStock: true,
      trackStock: true,
      applyMaterials: false,
      allowWholesaleView: false,
      showOnWebsite: true,
      images: []
    }
  ],
  debts: [
    { id: 'd-1', type: 'customer_receivable', contactName: 'Anh Tuấn', remindStatus: 'due', amount: 1000000, date: new Date().toISOString(), note: 'Nợ tiền hàng Trà Sữa' },
  ]
};

export const db = {
  async connect(): Promise<void> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    }
    return Promise.resolve();
  },

  async queryAll(): Promise<MockData> {
    await this.connect();
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return Promise.resolve(data);
  },

  async save(data: MockData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return Promise.resolve();
  },

  async getProducts(): Promise<Product[]> {
    const data = await this.queryAll();
    return data.products;
  },

  async addProduct(product: Product): Promise<void> {
    const data = await this.queryAll();
    data.products.push(product);
    await this.save(data);
  },

  async updateProduct(updatedProduct: Product): Promise<void> {
    const data = await this.queryAll();
    data.products = data.products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    await this.save(data);
  },

  async deleteProduct(id: string): Promise<void> {
    const data = await this.queryAll();
    data.products = data.products.filter(p => p.id !== id);
    await this.save(data);
  },

  async getOrders(): Promise<Order[]> {
    const data = await this.queryAll();
    return data.orders;
  },

  async createOrder(order: Order): Promise<{ success: boolean; message?: string }> {
    const data = await this.queryAll();

    for (const item of order.items) {
      const product = data.products.find(p => p.id === item.productId);
      if (product) {
        if (product.variants.length === 0) {
          // Sản phẩm không có biến thể, check totalStock
          if (product.totalStock < item.quantity) {
            return { success: false, message: `Sản phẩm ${item.name} hết hàng (Hiện có: ${product.totalStock}).` };
          }
        } else {
          // Sản phẩm có biến thể
          const variant = product.variants.find(v => v.id === item.variantId);
          if (!variant || variant.stock < item.quantity) {
            return { success: false, message: `Sản phẩm ${item.name} (${item.variantName}) không đủ tồn kho.` };
          }
        }
      }
    }

    order.items.forEach(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (product) {
        if (product.variants.length === 0) {
          product.totalStock -= item.quantity;
        } else {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (variant) variant.stock -= item.quantity;
          product.totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
        }
      }
    });

    order.status = 'completed';
    data.orders.unshift(order);
    await this.save(data);
    return { success: true };
  },

  async getDebts(): Promise<Debt[]> {
    const data = await this.queryAll();
    return data.debts;
  },

  async addDebt(debt: Debt): Promise<void> {
    const data = await this.queryAll();
    data.debts.push(debt);
    await this.save(data);
  },

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};
