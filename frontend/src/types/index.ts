/**
 * CheckNow! — Core UI Types
 * These types bridge the old frontend UI components with the new API types.
 * Re-exports from api.types.ts for convenience.
 */

// Re-export API types that UI components need
export type { 
  MenuItemResponse,
  MenuCategoryFull,
  MenuResponse,
  ModifierResponse,
  OrderItemResponse,
  SessionUserResponse,
  CategoryResponse,
} from './api.types';

/**
 * Legacy User type for UI display.
 * Maps from SessionUserResponse for backward-compatible avatar rendering.
 */
export type User = {
  id: string;
  name: string;
  avatarColor: string;
  emoji: string;
  totalSpent: number;
};

/**
 * Legacy MenuItem type for UI components that haven't migrated yet.
 * Components should prefer MenuItemResponse from api.types directly.
 */
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  tag?: string;
};

/**
 * Legacy OrderItem type for UI components that haven't migrated yet.
 * Components should prefer OrderItemResponse from api.types directly.
 */
export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  userId: string;
  quantity: number;
  modifiers: string[];
};
