
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Filter, ArrowLeft, MoreHorizontal, Box, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/storage';
import { Product } from '../types';
import ProductModal from '../components/ProductModal';
import { Link, useLocation } from "react-router-dom";

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get('status');

  const refreshProducts = async () => {
    const list = await db.getProducts();
    let filteredList = list;

    if (statusFilter === 'out') {
      filteredList = filteredList.filter(p => p.totalStock === 0);
    } else if (statusFilter === 'low') {
      filteredList = filteredList.filter(p => p.totalStock > 0 && p.totalStock <= 10);
    }

    setProducts(filteredList);
  };

  useEffect(() => {
    refreshProducts();
  }, [statusFilter]);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (product: Product) => {
    if (editingProduct) {
      await db.updateProduct(product);
    } else {
      await db.addProduct(product);
    }
    refreshProducts();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      await db.deleteProduct(id);
      refreshProducts();
    }
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleClearAll = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa TẤT CẢ sản phẩm? Hành động này không thể hoàn tác!')) {
      await db.clearAllProducts();
      refreshProducts();
    }
  };

  const handleExport = () => {
    import('../utils/csvExport').then(({ exportToCSV }) => {
      // Flatten data for export
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
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${product.totalStock === 0
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
