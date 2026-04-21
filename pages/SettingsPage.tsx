import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../services/storage';

const SettingsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await db.getShopSettings();
      setName(settings.distributor.name || '');
      setPhone(settings.distributor.phone || '');
      setAddress(settings.distributor.address || '');
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await db.saveShopSettings({
      distributor: {
        name,
        phone,
        address,
      },
    });
    setSavedAt(new Date().toLocaleString('vi-VN'));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cài đặt</h2>
          <p className="text-gray-500 text-sm">Tùy chỉnh thông tin nhà phân phối hiển thị trên đơn hàng.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6 space-y-5">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Tên nhà phân phối
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: Tủ nhôm Trang Dương"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Số điện thoại nhà phân phối
          </label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ví dụ: 0989316685"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            Địa chỉ nhà phân phối
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ví dụ: Chợ đầu mối Thọ Tang, Vĩnh Tường, Phú Thọ"
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <p className="text-xs text-gray-400">
            {savedAt ? `Đã lưu lúc ${savedAt}` : 'Thông tin này sẽ được gắn vào đơn hàng khi tạo mới.'}
          </p>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-70"
          >
            <Save size={16} />
            {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
