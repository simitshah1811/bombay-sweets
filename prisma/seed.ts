/**
 * DEMO SEED — Phase 2 database foundation.
 *
 * Loads the site's real business info and real menu (from data/business.ts,
 * data/menu.ts, data/menu-tags.ts) into the database, plus a small set of
 * clearly-labeled DEMO operational settings and DEMO modifier groups that
 * were never part of the original frontend data. Nothing here is presented
 * as final client-approved business config -- see isDemoMode/DEMO comments.
 *
 * Safe to re-run: every write is an upsert keyed on stable ids.
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, DayOfWeek } from "../lib/generated/prisma/client";
import { MENU_CATEGORIES, MENU_ITEMS } from "../data/menu";
import { getItemTags } from "../data/menu-tags";
import { business } from "../data/business";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function seedRestaurant() {
  const restaurant = await prisma.restaurant.upsert({
    where: { id: "bombay-sweets" },
    update: {
      name: business.name,
      legalName: business.legalName,
      tagline: business.tagline,
      street: business.address.street,
      city: business.address.city,
      region: business.address.region,
      postalCode: business.address.postalCode,
      country: business.address.country,
      addressLine: business.addressLine,
      phone: business.phone,
      phoneHref: business.phoneHref,
      fax: business.fax,
      email: business.email,
      mapsHref: business.mapsHref,
    },
    create: {
      id: "bombay-sweets",
      name: business.name,
      legalName: business.legalName,
      tagline: business.tagline,
      street: business.address.street,
      city: business.address.city,
      region: business.address.region,
      postalCode: business.address.postalCode,
      country: business.address.country,
      addressLine: business.addressLine,
      phone: business.phone,
      phoneHref: business.phoneHref,
      fax: business.fax,
      email: business.email,
      mapsHref: business.mapsHref,
    },
  });

  // DEMO operational config -- not yet approved by the client. Editable via
  // the admin dashboard once Phase 7 builds it.
  await prisma.businessSettings.upsert({
    where: { restaurantId: restaurant.id },
    update: {},
    create: {
      restaurantId: restaurant.id,
      orderingEnabled: true,
      pickupEnabled: true,
      asapPickupEnabled: true,
      scheduledPickupEnabled: true,
      minPrepTimeMinutes: 20, // DEMO
      pickupIntervalMinutes: 15, // DEMO
      maxAdvanceSchedulingHours: 48, // DEMO
      taxRatePercent: 12.0, // DEMO (BC GST 5% + PST 7% approximation, unconfirmed)
      isDemoMode: true,
    },
  });

  // Real hours from data/business.ts, expanded from "Monday - Saturday" /
  // "Sunday" into one row per day.
  const weekdayHours = business.hours[0]; // "Monday - Saturday", "10:00 AM - 8:00 PM"
  const sundayHours = business.hours[1]; // "Sunday", "10:00 AM - 7:30 PM"

  const weekdays: DayOfWeek[] = [
    DayOfWeek.MONDAY,
    DayOfWeek.TUESDAY,
    DayOfWeek.WEDNESDAY,
    DayOfWeek.THURSDAY,
    DayOfWeek.FRIDAY,
    DayOfWeek.SATURDAY,
  ];

  for (const day of weekdays) {
    await prisma.businessHours.upsert({
      where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: day } },
      update: { openTime: "10:00", closeTime: "20:00", isClosed: false },
      create: {
        restaurantId: restaurant.id,
        dayOfWeek: day,
        openTime: "10:00",
        closeTime: "20:00",
        isClosed: false,
      },
    });
  }

  await prisma.businessHours.upsert({
    where: { restaurantId_dayOfWeek: { restaurantId: restaurant.id, dayOfWeek: DayOfWeek.SUNDAY } },
    update: { openTime: "10:00", closeTime: "19:30", isClosed: false },
    create: {
      restaurantId: restaurant.id,
      dayOfWeek: DayOfWeek.SUNDAY,
      openTime: "10:00",
      closeTime: "19:30",
      isClosed: false,
    },
  });

  console.log(`  Restaurant "${weekdayHours.days}" / "${sundayHours.days}" hours seeded.`);
  return restaurant;
}

async function seedMenu() {
  for (const category of MENU_CATEGORIES) {
    await prisma.menuCategory.upsert({
      where: { id: category.id },
      update: { name: category.name, displayOrder: category.order, isActive: true },
      create: {
        id: category.id,
        name: category.name,
        displayOrder: category.order,
        isActive: true,
      },
    });
  }
  console.log(`  ${MENU_CATEGORIES.length} menu categories seeded.`);

  // MENU_ITEMS is already grouped by category in its original curated order;
  // assign each item an incrementing displayOrder within its category so the
  // database preserves that exact sequence instead of an arbitrary DB order.
  const nextOrderByCategory: Record<string, number> = {};

  for (const item of MENU_ITEMS) {
    const tags = getItemTags(item.id);
    const displayOrder = nextOrderByCategory[item.categoryId] ?? 0;
    nextOrderByCategory[item.categoryId] = displayOrder + 1;

    await prisma.menuItem.upsert({
      where: { id: item.id },
      update: {
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        isVegetarian: tags.veg,
        spiceLevel: tags.spiceLevel,
        isAvailable: true,
        displayOrder,
      },
      create: {
        id: item.id,
        categoryId: item.categoryId,
        name: item.name,
        description: item.description,
        price: item.price,
        isVegetarian: tags.veg,
        spiceLevel: tags.spiceLevel,
        isAvailable: true,
        displayOrder,
      },
    });
  }
  console.log(`  ${MENU_ITEMS.length} menu items seeded.`);
}

/**
 * DEMO modifier groups -- these do not exist in the original frontend data.
 * They demonstrate the modifier system for the client demo and deliberately
 * avoid duplicating dishes that already exist as standalone menu items
 * (e.g. no "Naan Type" group, since Garlic/Butter/Peshwari Naan are already
 * separate real menu items).
 */
