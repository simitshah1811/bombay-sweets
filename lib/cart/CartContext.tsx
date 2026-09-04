"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItemForCart } from "@/lib/menu/queries";
import {
  buildLineMatchKey,
  clampQuantity,
  effectiveUnitPrice as computeEffectiveUnitPrice,
  lineTotal as computeLineTotal,
  type CartLineModifier,
} from "@/lib/cart/cartMath";

const STORAGE_KEY = "bombay-sweets-cart";

export type { CartLineModifier };

export interface CartEntry {
  lineId: string;
  itemId: string;
  /** Snapshot of the item's name/price at the moment it was added or last edited. */
  itemName: string;
  unitPrice: number;
  modifiers: CartLineModifier[];
  specialInstructions: string;
  quantity: number;
}

export interface AddToCartInput {
  itemId: string;
  itemName: string;
  unitPrice: number;
  modifiers: CartLineModifier[];
  specialInstructions: string;
  quantity: number;
}

export interface CartLine extends CartEntry {
  effectiveUnitPrice: number;
  lineTotal: number;
  /**
   * Live availability, resolved against the current database state -- not
   * part of the snapshot. True while the live menu hasn't loaded yet, so a
   * line never flashes "unavailable" before we actually know.
   */
  isAvailable: boolean;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  estimatedTax: number;
  estimatedTotal: number;
  taxRatePercent: number | null;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (input: AddToCartInput) => void;
  updateLine: (
    lineId: string,
    changes: Partial<Pick<CartEntry, "itemName" | "unitPrice" | "modifiers" | "specialInstructions" | "quantity">>
  ) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  /** Live, database-backed menu (with modifier groups), for availability checks and the "edit selections" flow. */
  menuItemsById: Record<string, MenuItemForCart> | null;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [menuItemsById, setMenuItemsById] = useState<Record<string, MenuItemForCart> | null>(null);
  const [taxRatePercent, setTaxRatePercent] = useState<number | null>(null);

  useEffect(() => {
    // One-time fetch of the database-backed menu (names/prices/availability/
    // modifiers) for resolving cart lines and powering the edit flow. Not an
    // authoritative pricing source -- server-side recalculation happens at
    // checkout (Phase 5).
    let cancelled = false;
    fetch("/api/menu/items")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("menu items request failed"))))
      .then((data: { items: MenuItemForCart[] }) => {
        if (cancelled) return;
        const map: Record<string, MenuItemForCart> = {};
        for (const item of data.items) map[item.id] = item;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMenuItemsById(map);
      })
      .catch(() => {
        // Leave menuItemsById unset -- lines fall back to "assume available"
        // until the next successful load. Persisted entries are untouched.
      });

    fetch("/api/business/settings")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("settings request failed"))))
      .then((data: { taxRatePercent: number }) => {
        if (cancelled) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTaxRatePercent(data.taxRatePercent);
      })
      .catch(() => {
        // Leave taxRatePercent unset -- the estimated tax line is omitted.
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const add = useCallback((input: AddToCartInput) => {
    const quantity = clampQuantity(input.quantity);
    const matchKey = buildLineMatchKey(
      input.itemId,
      input.modifiers.map((m) => m.modifierOptionId),
      input.specialInstructions
    );

    setEntries((prev) => {
      const existingIndex = prev.findIndex(
        (entry) =>
          buildLineMatchKey(
            entry.itemId,
            entry.modifiers.map((m) => m.modifierOptionId),
            entry.specialInstructions
          ) === matchKey
      );

      if (existingIndex !== -1) {
        return prev.map((entry, i) =>
          i === existingIndex ? { ...entry, quantity: clampQuantity(entry.quantity + quantity) } : entry
        );
      }

      const newEntry: CartEntry = {
        lineId: crypto.randomUUID(),
        itemId: input.itemId,
        itemName: input.itemName,
        unitPrice: input.unitPrice,
        modifiers: input.modifiers,
        specialInstructions: input.specialInstructions,
        quantity,
      };
      return [...prev, newEntry];
    });
  }, []);

  const updateLine = useCallback(
    (
      lineId: string,
      changes: Partial<Pick<CartEntry, "itemName" | "unitPrice" | "modifiers" | "specialInstructions" | "quantity">>
    ) => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.lineId === lineId
            ? {
                ...entry,
                ...changes,
                quantity: changes.quantity !== undefined ? clampQuantity(changes.quantity) : entry.quantity,
              }
            : entry
        )
      );
    },
    []
  );

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    setEntries((prev) => {
      if (quantity <= 0) return prev.filter((entry) => entry.lineId !== lineId);
      return prev.map((entry) => (entry.lineId === lineId ? { ...entry, quantity: clampQuantity(quantity) } : entry));
    });
  }, []);

  const remove = useCallback((lineId: string) => {
    setEntries((prev) => prev.filter((entry) => entry.lineId !== lineId));
  }, []);

  const clear = useCallback(() => setEntries([]), []);

  const lines = useMemo<CartLine[]>(() => {
    return entries.map((entry) => {
      const live = menuItemsById?.[entry.itemId];
      // Assume available until the live menu has actually loaded, so a line
      // never flashes "unavailable" before we know one way or the other.
      const isAvailable = menuItemsById === null ? true : Boolean(live?.isAvailable);
      return {
        ...entry,
        effectiveUnitPrice: computeEffectiveUnitPrice(entry.unitPrice, entry.modifiers),
        lineTotal: computeLineTotal(entry.unitPrice, entry.modifiers, entry.quantity),
        isAvailable,
      };
    });
  }, [entries, menuItemsById]);

  const count = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.lineTotal, 0), [lines]);
  const estimatedTax = useMemo(
    () => (taxRatePercent != null ? subtotal * (taxRatePercent / 100) : 0),
    [subtotal, taxRatePercent]
  );
  const estimatedTotal = useMemo(() => subtotal + estimatedTax, [subtotal, estimatedTax]);

  const value: CartContextValue = {
    lines,
    count,
    subtotal,
    estimatedTax,
    estimatedTotal,
    taxRatePercent,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    add,
    updateLine,
    setQuantity,
    remove,
    clear,
    menuItemsById,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
