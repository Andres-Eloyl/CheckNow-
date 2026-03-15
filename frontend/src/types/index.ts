export type User = {
  id: string;
  name: string;
  avatarColor: string;
  emoji: string;
  totalSpent: number;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  tag?: string;
};

export type OrderItem = {
  id: string;
  menuItem: MenuItem;
  userId: string;
  quantity: number;
  modifiers: string[];
};
