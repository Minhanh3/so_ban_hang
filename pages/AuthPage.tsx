import React, { useState } from 'react';
import { LockKeyhole, LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useAuth } from '../src/context/AuthContext';

type AuthMode = 'login' | 'register';

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const resetFormState = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'register') {
      if (!displayName.trim()) {
        setError('Vui lòng nhập tên hiển thị.');
        return;
      }

      if (username.trim().length > 12) {
        setError('Tên đăng nhập tối đa 12 ký tự.');
        return;
      }

      if (!emailPattern.test(email.trim())) {
        setError('Email không đúng định dạng.');
        return;
      }

      if (password.trim().length < 6 || password.trim().length > 10) {
        setError('Mật khẩu phải từ 6 đến 10 ký tự.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
    }

    setIsSubmitting(true);
    const result = mode === 'login'
      ? await login({ username, password })
      : await register({ username, email, displayName, password });
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    if (mode === 'register') {
      setSuccess(result.message || 'Đăng ký thành công. Vui lòng đăng nhập để vào hệ thống.');
      setMode('login');
      setPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.14),_transparent_38%),linear-gradient(135deg,#eff6ff_0%,#f8fafc_42%,#fefce8_100%)] text-slate-900 dark:bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_32%),linear-gradient(135deg,#020617_0%,#0f172a_45%,#1e293b_100%)] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-5 py-10 lg:flex-row lg:items-center lg:px-8">
        <section className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            <ShieldCheck size={14} />
            Sổ Bán Hàng
          </div>
          <div className="space-y-4">
            <h1 className="max-w-lg text-4xl font-black leading-tight text-slate-900 dark:text-slate-100 md:text-5xl">
              Quản lý cửa hàng theo từng tài khoản đăng nhập.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 md:text-lg">
              Mỗi người dùng sẽ có bộ dữ liệu riêng cho sản phẩm, đơn hàng, công nợ và cài đặt. Đăng nhập để tiếp tục làm việc trên đúng kho dữ liệu của bạn.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/80 bg-white/70 p-5 shadow-lg shadow-slate-200/40 backdrop-blur dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Phân quyền dữ liệu</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Dữ liệu được tách riêng theo người dùng đăng nhập, tránh ghi đè lên nhau trên cùng trình duyệt.
              </p>
            </div>
            <div className="rounded-3xl border border-white/80 bg-slate-900 p-5 text-slate-50 shadow-2xl shadow-slate-300/40 dark:border-slate-700">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Tài khoản nội bộ</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">
                Luồng đăng ký, đăng nhập và đổi mật khẩu được xử lý ngay trong ứng dụng để phù hợp với bộ code hiện tại.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full max-w-md">
          <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.14)] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
            <div className="border-b border-slate-100 p-3 dark:border-slate-700">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => resetFormState('login')}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${mode === 'login' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  onClick={() => resetFormState('register')}
                  className={`rounded-2xl px-4 py-3 text-sm font-bold transition-all ${mode === 'register' ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 dark:text-slate-300'}`}
                >
                  Đăng ký
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6 md:p-8">
              <div className="space-y-1">
                <p className="text-2xl font-black text-slate-900">
                  {mode === 'login' ? 'Trở lại công việc' : 'Tạo tài khoản mới'}
                </p>
                <p className="text-sm leading-6 text-slate-500">
                  {mode === 'login'
                    ? 'Nhập tài khoản để vào đúng bộ dữ liệu của bạn.'
                    : 'Tài khoản mới sẽ có kho dữ liệu riêng ngay sau khi tạo.'}
                </p>
              </div>

              {mode === 'register' && (
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Tên hiển thị
                  </span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Ví dụ: Admin Shop"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              )}

              {mode === 'register' && (
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Email
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Ví dụ: ban@example.com"
                    autoComplete="email"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Tên đăng nhập
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                  Mật khẩu
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Nhập mật khẩu"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>

              {mode === 'register' && (
                <label className="block">
                  <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
                    Xác nhận mật khẩu
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </label>
              )}

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                {isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
              </button>

              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-100">
                  <LockKeyhole size={16} />
                  Lưu ý
                </div>
                <p className="mt-2">
                  Đây là cơ chế đăng nhập nội bộ trên localStorage. Phù hợp cho máy/trình duyệt hiện tại, không thay thế auth server cho môi trường production.
                </p>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
