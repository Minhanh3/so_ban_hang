import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Link } from 'react-router-dom';
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
      className="group flex h-full flex-col rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mb-6 flex items-start justify-between">
        <div
          className={`rounded-2xl p-4 transition-all duration-300 ${
            count > 0
              ? 'bg-primary-light text-primary shadow-lg shadow-primary-light group-hover:bg-primary group-hover:text-white'
              : 'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          {Icon ? <Icon size={24} strokeWidth={2.5} /> : <div className="h-6 w-6" />}
        </div>
        {count > 0 && (
          <div className="animate-bounce rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-red-200">
            Mới
          </div>
        )}
      </div>

      <div className="flex-1">
        <h3 className="text-base font-black leading-tight text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
          {config.title}
        </h3>
        <p className="mt-2 text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-300">{config.description}</p>
      </div>

      <div className="mt-8 flex items-end justify-between border-t border-slate-50 pt-5 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-300">Số lượng</span>
          <span className={`text-4xl font-black tracking-tight ${count > 0 ? 'text-primary' : 'text-slate-200'}`}>{count}</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 transition-all group-hover:bg-primary-light group-hover:text-primary dark:bg-slate-800 dark:text-slate-300">
          <LucideIcons.ArrowRight size={20} />
        </div>
      </div>
    </Link>
  );
};

export default TodoCard;
