
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Camera, ChevronDown, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { Product, ProductVariant } from '../types';

// Moved sub-components outside to ensure TypeScript correctly detects children props
// @fix: Made children optional to satisfy compiler when used with content in some environments
const Label = ({ children, required }: { children?: React.ReactNode, required?: boolean }) => (
  <label className="block text-xs font-medium text-gray-400 mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary transition-all ${props.className}`}
  />
);

// @fix: Made children optional to satisfy compiler when used with content in some environments
const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-gray-100 mb-4">{children}</h3>
);

const Toggle = ({ active, onChange, label, subLabel }: { active: boolean, onChange: (v: boolean) => void, label: string, subLabel?: string }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex-1 pr-4">
      <p className="text-sm text-gray-200">{label}</p>
      {subLabel && <p className="text-[11px] text-gray-500 mt-0.5">{subLabel}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!active)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${active ? 'bg-primary' : 'bg-[#404040]'}`}
    >
      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialProduct?: Product;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, initialProduct }) => {
  // General Info
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  
  // Pricing
  const [basePrice, setBasePrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [promoPrice, setPromoPrice] = useState(0);

  // Variants
  const [variants, setVariants] = useState<ProductVariant[]>([]);

  // Status & Flags
  const [inStock, setInStock] = useState(true);
  const [trackStock, setTrackStock] = useState(true);
  const [applyMaterials, setApplyMaterials] = useState(false);
  const [allowWholesaleView, setAllowWholesaleView] = useState(false);
  const [showOnWebsite, setShowOnWebsite] = useState(true);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setUnit(initialProduct.unit || '');
      setCategory(initialProduct.category || '');
      setSku(initialProduct.sku || '');
      setBarcode(initialProduct.barcode || '');
      setBasePrice(initialProduct.basePrice);
      setCostPrice(initialProduct.costPrice || 0);
      setPromoPrice(initialProduct.promoPrice || 0);
      setVariants(initialProduct.variants);
      setInStock(initialProduct.inStock);
      setTrackStock(initialProduct.trackStock);
      setApplyMaterials(initialProduct.applyMaterials);
      setAllowWholesaleView(initialProduct.allowWholesaleView);
      setShowOnWebsite(initialProduct.showOnWebsite);
    } else {
      setName('');
      setUnit('');
      setCategory('');
      setSku('');
      setBarcode('');
      setBasePrice(0);
      setCostPrice(0);
      setPromoPrice(0);
      setVariants([]);
      setInStock(true);
      setTrackStock(true);
      setApplyMaterials(false);
      setAllowWholesaleView(false);
      setShowOnWebsite(true);
    }
  }, [initialProduct, isOpen]);

  const addVariant = () => {
    setVariants([...variants, { id: 'v-' + Date.now(), name: '', price: basePrice, stock: 0 }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalStock = variants.length > 0 ? variants.reduce((sum, v) => sum + Number(v.stock), 0) : 100; // Default stock if no variants? 
    onSave({
      id: initialProduct?.id || 'prod-' + Date.now(),
      name,
      unit,
      category,
      sku,
      barcode,
      basePrice,
      costPrice,
      promoPrice,
      totalStock,
      variants,
      inStock,
      trackStock,
      applyMaterials,
      allowWholesaleView,
      showOnWebsite,
      images: []
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#121212] w-full h-full md:max-w-[1200px] md:h-[90vh] md:rounded-lg overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="bg-primary px-6 py-3 flex justify-between items-center text-white">
          <h2 className="text-base font-bold">{initialProduct ? 'Chỉnh sửa sản phẩm' : 'Tạo sản phẩm mới'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#1a1a1a]">
          {/* Left Column */}
          <div className="flex-1 p-6 space-y-8 border-r border-[#262626]">
            
            {/* Thông tin chung */}
            <section>
              <SectionTitle>Thông tin chung</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <Label required>Tên sản phẩm</Label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Tên sản phẩm"
                    required 
                  />
                </div>
                <div>
                  <Label>Đơn vị</Label>
                  <Input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Ví dụ: Lon" />
                </div>
                <div className="md:col-span-1">
                  <Label>Danh mục</Label>
                  <div className="relative">
                    <select 
                      value={category} 
                      onChange={e => setCategory(e.target.value)}
                      className="w-full bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary appearance-none"
                    >
                      <option value="">Chọn 1 hoặc nhiều</option>
                      <option value="Đồ uống">Đồ uống</option>
                      <option value="Thức ăn">Thức ăn</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:col-span-1">
                   <div>
                    <Label>Mã sản phẩm (SKU)</Label>
                    <Input value={sku} onChange={e => setSku(e.target.value)} />
                   </div>
                   <div>
                    <Label>Mã vạch sản xuất</Label>
                    <Input value={barcode} onChange={e => setBarcode(e.target.value)} />
                   </div>
                </div>
              </div>
            </section>

            {/* Giá sản phẩm */}
            <section>
              <SectionTitle>Giá sản phẩm</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Giá bán</Label>
                  <Input type="number" value={basePrice || ''} onChange={e => setBasePrice(Number(e.target.value))} placeholder="0" />
                </div>
                <div>
                  <Label>Giá vốn</Label>
                  <Input type="number" value={costPrice || ''} onChange={e => setCostPrice(Number(e.target.value))} placeholder="0" />
                </div>
                <div>
                  <Label>Giá khuyến mãi</Label>
                  <Input type="number" value={promoPrice || ''} onChange={e => setPromoPrice(Number(e.target.value))} placeholder="0" />
                </div>
              </div>
              <button type="button" className="mt-4 text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> Thêm giá sỉ
              </button>
            </section>

            {/* Đơn vị quy đổi */}
            <section>
              <SectionTitle>Đơn vị quy đổi</SectionTitle>
              <p className="text-xs text-gray-500 mb-3 italic">Chưa có đơn vị gốc</p>
              <button type="button" className="text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> Thêm đơn vị quy đổi
              </button>
            </section>

            {/* Phân loại sản phẩm */}
            <section>
              <SectionTitle>Phân loại sản phẩm</SectionTitle>
              <p className="text-xs text-gray-500 mb-3">Tạo phân loại nếu sản phẩm có nhiều thuộc tính khác nhau như màu sắc, kích thước...</p>
              
              <div className="space-y-3">
                {variants.map((v) => (
                  <div key={v.id} className="flex gap-2 items-center bg-[#262626] p-3 rounded-lg border border-[#333]">
                    <Input className="flex-1" value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="Tên phân loại" />
                    <Input className="w-24" type="number" value={v.stock} onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))} placeholder="Tồn" />
                    <Input className="w-32" type="number" value={v.price} onChange={e => updateVariant(v.id, 'price', Number(e.target.value))} placeholder="Giá" />
                    <button type="button" onClick={() => removeVariant(v.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addVariant} className="mt-4 text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> Thêm phân loại
              </button>
            </section>

            {/* Thông tin thêm */}
            <section className="border-t border-[#262626] pt-6">
              <SectionTitle>Thông tin thêm</SectionTitle>
              <div className="h-10"></div>
            </section>
          </div>

          {/* Right Column */}
          <div className="w-full md:w-[380px] p-6 bg-[#1a1a1a] space-y-6">
            
            {/* Ảnh sản phẩm */}
            <section>
              <div className="flex justify-between mb-4">
                 <SectionTitle>Ảnh sản phẩm (0/10)</SectionTitle>
              </div>
              <div className="aspect-square bg-[#262626] border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-primary/50 hover:bg-[#2a2a2a] transition-all group">
                 <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#3b3b3b]">
                    <ImageIcon size={32} />
                    <div className="absolute translate-x-4 translate-y-4 bg-primary text-white rounded-full p-1 border-2 border-[#262626]">
                      <Plus size={14} />
                    </div>
                 </div>
                 <p className="text-xs text-center px-4 leading-relaxed">Chọn/kéo thả ảnh vào đây (File PNG, JPG, cỡ tối thiểu 500×500)</p>
              </div>
            </section>

            {/* Tình trạng & Toggles */}
            <section className="space-y-4 divide-y divide-[#262626]">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-gray-200">Tình trạng</p>
                <div className="flex bg-[#262626] rounded-lg p-1 border border-[#333]">
                   <button 
                    type="button" 
                    onClick={() => setInStock(true)}
                    className={`px-3 py-1 text-[11px] font-bold rounded ${inStock ? 'bg-primary-light text-primary' : 'text-gray-500'}`}
                   >
                     Còn hàng
                   </button>
                   <button 
                    type="button" 
                    onClick={() => setInStock(false)}
                    className={`px-3 py-1 text-[11px] font-bold rounded ${!inStock ? 'bg-red-600/20 text-red-500' : 'text-gray-500'}`}
                   >
                     Hết hàng
                   </button>
                </div>
              </div>

              <Toggle 
                label="Theo dõi số lượng tồn kho" 
                active={trackStock} 
                onChange={setTrackStock} 
              />
              <Toggle 
                label="Áp dụng nguyên vật liệu" 
                active={applyMaterials} 
                onChange={setApplyMaterials} 
              />
              <Toggle 
                label="Cho phép khách xem giá sỉ" 
                subLabel="Chỉ hiển thị giá sỉ trong Chợ Sổ; mục Hỏi giá"
                active={allowWholesaleView} 
                onChange={setAllowWholesaleView} 
              />
              <Toggle 
                label="Hiển thị sản phẩm trên Website" 
                active={showOnWebsite} 
                onChange={setShowOnWebsite} 
              />
            </section>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-[#1a1a1a] border-t border-[#262626] flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-2 bg-[#262626] text-gray-300 rounded-lg text-sm font-bold border border-[#333] hover:bg-[#333]"
          >
            Hủy
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 shadow-lg shadow-primary-light active:scale-95 transition-all"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
