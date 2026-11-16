"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string; // product_id or service_id + package_id
  item_type: "product" | "service";
  product_id?: string;
  service_id?: string;
  title: string;
  price_cents: number;
  quantity: number;
  thumbnail_url?: string;
  seller_name?: string;
  license_type?: string;
  package_name?: string;
  delivery_time_days?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotalCents: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const current = get().items;
        const exists = current.find((i) => i.id === newItem.id);
        if (exists) {
          // If digital product or service, keep quantity or increase
          set({
            items: current.map((i) =>
              i.id === newItem.id ? { ...i, quantity: i.quantity + (newItem.quantity || 1) } : i
            ),
          });
        } else {
          set({ items: [...current, { ...newItem, quantity: newItem.quantity || 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      subtotalCents: () =>
        get().items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: "desigot-cart",
    }
  )
);
