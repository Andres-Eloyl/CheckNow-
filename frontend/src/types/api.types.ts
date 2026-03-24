/**
 * CheckNow! — API Type Definitions
 * Auto-generated from backend Pydantic schemas.
 * These types mirror the API request/response models exactly.
 */

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export interface RestaurantRegisterRequest {
  name: string;
  slug: string;
  email: string;
  password: string;
  phone?: string;
  country?: string;
}

export interface RestaurantLoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  restaurant_id: string;
  slug: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface StaffLoginRequest {
  name: string;
  pin: string;
}

export interface StaffTokenResponse {
  access_token: string;
  token_type: string;
  staff_id: string;
  name: string;
  role: StaffRole;
}

export type StaffRole = 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen' | 'bar';

// ──────────────────────────────────────────────
// Restaurant
// ──────────────────────────────────────────────

export interface RestaurantPublic {
  id: string;
  slug: string;
  name: string;
  country: string;
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  accepted_methods?: string[];
}

export interface RestaurantMeResponse {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  country: string;
  is_active: boolean;
}

export interface RestaurantConfigUpdate {
  tax_rate?: number;
  service_charge?: number;
  currency_primary?: string;
  accepted_methods?: string[];
  primary_color?: string;
  secondary_color?: string;
  wifi_ssid?: string;
  wifi_password?: string;
  logo_url?: string;
  cross_sell_enabled?: boolean;
  loyalty_enabled?: boolean;
}

export interface RestaurantConfigResponse {
  restaurant_id: string;
  tax_rate: number;
  service_charge: number;
  currency_primary: string;
  accepted_methods: string[];
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  wifi_ssid?: string;
  cross_sell_enabled: boolean;
  loyalty_enabled: boolean;
}

// ──────────────────────────────────────────────
// Menu
// ──────────────────────────────────────────────

export interface CategoryCreate {
  name: string;
  display_order?: number;
  icon?: string;
}

export interface CategoryUpdate {
  name?: string;
  display_order?: number;
  icon?: string;
  is_active?: boolean;
}

export interface CategoryResponse {
  id: string;
  name: string;
  display_order: number;
  icon?: string;
  is_active: boolean;
}

export interface ModifierCreate {
  name: string;
  extra_price?: number;
}

export interface ModifierResponse {
  id: string;
  name: string;
  extra_price: number;
  is_active: boolean;
}

export interface MenuItemCreate {
  category_id: string;
  name: string;
  description?: string;
  price_usd: number;
  destination?: string;
  prep_time_min?: number;
  sku?: string;
  display_order?: number;
  is_featured?: boolean;
  stock_count?: number;
  tags?: string[];
}

export interface MenuItemUpdate {
  name?: string;
  description?: string;
  price_usd?: number;
  destination?: string;
  prep_time_min?: number;
  sku?: string;
  display_order?: number;
  is_available?: boolean;
  is_featured?: boolean;
  stock_count?: number;
  tags?: string[];
}

export interface MenuItemResponse {
  id: string;
  category_id: string;
  name: string;
  description?: string;
  price_usd: number;
  image_url?: string;
  destination: string;
  prep_time_min: number;
  display_order: number;
  is_available: boolean;
  is_featured: boolean;
  stock_count?: number;
  tags: string[];
  modifiers: ModifierResponse[];
}

export interface MenuCategoryFull {
  id: string;
  name: string;
  display_order: number;
  icon?: string;
  items: MenuItemResponse[];
}

export interface MenuResponse {
  categories: MenuCategoryFull[];
}

// ──────────────────────────────────────────────
// Sessions
// ──────────────────────────────────────────────

export interface SessionCreate {
  table_id: string;
}

export interface SessionJoin {
  alias: string;
}

export interface SessionUserResponse {
  id: string;
  alias: string;
  color: string;
  emoji?: string;
  joined_at: string;
}

export interface SessionResponse {
  id: string;
  table_id: string;
  table_number?: number;
  token: string;
  status: SessionStatus;
  opened_at: string;
  expires_at: string;
  users: SessionUserResponse[];
  total_amount: number;
}

