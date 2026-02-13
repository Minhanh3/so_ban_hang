
import React from 'react';
import { Link } from "react-router-dom";
import * as LucideIcons from 'lucide-react';
import { TodoCardConfig } from '../types';

interface TodoCardProps {
  config: TodoCardConfig;
  count: number;
}

const TodoCard: React.FC<TodoCardProps> = ({ config, count }) => {
  const Icon = (LucideIcons as any)[config.icon];

  return (
    <Link 
      to={`${config.path}?status=${config.filter}`}
      className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl transition-all duration-300 ${
          count > 0 
          ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white shadow-lg shadow-green-100/50' 
          : 'bg-slate-50 text-slate-400'
        }`}>
          {Icon ? <Icon size={24} strokeWidth={2.5} /> : <div className="w-6 h-6" />}
        </div>
        {count > 0 && (
          <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full animate-bounce shadow-lg shadow-red-200 uppercase tracking-widest">
            Mới
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-base font-black text-slate-900 group-hover:text-green-600 transition-colors leading-tight">
          {config.title}
        </h3>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed font-medium">
          {config.description}
        </p>
      </div>

      <div className="mt-8 pt-5 border-t border-slate-50 flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-black text-slate-300 tracking-[0.2em] mb-1">Số lượng</span>
          <span className={`text-4xl font-black tracking-tight ${count > 0 ? 'text-green-600' : 'text-slate-200'}`}>
            {count}
          </span>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-green-50 group-hover:text-green-600 transition-all">
          <LucideIcons.ArrowRight size={20} />
        </div>
      </div>
    </Link>
  );
};

export default TodoCard;