async function seedDemoModifiers() {
  const spiceLevel = await prisma.modifierGroup.upsert({
    where: { id: "demo-spice-level" },
    update: {},
    create: {
      id: "demo-spice-level",
      name: "Spice Level (DEMO)",
      isRequired: false,
      minSelect: 0,
      maxSelect: 1,
      displayOrder: 1,
      options: {
        create: [
          { id: "demo-spice-mild", name: "Mild", priceAdjustment: 0, displayOrder: 1 },
          { id: "demo-spice-medium", name: "Medium", priceAdjustment: 0, displayOrder: 2 },
          { id: "demo-spice-hot", name: "Hot", priceAdjustment: 0, displayOrder: 3 },
        ],
      },
    },
  });

  const extraChutney = await prisma.modifierGroup.upsert({
    where: { id: "demo-extra-chutney" },
    update: {},
    create: {
      id: "demo-extra-chutney",
      name: "Extra Chutney (DEMO)",
      isRequired: false,
      minSelect: 0,
      maxSelect: 3,
      displayOrder: 2,
      options: {
        create: [
          { id: "demo-chutney-mint", name: "Mint Chutney", priceAdjustment: 0.5, displayOrder: 1 },
          { id: "demo-chutney-tamarind", name: "Tamarind Chutney", priceAdjustment: 0.5, displayOrder: 2 },
        ],
      },
    },
  });

  const spiceItems = ["butter-chicken", "chicken-tikka-masala"];
  const chutneyItems = ["vegetable-samosa", "chaat-papdi"];

  for (const menuItemId of spiceItems) {
    await prisma.menuItemModifierGroup.upsert({
      where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: spiceLevel.id } },
      update: {},
      create: { menuItemId, modifierGroupId: spiceLevel.id },
    });
  }

  for (const menuItemId of chutneyItems) {
    await prisma.menuItemModifierGroup.upsert({
      where: { menuItemId_modifierGroupId: { menuItemId, modifierGroupId: extraChutney.id } },
      update: {},
      create: { menuItemId, modifierGroupId: extraChutney.id },
    });
  }

  console.log("  2 DEMO modifier groups seeded and attached to sample items.");
}

/**
 * One clearly-labeled DEMO promotion so the client demo can show the
 * discount system working. Not a real Bombay Sweets offer -- see
 * isDemoPromotion and the description text.
 */
async function seedDemoPromotion() {
  await prisma.promotion.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      description: "DEMO promotion — 10% off, for client demonstration only. Not a real Bombay Sweets offer.",
      discountType: "PERCENTAGE",
      discountValue: 10.0, // DEMO
      minOrderAmount: 15.0, // DEMO
      maxDiscountAmount: 10.0, // DEMO
      usageLimit: 500, // DEMO
      perCustomerLimit: 1, // DEMO
      isActive: true,
      isDemoPromotion: true,
    },
  });
  console.log("  1 DEMO promotion seeded (WELCOME10).");
}

async function main() {
  console.log("Seeding demo data...");
  await seedRestaurant();
  await seedMenu();
  await seedDemoModifiers();
  await seedDemoPromotion();
  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