export type SessionStatus = 'open' | 'in_progress' | 'closed';

export interface SessionBalanceResponse {
  total: number;
  tax: number;
  tips: number;
  paid: number;
  remaining: number;
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────

export interface OrderItemCreate {
  menu_item_id: string;
  quantity?: number;
  modifiers?: string[];
  notes?: string;
  is_shared?: boolean;
}

export interface OrderItemResponse {
  id: string;
  session_user_id: string;
  session_user_alias?: string;
  menu_item_id: string;
  menu_item_name?: string;
  table_number?: string;
  quantity: number;
  unit_price: number;
  modifiers: string[];
  notes?: string;
  status: OrderStatus;
  is_shared: boolean;
  is_locked: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'sent' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

export interface OrderStatusUpdate {
  status: OrderStatus;
}

export interface OrderConfirmResponse {
  message: string;
  items_sent: number;
}

// ──────────────────────────────────────────────
// Checkout & Payments
// ──────────────────────────────────────────────

export interface CheckoutSummary {
  user_id: string;
  alias: string;
  subtotal: number;
  tax: number;
  service_charge: number;
  suggested_tip_10: number;
  suggested_tip_15: number;
  suggested_tip_20: number;
  total_before_tip: number;
}

export interface PaymentCreate {
  amount_usd: number;
  currency: string;
  method: PaymentMethod;
  tip_amount?: number;
  reference_code?: string;
  exchange_rate?: number;
  amount_local?: number;
}

export interface PaymentResponse {
  id: string;
  session_user_id: string;
  user_alias?: string;
  table_number?: number;
  amount_usd: number;
  amount_local?: number;
  currency: string;
  method: string;
  tip_amount: number;
  status: PaymentStatus;
  reference_code?: string;
  rejection_reason?: string;
  created_at: string;
}

export type PaymentMethod = 'pago_movil' | 'zelle' | 'efectivo' | 'tarjeta';
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface PaymentReject {
  reason: string;
}

export interface ExchangeRateResponse {
  date: string;
  usd_to_ves: number;
  source: string;
  fetched_at: string;
}

// ──────────────────────────────────────────────
// Splits
// ──────────────────────────────────────────────

export interface SplitCreate {
  order_item_id: string;
  participants: string[];
  fractions?: number[];
}

export interface SplitResponse {
  id: string;
  order_item_id: string;
  order_item_name?: string;
  requested_by: string;
  session_user_id: string;
  fraction: number;
  amount_owed: number;
  accepted: boolean;
  expires_at: string;
}

export interface PayForRequest {
  order_item_id: string;
  beneficiary_user_id: string;
}

// ──────────────────────────────────────────────
// Tables
// ──────────────────────────────────────────────

export interface TableCreate {
  number: number;
  label?: string;
  capacity?: number;
}

export interface TableUpdate {
  label?: string;
  capacity?: number;
}

export interface TableResponse {
  id: string;
  number: number;
  label?: string;
  capacity: number;
  status: TableStatus;
  qr_url?: string;
}

export type TableStatus = 'free' | 'active' | 'reserved';

// ──────────────────────────────────────────────
// Staff
// ──────────────────────────────────────────────

export interface StaffCreate {
  name: string;
  pin: string;
  role: StaffRole;
}

export interface StaffUpdate {
  name?: string;
  pin?: string;
  role?: string;
  is_active?: boolean;
}

export interface StaffResponse {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

// ──────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────

export interface NotificationResponse {
  id: string;
  table_number?: number;
  type: string;
  title: string;
  message?: string;
  is_read: boolean;
  created_at: string;
}

// ──────────────────────────────────────────────
// WebSocket Events
// ──────────────────────────────────────────────

export type WSEventType =
  | 'item_added'
  | 'item_removed'
  | 'order_confirmed'
  | 'order_status'
  | 'order_status_changed'
  | 'new_order'
  | 'payment_pending'
  | 'payment_verified'
  | 'payment_rejected'
  | 'split_proposed'
  | 'split_accepted'
  | 'yo_invito'
  | 'item_sold_out';

export interface WSMessage<T = unknown> {
  event: WSEventType;
  data: T;
}
