/**
 * AI Context: Core entity representing a diner at the table.
 */
export type User = {
  /** Unique identifier for the user session. */
  id: string;
  /** Display name or alias chosen by the user. */
  name: string;
  /** Tailwind class for the avatar background (e.g., 'bg-primary'). */
  avatarColor: string;
  /** Selected emoji used as an avatar. */
  emoji: string;
  /** Aggregated total spent by this specific user in the current session. */
  totalSpent: number;
};

/**
 * AI Context: Represents a purchasable item in the restaurant's menu.
 */
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  /** Optional promotional UI tag (e.g., 'Entradas Populares'). */
  tag?: string;
};

/**
 * AI Context: Represents a localized cart item tied to a specific user.
 * It encapsulates the menu item, the quantity ordered, and any text modifiers.
 */
export type OrderItem = {
  /** Unique instance ID for this cart entry. */
  id: string;
  menuItem: MenuItem;
  /** ID of the user who added this item. */
  userId: string;
  /** Quantity ordered (must be > 0). */
  quantity: number;
  /** Array of string modifiers (e.g., 'Sin cebolla', 'Término medio'). */
  modifiers: string[];
};
