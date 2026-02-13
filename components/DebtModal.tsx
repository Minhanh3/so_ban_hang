
import React, { useState } from 'react';
import { X, Users, DollarSign, Calendar, FileText } from 'lucide-react';
import { Debt, DebtType, DebtStatus } from '../types';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debt: Debt) => void;
}

const DebtModal: React.FC<DebtModalProps> = ({ isOpen, onClose, onSave }) => {
  const [contactName, setContactName] = useState('');
  const [type, setType] = useState<DebtType>('customer_receivable');
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || amount <= 0) return;

    onSave({
      id: 'debt-' + Date.now(),
      type,
      contactName,
      amount,
      note,
      date: new Date(date).toISOString(),
      remindStatus: 'needed'
    });
    
    // Reset and close
    setContactName('');
    setAmount(0);
    setNote('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            Ghi nợ mới
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType('customer_receivable')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'customer_receivable' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              KHÁCH NỢ
            </button>
            <button
              type="button"
              onClick={() => setType('supplier_payable')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === 'supplier_payable' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              MÌNH NỢ
            </button>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tên liên hệ *</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                required
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Tên khách hàng hoặc NCC"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Số tiền (VNĐ) *</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                required
                type="number"
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ngày ghi nợ</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ghi chú</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập nội dung nợ..."
                rows={3}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${type === 'customer_receivable' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-red-600 hover:bg-red-700 shadow-red-100'}`}
          >
            Lưu khoản nợ
          </button>
        </form>
      </div>
    </div>
  );
};

export default DebtModal;
