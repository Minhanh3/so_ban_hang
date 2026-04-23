import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { Product, ProductVariant } from '../types';

type ProductVariantForm = Omit<ProductVariant, 'price' | 'stock'> & {
  price: string;
  stock: string;
};

const toInputValue = (value?: number): string => {
  if (!value) {
    return '';
  }
  return String(value);
};

const parseNonNegativeInteger = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, Math.floor(parsed));
};

const parseNonNegativeNumber = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return Math.max(0, parsed);
};

const Label = ({ children, required }: { children?: React.ReactNode; required?: boolean }) => (
  <label className="block text-xs font-medium text-gray-400 mb-1.5">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={`w-full bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary transition-all ${props.className || ''}`}
  />
);

const SectionTitle = ({ children }: { children?: React.ReactNode }) => (
  <h3 className="text-sm font-bold text-gray-100 mb-4">{children}</h3>
);

const Toggle = ({
  active,
  onChange,
  label,
  subLabel,
}: {
  active: boolean;
  onChange: (value: boolean) => void;
  label: string;
  subLabel?: string;
}) => (
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
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');

  const [basePriceInput, setBasePriceInput] = useState('');
  const [costPriceInput, setCostPriceInput] = useState('');
  const [promoPriceInput, setPromoPriceInput] = useState('');
  const [totalStockInput, setTotalStockInput] = useState('');

  const [variants, setVariants] = useState<ProductVariantForm[]>([]);

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
      setBasePriceInput(toInputValue(initialProduct.basePrice));
      setCostPriceInput(toInputValue(initialProduct.costPrice));
      setPromoPriceInput(toInputValue(initialProduct.promoPrice));
      setTotalStockInput(toInputValue(initialProduct.totalStock));
      setVariants(
        initialProduct.variants.map((variant) => ({
          ...variant,
          price: toInputValue(variant.price),
          stock: toInputValue(variant.stock),
        })),
      );
      setInStock(initialProduct.inStock);
      setTrackStock(initialProduct.trackStock);
      setApplyMaterials(initialProduct.applyMaterials);
      setAllowWholesaleView(initialProduct.allowWholesaleView);
      setShowOnWebsite(initialProduct.showOnWebsite);
      return;
    }

    setName('');
    setUnit('');
    setCategory('');
    setSku('');
    setBarcode('');
    setBasePriceInput('');
    setCostPriceInput('');
    setPromoPriceInput('');
    setTotalStockInput('');
    setVariants([]);
    setInStock(true);
    setTrackStock(true);
    setApplyMaterials(false);
    setAllowWholesaleView(false);
    setShowOnWebsite(true);
  }, [initialProduct, isOpen]);

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        id: `v-${Date.now()}`,
        name: '',
        price: basePriceInput || '0',
        stock: '0',
      },
    ]);
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((variant) => variant.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariantForm, value: string) => {
    setVariants((prev) =>
      prev.map((variant) => (variant.id === id ? { ...variant, [field]: value } : variant)),
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedVariants: ProductVariant[] = variants.map((variant) => ({
      ...variant,
      name: variant.name.trim(),
      price: parseNonNegativeNumber(variant.price),
      stock: parseNonNegativeInteger(variant.stock),
    }));

    const finalTotalStock =
      normalizedVariants.length > 0
        ? normalizedVariants.reduce((sum, variant) => sum + variant.stock, 0)
        : parseNonNegativeInteger(totalStockInput);

    onSave({
      id: initialProduct?.id || `prod-${Date.now()}`,
      name: name.trim(),
      unit: unit.trim(),
      category: category.trim(),
      sku: sku.trim(),
      barcode: barcode.trim(),
      basePrice: parseNonNegativeNumber(basePriceInput),
      costPrice: parseNonNegativeNumber(costPriceInput),
      promoPrice: parseNonNegativeNumber(promoPriceInput),
      totalStock: finalTotalStock,
      variants: normalizedVariants,
      inStock,
      trackStock,
      applyMaterials,
      allowWholesaleView,
      showOnWebsite,
      images: initialProduct?.images || [],
    });

    onClose();
  };

  if (!isOpen) {
    return null;
  }

  const totalVariantStock = variants.reduce(
    (sum, variant) => sum + parseNonNegativeInteger(variant.stock),
    0,
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#121212] w-full h-full md:max-w-[1200px] md:h-[90vh] md:rounded-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-primary px-6 py-3 flex justify-between items-center text-white">
          <h2 className="text-base font-bold">{initialProduct ? 'Chá»‰nh sá»­a sáº£n pháº©m' : 'Táº¡o sáº£n pháº©m má»›i'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form id="product-modal-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col md:flex-row bg-[#1a1a1a]">
          <div className="flex-1 p-6 space-y-8 border-r border-[#262626]">
            <section>
              <SectionTitle>ThÃ´ng tin chung</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                  <Label required>TÃªn sáº£n pháº©m</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="TÃªn sáº£n pháº©m" required />
                </div>
                <div>
                  <Label>ÄÆ¡n vá»‹</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="VÃ­ dá»¥: Lon" />
                </div>
                <div className="md:col-span-1">
                  <Label>Danh má»¥c</Label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#262626] border border-[#333] rounded-lg px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary appearance-none"
                    >
                      <option value="">Chá»n 1 hoáº·c nhiá»u</option>
                      <option value="Äá»“ uá»‘ng">Äá»“ uá»‘ng</option>
                      <option value="Thá»©c Äƒn">Thá»©c Äƒn</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 text-gray-500 pointer-events-none" size={16} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 md:col-span-1">
                  <div>
                    <Label>MÃ£ sáº£n pháº©m (SKU)</Label>
                    <Input value={sku} onChange={(e) => setSku(e.target.value)} />
                  </div>
                  <div>
                    <Label>MÃ£ váº¡ch sáº£n xuáº¥t</Label>
                    <Input value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <SectionTitle>GiÃ¡ sáº£n pháº©m & Tá»“n kho</SectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>GiÃ¡ bÃ¡n</Label>
                  <Input type="number" value={basePriceInput} onChange={(e) => setBasePriceInput(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>GiÃ¡ vá»‘n (GiÃ¡ nháº­p)</Label>
                  <Input type="number" value={costPriceInput} onChange={(e) => setCostPriceInput(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>GiÃ¡ khuyáº¿n mÃ£i</Label>
                  <Input type="number" value={promoPriceInput} onChange={(e) => setPromoPriceInput(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Tá»“n kho</Label>
                  <Input
                    type="number"
                    value={variants.length > 0 ? String(totalVariantStock) : totalStockInput}
                    onChange={(e) => setTotalStockInput(e.target.value)}
                    placeholder="0"
                    disabled={variants.length > 0}
                    className={variants.length > 0 ? 'opacity-50 cursor-not-allowed' : ''}
                  />
                  {variants.length > 0 && <p className="text-[10px] text-gray-500 mt-1">Tá»± Ä‘á»™ng tÃ­nh tá»« phÃ¢n loáº¡i</p>}
                </div>
              </div>
              <button type="button" className="mt-4 text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> ThÃªm giÃ¡ sá»‰
              </button>
            </section>

            <section>
              <SectionTitle>ÄÆ¡n vá»‹ quy Ä‘á»•i</SectionTitle>
              <p className="text-xs text-gray-500 mb-3 italic">ChÆ°a cÃ³ Ä‘Æ¡n vá»‹ gá»‘c</p>
              <button type="button" className="text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> ThÃªm Ä‘Æ¡n vá»‹ quy Ä‘á»•i
              </button>
            </section>

            <section>
              <SectionTitle>PhÃ¢n loáº¡i sáº£n pháº©m</SectionTitle>
              <p className="text-xs text-gray-500 mb-3">Táº¡o phÃ¢n loáº¡i náº¿u sáº£n pháº©m cÃ³ nhiá»u thuá»™c tÃ­nh khÃ¡c nhau nhÆ° mÃ u sáº¯c, kÃ­ch thÆ°á»›c...</p>

              <div className="space-y-3">
                {variants.map((variant) => (
                  <div key={variant.id} className="flex gap-2 items-center bg-[#262626] p-3 rounded-lg border border-[#333]">
                    <Input
                      className="flex-1"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                      placeholder="TÃªn phÃ¢n loáº¡i"
                    />
                    <Input
                      className="w-24"
                      type="number"
                      value={variant.stock}
                      onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                      placeholder="Tá»“n"
                    />
                    <Input
                      className="w-32"
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                      placeholder="GiÃ¡"
                    />
                    <button type="button" onClick={() => removeVariant(variant.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addVariant} className="mt-4 text-[#3b82f6] text-xs font-bold flex items-center gap-1.5 hover:underline">
                <Plus size={14} strokeWidth={3} /> ThÃªm phÃ¢n loáº¡i
              </button>
            </section>

            <section className="border-t border-[#262626] pt-6">
              <SectionTitle>ThÃ´ng tin thÃªm</SectionTitle>
              <div className="h-10" />
            </section>
          </div>

          <div className="w-full md:w-[380px] p-6 bg-[#1a1a1a] space-y-6">
            <section>
              <div className="flex justify-between mb-4">
                <SectionTitle>áº¢nh sáº£n pháº©m (0/10)</SectionTitle>
              </div>
              <div className="aspect-square bg-[#262626] border-2 border-dashed border-[#333] rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-primary/50 hover:bg-[#2a2a2a] transition-all group">
                <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mb-4 group-hover:bg-[#3b3b3b]">
                  <ImageIcon size={32} />
                  <div className="absolute translate-x-4 translate-y-4 bg-primary text-white rounded-full p-1 border-2 border-[#262626]">
                    <Plus size={14} />
                  </div>
                </div>
                <p className="text-xs text-center px-4 leading-relaxed">Chá»n/kÃ©o tháº£ áº£nh vÃ o Ä‘Ã¢y (File PNG, JPG, cá»¡ tá»‘i thiá»ƒu 500Ã—500)</p>
              </div>
            </section>

            <section className="space-y-4 divide-y divide-[#262626]">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-gray-200">TÃ¬nh tráº¡ng</p>
                <div className="flex bg-[#262626] rounded-lg p-1 border border-[#333]">
                  <button
                    type="button"
                    onClick={() => setInStock(true)}
                    className={`px-3 py-1 text-[11px] font-bold rounded ${inStock ? 'bg-primary-light text-primary' : 'text-gray-500'}`}
                  >
                    CÃ²n hÃ ng
                  </button>
                  <button
                    type="button"
                    onClick={() => setInStock(false)}
                    className={`px-3 py-1 text-[11px] font-bold rounded ${!inStock ? 'bg-red-600/20 text-red-500' : 'text-gray-500'}`}
                  >
                    Háº¿t hÃ ng
                  </button>
                </div>
              </div>

              <Toggle label="Theo dÃµi sá»‘ lÆ°á»£ng tá»“n kho" active={trackStock} onChange={setTrackStock} />
              <Toggle label="Ãp dá»¥ng nguyÃªn váº­t liá»‡u" active={applyMaterials} onChange={setApplyMaterials} />
              <Toggle
                label="Cho phÃ©p khÃ¡ch xem giÃ¡ sá»‰"
                subLabel="Chá»‰ hiá»ƒn thá»‹ giÃ¡ sá»‰ trong Chá»£ Sá»•; má»¥c Há»i giÃ¡"
                active={allowWholesaleView}
                onChange={setAllowWholesaleView}
              />
              <Toggle label="Hiá»ƒn thá»‹ sáº£n pháº©m trÃªn Website" active={showOnWebsite} onChange={setShowOnWebsite} />
            </section>
          </div>
        </form>

        <div className="p-4 bg-[#1a1a1a] border-t border-[#262626] flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#262626] text-gray-300 rounded-lg text-sm font-bold border border-[#333] hover:bg-[#333]"
          >
            Há»§y
          </button>
          <button
            type="submit"
            form="product-modal-form"
            className="px-8 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 shadow-lg shadow-primary-light active:scale-95 transition-all"
          >
            XÃ¡c nháº­n
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
