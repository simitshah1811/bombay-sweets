"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMenuItem } from "@/data/menu";

const STORAGE_KEY = "bombay-sweets-cart";

export interface CartEntry {
  itemId: string;
  quantity: number;
}

export interface CartLine extends CartEntry {
  name: string;
  price: number;
  lineTotal: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (itemId: string, quantity?: number) => void;
  setQuantity: (itemId: string, quantity: number) => void;
  remove: (itemId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // One-time read of browser-only localStorage; can't run during SSR render.
    // setEntries and setIsHydrated batch into a single re-render, so the persist
    // effect below never observes a stale (pre-hydration) `entries` value.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEntries(JSON.parse(raw));
      }
    } catch {
      // corrupt or inaccessible storage -- start with an empty cart
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, isHydrated]);

  const add = useCallback((itemId: string, quantity = 1) => {
    setEntries((prev) => {
      const existing = prev.find((entry) => entry.itemId === itemId);
      if (existing) {
        return prev.map((entry) =>
          entry.itemId === itemId ? { ...entry, quantity: entry.quantity + quantity } : entry
        );
      }
      return [...prev, { itemId, quantity }];
    });
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setEntries((prev) => {
      if (quantity <= 0) return prev.filter((entry) => entry.itemId !== itemId);
      return prev.map((entry) => (entry.itemId === itemId ? { ...entry, quantity } : entry));
    });
  }, []);

  const remove = useCallback((itemId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.itemId !== itemId));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const lines = useMemo<CartLine[]>(() => {
    return entries
      .map((entry) => {
        const item = getMenuItem(entry.itemId);
        if (!item) return null;
        return {
          ...entry,
          name: item.name,
          price: item.price,
          lineTotal: item.price * entry.quantity,
        };
      })
      .filter((line): line is CartLine => line !== null);
  }, [entries]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.lineTotal, 0), [lines]);

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add,
    setQuantity,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
