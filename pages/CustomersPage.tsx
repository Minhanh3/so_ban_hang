import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../services/storage';
import { Customer } from '../types';

const emptyForm = {
  id: '',
  name: '',
  phone: '',
  note: '',
};

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadCustomers = async () => {
    const list = await db.getCustomers();
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return customers;
    }

    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(keyword)
      || customer.phone.toLowerCase().includes(keyword)
      || (customer.note || '').toLowerCase().includes(keyword),
    );
  }, [customers, search]);

  const resetForm = () => {
    setForm(emptyForm);
    setActiveCustomerId(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name || !phone) {
      setMessage('Vui lòng nhập tên và số điện thoại khách hàng.');
      return;
    }

    setIsSaving(true);
    try {
      const savedCustomer = await db.upsertCustomer({
        id: form.id || undefined,
        name,
        phone,
        note: form.note.trim(),
      });

      await loadCustomers();
      setForm({
        id: savedCustomer.id,
        name: savedCustomer.name,
        phone: savedCustomer.phone,
        note: savedCustomer.note || '',
      });
      setActiveCustomerId(savedCustomer.id);
      setMessage(form.id ? 'Đã cập nhật khách hàng.' : 'Đã thêm khách hàng.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setForm({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      note: customer.note || '',
    });
    setActiveCustomerId(customer.id);
    setMessage(null);
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Xóa khách hàng "${customer.name}"?`)) {
      return;
    }

    await db.deleteCustomer(customer.id);
    await loadCustomers();
    if (form.id === customer.id || activeCustomerId === customer.id) {
      resetForm();
    }
    setMessage('Đã xóa khách hàng.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-slate-900 dark:text-slate-100">
      <div className="flex items-center gap-3">
        <Link to="/" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-slate-400 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Quản lý khách</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">Lưu danh sách khách hàng để tìm và chọn lại nhanh trong POS.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-gray-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-300" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, số điện thoại hoặc ghi chú..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                  activeCustomerId === customer.id ? 'bg-primary-light/40' : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary">
                      <Users size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900 dark:text-slate-100">{customer.name}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">{customer.phone}</p>
                    </div>
                  </div>
                  {customer.note && (
                    <p className="mt-2 pl-14 text-sm text-slate-500 dark:text-slate-300">{customer.note}</p>
                  )}
                  <p className="mt-2 pl-14 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Cập nhật: {new Date(customer.updatedAt).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(customer)}
                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
                    title="Sửa khách hàng"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(customer)}
                    className="rounded-xl border border-rose-200 p-2 text-rose-500 transition-colors hover:bg-rose-50 dark:border-rose-400/30"
                    title="Xóa khách hàng"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}

            {filteredCustomers.length === 0 && (
              <div className="px-5 py-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">
                Chưa có khách hàng nào phù hợp.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Danh bạ khách</p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 dark:text-slate-100">
                {form.id ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng'}
              </h3>
            </div>
            <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {customers.length} khách
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Tên khách hàng
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, name: e.target.value }));
                  setMessage(null);
                }}
                placeholder="Ví dụ: Nguyễn Văn A"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Số điện thoại
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, phone: e.target.value }));
                  setMessage(null);
                }}
                placeholder="Ví dụ: 09xxxxxxxx"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                Ghi chú
              </label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, note: e.target.value }));
                  setMessage(null);
                }}
                placeholder="Ví dụ: Khách quen, ưu tiên giao buổi chiều..."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {message && (
              <div className="rounded-2xl border border-primary/20 bg-primary-light px-4 py-3 text-sm font-medium text-primary">
                {message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Làm mới
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-bold text-white transition-all hover:opacity-90 disabled:opacity-70"
              >
                <Plus size={16} />
                {isSaving ? 'Đang lưu...' : form.id ? 'Cập nhật' : 'Thêm khách'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default CustomersPage;
