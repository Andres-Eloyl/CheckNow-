import { User, MenuItem, OrderItem } from '@/types';
export type { User, MenuItem, OrderItem };

/**
 * AI Context: Fallback mock user data for development and testing. 
 * Represents users connected to the table session.
 */
export const MOCK_USERS: User[] = [
  { id: '1', name: 'Tú', avatarColor: 'bg-primary', emoji: '😎', totalSpent: 0 },
  { id: '2', name: 'Carlos', avatarColor: 'bg-green-500', emoji: '🥑', totalSpent: 45.00 },
  { id: '3', name: 'Mariana', avatarColor: 'bg-pink-500', emoji: '🍓', totalSpent: 32.50 },
];

/** AI Context: Mock categories for testing menu tab navigation. */
export const CATEGORIES = [
  { id: '1', name: 'Entradas' },
  { id: '2', name: 'Platos Fuertes' },
  { id: '3', name: 'Postres' },
  { id: '4', name: 'Bebidas' },
  { id: '5', name: 'Licores' },
  { id: '6', name: 'Promos' },
  { id: '7', name: 'Cafetería' },
  { id: '8', name: 'Vinos' },
];

/**
 * AI Context: Static mock representation of the restaurant's menu items.
 * Used when backend data is unavailable or while offline.
 */
export const MOCK_MENU: MenuItem[] = [
  {
    id: 'm1',
    categoryId: '1',
    name: 'Bruschettas de Pomodoro',
    description: 'Pan rústico, tomates cherry marinado y albahaca fresca.',
    price: 8.50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC5Bz-NzNUurgnGa3m7LqeesO0cVkMsHACipp36YzGymsnDSI6VwGaHSKts9hhfkB89XxG760J5I_235swsnwWh_Pefb6_l8i_tmfmzBi9ONlnN4pzWqV64_IMV9JJh48kYU4QSgU5SxNe4ui9RVkIaE0TtYNCLfmLJiwRUNgW-XSi6M5nonswu82W4WnYjl03TE9qheYFXI_0a-h1r8Od0dRTkPgUUma0-6jcggNB5NcHsNl8bMDCjTU_Pf-ZSqlI-mpqqzvJqyQ',
    tag: 'Entradas Populares'
  },
  {
    id: 'm2',
    categoryId: '1',
    name: 'Ensalada César Gourmet',
    description: 'Lechugas romanas, aderezo de la casa y crutones artesanales.',
    price: 12.00,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0SLAHGh025ElrtWVpTh-aH7wboRkuDbh34qDiKoQijHo2BUGcZ-xbZ__-id0TeQIGkUKGAyivmvysgABHB6G6ipmu31-SlUv-bwtdhd---ObONfNVzZZ9jBEz1llN-bQHJUmHKmCcEzSy3GViFFhdq3KKrEu-yPz1G6N5Og0eObti-_mz8wUJV5utK2mOX0t-VPbYY7CcP-BQxjlZ-9_0rXDIe9VE9_guhM26CksLOOXZPFjG_9n7I1O-EQci85kyOWJ3n6KQFw',
    tag: 'Entradas Populares'
  },
  {
    id: 'm3',
    categoryId: '1',
    name: 'Calamares Crujientes',
    description: 'Anillos de calamar rebozados con alioli de limón.',
    price: 14.25,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBAtiAjXH-YrJPhW2kUItsLCn4RpeDrF062o8crBApZRMsM5ZvRwO3C4yFx8Y-aJAd50Tt_MruyNkxgh4tUbOfCPeBVLotlTvZr8FgVf031xlbqwZZA-tm6TnmkBEIGeOdoxHwKkqLJMHNCk8GY2irfqDIYBP-RG5a0M-lr3HptUxyP1BC-PNjg818jbB6MmbNLowfhFWxfOckKKhR3CDZm_j2Yv3gMvctgqPPC-eapd2BlbsbXgISKAumi4M2iU-2TQ91s05tDhA',
    tag: 'Entradas Populares'
  },
  {
    id: 'm4',
    categoryId: '1',
    name: 'Pizza Margherita Napolitana',
    description: 'Masa de fermentación lenta, mozzarella di bufala.',
    price: 16.50,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkipb6ZwWmtBf12D3iWG83TUb8WU_wUdTAJjxO7TjhXEWBf0JVz9GWlg-8YugysS1PV7Lb4nLNnrMe8jUpu8q46HTUkak0rGCWqd7TjgZn-BXxwaV_ZleHbMzOoHoFb_WtPJEEYLJFH3mNylxINhXfX1sGIWywPsz3_N55bhEE_6w7yP-SgtrsRWG2DGicuNcmhANUm-gwMBqpWyEeq5ts9qVSgx7CKttup5VWPM1ovdVzUbN88lT4FNecbZ6BWVcpxnOr7JrnOg',
    tag: 'Sugerencias del Chef'
  }
];

export const MOCK_CART: OrderItem[] = [
  {
    id: 'c1',
    menuItem: MOCK_MENU[0],
    userId: '1',
    quantity: 1,
    modifiers: ['Sin cebolla']
  },
  {
    id: 'c2',
    menuItem: MOCK_MENU[3],
    userId: '1',
    quantity: 1,
    modifiers: []
  },
  {
    id: 'c3',
    menuItem: MOCK_MENU[1],
    userId: '2',
    quantity: 1,
    modifiers: []
  },
  {
    id: 'c4',
    menuItem: MOCK_MENU[2],
    userId: '3',
    quantity: 1,
    modifiers: []
  }
];

export const SOCIAL_PROOF_MESSAGES = [
  '👀 Carlos acaba de pedir Papas Fritas',
  '🔥 La Pizza Margherita Neapolitana es la más pedida hoy',
  '🥑 A Mariana le encantan las Bruschettas de Pomodoro'
];
