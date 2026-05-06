export enum UserRole {
  SELLER = 'seller',
  BUYER = 'buyer',
}

export interface User {
  email: string;
  password?: string;
  role: UserRole;
  name: string;
  contact?: string;
  address?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  img: string;
  stock: number;
  umkm_address_text: string;
  recommended: boolean;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export interface Order {
  id: string;
  buyerName: string;
  contact: string;
  address: string;
  email: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cod' | 'qris';
  status: OrderStatus;
  date: string;
}
