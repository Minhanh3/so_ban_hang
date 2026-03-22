
import { MockData, Order, Product, Debt } from '../types';
import { supabase } from './supabaseClient';

// Helper to format date
const formatDate = (date: string) => new Date(date).toISOString();

export const db = {
  async connect(): Promise<void> {
    // Supabase client is already initialized
    return Promise.resolve();
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`*, variants:product_variants(*)`)
      .order('name');

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      basePrice: Number(p.base_price),
      costPrice: Number(p.cost_price),
      totalStock: p.total_stock,
      variants: p.variants.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: Number(v.price),
        stock: v.stock
      })),
      inStock: p.total_stock > 0,
      trackStock: true,
      applyMaterials: false,
      allowWholesaleView: false,
      showOnWebsite: true,
      images: p.image_url ? [p.image_url] : []
    }));
  },

  async addProduct(product: Product): Promise<void> {
    const { data: prodData, error: prodError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        base_price: product.basePrice,
        cost_price: product.costPrice,
        total_stock: product.totalStock,
        unit: product.unit,
        image_url: product.images?.[0]
      })
      .select()
      .single();

    if (prodError || !prodData) {
      console.error('Error adding product:', prodError);
      return;
    }

    if (product.variants.length > 0) {
      const variantsPayload = product.variants.map(v => ({
        product_id: prodData.id,
        name: v.name,
        price: v.price,
        stock: v.stock
      }));

      const { error: varError } = await supabase
        .from('product_variants')
        .insert(variantsPayload);

      if (varError) console.error('Error adding variants:', varError);
    }
  },

  // NOTE: Simplify update/delete for MVP
  async updateProduct(product: Product): Promise<void> {
    await supabase
      .from('products')
      .update({
        name: product.name,
        base_price: product.basePrice,
        cost_price: product.costPrice,
        total_stock: product.totalStock,
        unit: product.unit,
        image_url: product.images?.[0]
      })
      .eq('id', product.id);

    // Update variants if needed (simplified: just update stocks/prices if specific logic required later)
    // For now, we assume variants are managed separately or this is a simple product
  },

  async deleteProduct(id: string): Promise<void> {
    await supabase.from('products').delete().eq('id', id);
  },


  async clearAllProducts(): Promise<void> {
    const { data: products } = await supabase.from('products').select('id');
    if (!products || products.length === 0) return;

    const ids = products.map((p: any) => p.id);

    // Manual cascading delete attempt (safe)
    await supabase.from('product_variants').delete().in('product_id', ids);

    const { error } = await supabase.from('products').delete().in('id', ids);

    if (error) {
      console.error('Error clearing products:', error);
      alert('Lỗi xóa sản phẩm: ' + error.message);
    }
  },

  // --- ORDERS ---
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`*, items:order_items(*)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      return [];
    }

    return data.map((o: any) => ({
      id: o.id,
      status: o.status as any,
      date: o.created_at,
      totalAmount: Number(o.total_amount),
      items: o.items.map((i: any) => ({
        productId: i.product_id,
        variantId: i.variant_id,
        name: i.product_name,
        variantName: i.variant_name,
        quantity: i.quantity,
        price: Number(i.price)
      }))
    }));
  },

  async createOrder(order: Order): Promise<{ success: boolean; message?: string }> {
    // 1. Client-side stock check (Basic)
    const products = await this.getProducts();

    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (product.variants.length === 0) {
          if (product.totalStock < item.quantity) {
            return { success: false, message: `Sản phẩm ${item.name} hết hàng.` };
          }
        } else {
          const variant = product.variants.find(v => v.id === item.variantId);
          if (!variant || variant.stock < item.quantity) {
            return { success: false, message: `Sản phẩm ${item.name} (${item.variantName}) không đủ tồn kho.` };
          }
        }
      }
    }

    // 2. Insert Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        status: 'completed',
        total_amount: order.totalAmount,
        customer_name: 'Guest'
      })
      .select()
      .single();

    if (orderError || !orderData) {
      return { success: false, message: 'Lỗi tạo đơn: ' + orderError?.message };
    }

    // 3. Insert Items
    const orderItems = order.items.map(item => ({
      order_id: orderData.id,
      product_id: item.productId,
      variant_id: (item.variantId === 'default' || !item.variantId) ? null : item.variantId,
      product_name: item.name,
      variant_name: item.variantName,
      quantity: item.quantity,
      price: item.price
    }));

    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) console.error('Error items:', itemsError);

    // 4. Deduct Stock (Optimistic)
    for (const item of order.items) {
      if (item.variantId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (product.variants.length > 0) {
            const v = product.variants.find(v => v.id === item.variantId);
            if (v) {
              await supabase.from('product_variants')
                .update({ stock: v.stock - item.quantity })
                .eq('id', v.id);
            }
          } else {
            await supabase.from('products')
              .update({ total_stock: product.totalStock - item.quantity })
              .eq('id', product.id);
          }
        }
      }
    }

    return { success: true };
  },


  async clearAllOrders(): Promise<void> {
    const { data: orders } = await supabase.from('orders').select('id');
    if (!orders || orders.length === 0) return;

    const ids = orders.map((o: any) => o.id);

    // Manual cascading delete attempt
    await supabase.from('order_items').delete().in('order_id', ids);

    const { error } = await supabase.from('orders').delete().in('id', ids);

    if (error) {
      console.error('Error clearing orders:', error);
      alert('Lỗi xóa đơn hàng: ' + error.message);
    }
  },

  // --- DEBTS ---
  async getDebts(): Promise<Debt[]> {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return data.map((d: any) => ({
      id: d.id,
      type: d.type as any,
      contactName: d.contact_name,
      remindStatus: 'due',
      amount: Number(d.amount),
      date: d.created_at,
      note: d.note
    }));
  },

  async addDebt(debt: Debt): Promise<void> {
    await supabase.from('debts').insert({
      contact_name: debt.contactName,
      amount: debt.amount,
      type: debt.type,
      note: debt.note
    });
  },


  async clearAllDebts(): Promise<void> {
    console.log('clearAllDebts called');
    const { data: debts } = await supabase.from('debts').select('id');
    console.log('Debts to delete:', debts?.length);
    if (!debts || debts.length === 0) return;

    const ids = debts.map((d: any) => d.id);
    const { error } = await supabase.from('debts').delete().in('id', ids);

    if (error) {
      console.error('Error clearing debts:', error);
      alert('Lỗi xóa sổ nợ: ' + error.message);
    } else {
      console.log('Debts cleared successfully');
    }
  },

  // --- COMPOSITE ---
  async queryAll(): Promise<{ products: Product[], orders: Order[], debts: Debt[] }> {
    const [products, orders, debts] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getDebts()
    ]);
    return { products, orders, debts };
  }
};
