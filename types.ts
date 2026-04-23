
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
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  adminNote?: string;
  distributorName?: string;
  distributorPhone?: string;
  distributorAddress?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
  lastOrderAt?: string;
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

export interface DistributorInfo {
  name: string;
  phone: string;
  address: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface AuthSession {
  userId: string;
  username: string;
  displayName: string;
  loggedInAt: string;
}

export interface ShopSettings {
  distributor: DistributorInfo;
  orderFilePrefix?: string;
}

export interface ImportItem {
  productId: string;
  variantId?: string;       // undefined = no variant (add to totalStock)
  productName: string;
  variantName?: string;
  quantity: number;
  costPrice: number;        // price paid per unit when importing
}

export interface ImportReceipt {
  id: string;
  supplierName: string;
  note?: string;
  items: ImportItem[];
  totalCost: number;        // sum of quantity * costPrice
  date: string;             // ISO datetime (includes both date + time)
}

export type StockChangeReason = 'manual_edit' | 'import' | 'order' | 'adjustment';

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  oldStock: number;
  newStock: number;
  change: number;           // newStock - oldStock (+ = nhập, - = xuất)
  reason: StockChangeReason;
  note?: string;
  date: string;             // ISO datetime
}
