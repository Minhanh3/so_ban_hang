
import React from 'react';
import { ShoppingBag, Truck, CreditCard, AlertCircle, TrendingDown, Bell, Calendar, DollarSign } from 'lucide-react';
import { TodoCardConfig } from './types';

export const TODO_CARDS: TodoCardConfig[] = [
  {
    id: 'pending_confirm',
    title: 'Đơn chờ xác nhận',
    description: 'Đơn online chờ kiểm kho và xác nhận.',
    path: '/orders',
    filter: 'pending_confirm',
    icon: 'ShoppingBag',
    type: 'order'
  },
  {
    id: 'shipping',
    title: 'Đơn đang giao',
    description: 'Đơn đang vận chuyển, cần theo dõi hoàn tất.',
    path: '/orders',
    filter: 'shipping',
    icon: 'Truck',
    type: 'order'
  },
  {
    id: 'unpaid',
    title: 'Đơn chưa thanh toán',
    description: 'Đơn đã tạo nhưng chưa thanh toán / còn nợ.',
    path: '/orders',
    filter: 'unpaid',
    icon: 'CreditCard',
    type: 'order'
  },
  {
    id: 'stock_out',
    title: 'Sản phẩm hết hàng',
    description: 'Sản phẩm tồn kho = 0 cần nhập thêm.',
    path: '/products',
    filter: 'out',
    icon: 'AlertCircle',
    type: 'product'
  },
  {
    id: 'stock_low',
    title: 'Sản phẩm tồn kho thấp',
    description: 'Sản phẩm sắp hết để đặt bổ sung.',
    path: '/products',
    filter: 'low',
    icon: 'TrendingDown',
    type: 'product'
  },
  {
    id: 'remind_due',
    title: 'Khách hàng cần nhắc nợ',
    description: 'Khách đến hạn nhắc nợ theo lịch.',
    path: '/debts',
    filter: 'due',
    icon: 'Bell',
    type: 'debt'
  },
  {
    id: 'remind_missing',
    title: 'Khách chưa có lịch nhắc nợ',
    description: 'Khách có nợ nhưng chưa được đặt lịch nhắc.',
    path: '/debts',
    filter: 'missing',
    icon: 'Calendar',
    type: 'debt'
  },
  {
    id: 'collect_needed',
    title: 'Cần thu nợ',
    description: 'Khách đang nợ và cần thu hồi.',
    path: '/debts',
    filter: 'needed',
    icon: 'DollarSign',
    type: 'debt'
  }
];

export const QUICK_ACTIONS = [
  { label: 'Bán hàng', path: '/pos' },
  { label: 'Quản lý hàng hóa', path: '/products' },
  { label: 'Quản lý tài chính', path: '/finance' },
];

export const LOW_STOCK_THRESHOLD = 10;
