import React, { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Save, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../services/storage';
import { useAuth } from '../src/context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [orderFilePrefix, setOrderFilePrefix] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await db.getShopSettings();
      setName(settings.distributor.name || '');
      setPhone(settings.distributor.phone || '');
      setAddress(settings.distributor.address || '');
      setOrderFilePrefix(settings.orderFilePrefix || '');
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
      orderFilePrefix,
    });
    setSavedAt(new Date().toLocaleString('vi-VN'));
    setIsSaving(false);
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin mật khẩu.' });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordMessage({ type: 'error', text: 'Mật khẩu mới cần tối thiểu 4 ký tự.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Xác nhận mật khẩu không khớp.' });
      return;
    }

    setIsChangingPassword(true);
    const result = await changePassword({
      currentPassword,
      newPassword,
    });
    setIsChangingPassword(false);

    setPasswordMessage({
      type: result.success ? 'success' : 'error',
      text: result.message,
    });

    if (result.success) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      <div className="flex items-center gap-3">
        <Link to="/" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Cài đặt</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Tùy chỉnh thông tin shop, tên file đơn hàng và bảo mật tài khoản.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Vận hành đơn hàng</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">Thông tin nhà phân phối</h3>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              Lưu theo người dùng
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Tên nhà phân phối
            </label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ví dụ: Tủ nhôm Trang Dương"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Số điện thoại nhà phân phối
            </label>
            <input
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="Ví dụ: 0989316685"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Địa chỉ nhà phân phối
            </label>
            <textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              placeholder="Ví dụ: Chợ đầu mối Thổ Tang, Vĩnh Tường, Vĩnh Phúc"
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Tiền tố tên file đơn hàng
            </label>
            <input
              type="text"
              value={orderFilePrefix}
              onChange={(event) => setOrderFilePrefix(event.target.value)}
              placeholder="Ví dụ: tu_nhom_trang_duong"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-400 dark:text-slate-400">
              {savedAt ? `Đã lưu lúc ${savedAt}` : 'Thông tin này sẽ được gắn vào đơn mới và tên file xuất đơn của đúng người dùng hiện tại.'}
            </p>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-white transition-all hover:opacity-90 disabled:opacity-70"
            >
              <Save size={16} />
              {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
            </button>
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-700">
              <ShieldCheck size={18} />
              <p className="text-sm font-black uppercase tracking-[0.2em]">Tài khoản đang dùng</p>
            </div>
            <p className="mt-3 text-lg font-bold text-slate-900 dark:text-slate-100">{user?.displayName || 'Tài khoản'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username || 'guest'}</p>
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Bảo mật</p>
            <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">Đổi mật khẩu</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Mật khẩu mới chỉ áp dụng cho tài khoản đang đăng nhập. Dữ liệu các tài khoản khác sẽ không bị ảnh hưởng.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Mật khẩu hiện tại
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          {passwordMessage && (
            <div className={`rounded-2xl px-4 py-3 text-sm font-medium ${passwordMessage.type === 'success' ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-rose-200 bg-rose-50 text-rose-600'}`}>
              {passwordMessage.text}
            </div>
          )}

          <button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
          >
            <KeyRound size={16} />
            {isChangingPassword ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
