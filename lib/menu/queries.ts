import "server-only";
import { prisma } from "@/lib/db";
import type { PreparationStatus } from "@/lib/generated/prisma/client";

export interface ModifierOptionForDisplay {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface ModifierGroupForDisplay {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOptionForDisplay[];
}

const modifierGroupsInclude = {
  orderBy: { displayOrder: "asc" as const },
  include: {
    modifierGroup: {
      include: {
        options: { orderBy: { displayOrder: "asc" as const } },
      },
    },
  },
};

function mapModifierGroups(
  links: {
    modifierGroup: {
      id: string;
      name: string;
      isRequired: boolean;
      minSelect: number;
      maxSelect: number;
      options: { id: string; name: string; priceAdjustment: unknown; isAvailable: boolean }[];
    };
  }[]
): ModifierGroupForDisplay[] {
  return links.map((link) => ({
    id: link.modifierGroup.id,
    name: link.modifierGroup.name,
    isRequired: link.modifierGroup.isRequired,
    minSelect: link.modifierGroup.minSelect,
    maxSelect: link.modifierGroup.maxSelect,
    options: link.modifierGroup.options.map((option) => ({
      id: option.id,
      name: option.name,
      priceAdjustment: Number(option.priceAdjustment),
      isAvailable: option.isAvailable,
    })),
  }));
}

export interface MenuItemForDisplay {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  isVegetarian: boolean;
  spiceLevel: number | null;
  isAvailable: boolean;
  imageUrl: string | null;
  modifierGroups: ModifierGroupForDisplay[];
  preparationStatus: PreparationStatus;
  preparationMinutes: number | null;
}

export interface MenuCategoryForDisplay {
  id: string;
  name: string;
  displayOrder: number;
  items: MenuItemForDisplay[];
}

/**
 * Full menu for the /menu page. Includes unavailable items (so the UI can
 * show them as "currently unavailable") but excludes archived ones, which
 * are treated as removed from customer view entirely.
 */
export async function getMenuForDisplay(): Promise<MenuCategoryForDisplay[]> {
  const categories = await prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        where: { isArchived: false },
        orderBy: { displayOrder: "asc" },
        include: { modifierGroups: modifierGroupsInclude },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    displayOrder: category.displayOrder,
    items: category.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      isVegetarian: item.isVegetarian,
      spiceLevel: item.spiceLevel,
      isAvailable: item.isAvailable,
      imageUrl: item.imageUrl,
      modifierGroups: mapModifierGroups(item.modifierGroups),
      preparationStatus: item.preparationStatus,
      preparationMinutes: item.preparationMinutes,
    })),
  }));
}

export interface MenuItemForCart {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
  modifierGroups: ModifierGroupForDisplay[];
  preparationStatus: PreparationStatus;
  preparationMinutes: number | null;
}

/**
 * Item list (with modifier groups) for the cart's client-side lookups:
 * resolving item/modifier names for display, checking live availability, and
 * powering the "edit selections" flow. Not an authoritative pricing source --
 * the server recalculates everything again at checkout (Phase 5).
 */
export async function getMenuItemsForCart(): Promise<MenuItemForCart[]> {
  const items = await prisma.menuItem.findMany({
    where: { isArchived: false },
    include: { modifierGroups: modifierGroupsInclude },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    isAvailable: item.isAvailable,
    imageUrl: item.imageUrl,
    modifierGroups: mapModifierGroups(item.modifierGroups),
    preparationStatus: item.preparationStatus,
    preparationMinutes: item.preparationMinutes,
  }));
}
