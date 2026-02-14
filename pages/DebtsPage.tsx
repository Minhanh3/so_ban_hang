
import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, ArrowLeft, Filter, Phone, Calendar, DollarSign, AlertTriangle, Trash2, FileText, FileSpreadsheet } from 'lucide-react';
import { db } from '../services/storage';
import { Debt, DebtType } from '../types';
import { Link } from "react-router-dom";
import DebtModal from '../components/DebtModal';

const DebtsPage: React.FC = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeTab, setActiveTab] = useState<DebtType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshDebts = async () => {
    const list = await db.getDebts();
    setDebts(list);
  };

  useEffect(() => {
    refreshDebts();
  }, []);

  const handleSaveDebt = async (newDebt: Debt) => {
    await db.addDebt(newDebt);
    refreshDebts();
  };

  const filteredDebts = debts.filter(d => {
    const matchesTab = activeTab === 'all' || d.type === activeTab;
    const matchesSearch = d.contactName.toLowerCase().includes(search.toLowerCase()) ||
      (d.note || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleClearAll = async () => {
    console.log('handleClearAll clicked');
    if (confirm('Bạn có chắc chắn muốn xóa TẤT CẢ dữ liệu sổ nợ? Hành động này không thể hoàn tác!')) {
      console.log('Confirmed delete');
      await db.clearAllDebts();
      refreshDebts();
    } else {
      console.log('Cancelled delete');
    }
  };

  const handleExport = () => {
    import('../utils/csvExport').then(({ exportToCSV }) => {
      exportToCSV(debts, 'so_no');
    });
  };

  const handleExportPDF = () => {
    import('../utils/pdfExport').then(({ exportDebtsToPDF }) => {
      exportDebtsToPDF(debts);
    });
  };

  const totalReceivable = debts.filter(d => d.type === 'customer_receivable').reduce((s, d) => s + d.amount, 0);
  const totalPayable = debts.filter(d => d.type === 'supplier_payable').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sổ nợ</h2>
            <p className="text-gray-500 text-sm">Quản lý nợ khách hàng và nợ nhà cung cấp.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClearAll}
            className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-all border border-red-100"
            title="Xóa tất cả"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleExportPDF}
            className="bg-orange-50 text-orange-600 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-100 transition-all border border-orange-100"
            title="Xuất PDF"
          >
            <FileText size={18} />
          </button>
          <button
            onClick={handleExport}
            className="bg-green-50 text-green-600 px-3 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-100 transition-all border border-green-100"
            title="Xuất file"
          >
            <FileSpreadsheet size={18} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Ghi nợ mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-green-50 border border-green-100 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-green-600 uppercase">Khách nợ mình</span>
            <p className="text-2xl font-bold text-green-700">{totalReceivable.toLocaleString()}đ</p>
          </div>
          <DollarSign className="text-green-200" size={40} />
        </div>
        <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-red-600 uppercase">Mình nợ NCC</span>
            <p className="text-2xl font-bold text-red-700">{totalPayable.toLocaleString()}đ</p>
          </div>
          <AlertTriangle className="text-red-200" size={40} />
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button onClick={() => setActiveTab('all')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Tất cả</button>
        <button onClick={() => setActiveTab('customer_receivable')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'customer_receivable' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Khách nợ</button>
        <button onClick={() => setActiveTab('supplier_payable')} className={`px-6 py-4 text-sm font-bold border-b-2 ${activeTab === 'supplier_payable' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>Nợ NCC</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {filteredDebts.map(debt => (
          <div key={debt.id} className="p-4 hover:bg-gray-50 flex items-center justify-between border-b last:border-0 group">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${debt.type === 'customer_receivable' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {debt.contactName[0]}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{debt.contactName}</h4>
                <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {new Date(debt.date).toLocaleDateString('vi-VN')}</p>
                {debt.note && <p className="text-[10px] text-blue-600 mt-1 italic">#{debt.note}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold text-lg ${debt.type === 'customer_receivable' ? 'text-green-600' : 'text-red-600'}`}>
                {debt.type === 'customer_receivable' ? '+' : '-'}{debt.amount.toLocaleString()}đ
              </p>
            </div>
          </div>
        ))}
        {filteredDebts.length === 0 && <div className="p-12 text-center text-gray-400">Không có khoản nợ nào.</div>}
      </div>

      <DebtModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveDebt} />
    </div>
  );
};

export default DebtsPage;
