
export type OrderStatus = 'pending_confirm' | 'shipping' | 'unpaid' | 'completed';
export type StockStatus = 'out' | 'low';
export type DebtStatus = 'due' | 'missing' | 'needed';
export type DebtType = 'customer_receivable' | 'supplier_payable' | 'customer_credit';

export interface OrderItem {
  productId: string;
  variantId: string;
  name: string;
  variantName: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  date: string; // ISO string
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  unit?: string;
  category?: string;
  sku?: string;
  barcode?: string;
  basePrice: number;
  costPrice?: number;
  promoPrice?: number;
  totalStock: number;
  variants: ProductVariant[];
  // Status flags
  inStock: boolean;
  trackStock: boolean;
  applyMaterials: boolean;
  allowWholesaleView: boolean;
  showOnWebsite: boolean;
  images: string[];
}

export interface Debt {
  id: string;
  type: DebtType;
  contactName: string;
  remindStatus: DebtStatus;
  amount: number;
  date: string;
  relatedProductId?: string;
  note?: string;
}

export interface TodoCardConfig {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: string;
  type: 'order' | 'product' | 'debt';
  filter: string;
}

export interface MockData {
  orders: Order[];
  products: Product[];
  debts: Debt[];
}
