import "server-only";
import { prisma } from "@/lib/db";
import type { PreparationStatus } from "@/lib/generated/prisma/client";

export interface AdminModifierOption {
  id: string;
  modifierGroupId: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
  displayOrder: number;
}

export interface AdminModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  displayOrder: number;
  options: AdminModifierOption[];
}

export async function getAdminModifierGroups(): Promise<AdminModifierGroup[]> {
  const groups = await prisma.modifierGroup.findMany({
    orderBy: { displayOrder: "asc" },
    include: { options: { orderBy: { displayOrder: "asc" } } },
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    isRequired: g.isRequired,
    minSelect: g.minSelect,
    maxSelect: g.maxSelect,
    displayOrder: g.displayOrder,
    options: g.options.map((o) => ({
      id: o.id,
      modifierGroupId: o.modifierGroupId,
      name: o.name,
      priceAdjustment: Number(o.priceAdjustment),
      isAvailable: o.isAvailable,
      displayOrder: o.displayOrder,
    })),
  }));
}

export interface AdminMenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isVegetarian: boolean;
  spiceLevel: number | null;
  isAvailable: boolean;
  isArchived: boolean;
  displayOrder: number;
  modifierGroupIds: string[];
  preparationStatus: PreparationStatus;
  preparationMinutes: number | null;
}

export interface AdminMenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  items: AdminMenuItem[];
}

// Unlike the public getMenuForDisplay(), this deliberately includes
// inactive categories and archived items -- staff need to see and
// reactivate/unarchive things, not just the customer-visible subset.
export async function getAdminMenu(): Promise<AdminMenuCategory[]> {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { displayOrder: "asc" },
    include: {
      items: {
        orderBy: { displayOrder: "asc" },
        include: { modifierGroups: { orderBy: { displayOrder: "asc" } } },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    displayOrder: category.displayOrder,
    isActive: category.isActive,
    items: category.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imageUrl: item.imageUrl,
      isVegetarian: item.isVegetarian,
      spiceLevel: item.spiceLevel,
      isAvailable: item.isAvailable,
      isArchived: item.isArchived,
      displayOrder: item.displayOrder,
      modifierGroupIds: item.modifierGroups.map((link) => link.modifierGroupId),
      preparationStatus: item.preparationStatus,
      preparationMinutes: item.preparationMinutes,
    })),
  }));
}
