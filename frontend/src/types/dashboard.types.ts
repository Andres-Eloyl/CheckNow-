export type OrderStatus = 'sent' | 'preparing' | 'ready' | 'delivered';

export interface OrderModifier {
  name: string;
  extra_price: number;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  modifiers: OrderModifier[];
  notes?: string;
  destination?: 'kitchen' | 'bar' | 'both';
}

export interface Order {
  id: string;
  table: string | number;
  status: OrderStatus;
  items: OrderItem[];
  sent_at: string;
}

export interface MenuItemModifier {
  name: string;
  extra_price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_usd: number;
  prep_time_minutes: number;
  destination: 'kitchen' | 'bar' | 'both';
  category_id: string;
  stock_count: number;
  is_available: boolean;
  modifiers: MenuItemModifier[];
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
}
