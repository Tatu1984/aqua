import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Default settings structure
const DEFAULT_SETTINGS: Record<string, Record<string, any>> = {
  general: {
    storeName: "Aqua Store",
    storeDescription: "Premium aquarium products and live fish",
    storeEmail: "support@aquastore.com",
    storePhone: "+91 9876543210",
    storeAddress: "123 Aquarium Street, Mumbai, Maharashtra 400001",
    currency: "INR",
    currencySymbol: "₹",
    currencyPosition: "before",
    thousandSeparator: ",",
    decimalSeparator: ".",
    decimals: 2,
    timezone: "Asia/Kolkata",
  },
  shipping: {
    enableShipping: true,
    calculateShippingInCart: true,
    shippingDestination: "BILLING", // BILLING, SHIPPING
    freeShippingThreshold: 999,
    enableLocalPickup: false,
    defaultWeight: 0.5,
    defaultDimensions: { length: 10, width: 10, height: 10 },
    weightUnit: "kg",
    dimensionUnit: "cm",
  },
  tax: {
    enableTax: true,
    pricesIncludeTax: false,
    calculateTaxBasedOn: "SHIPPING", // SHIPPING, BILLING, STORE
    shippingTaxClass: "standard",
    displayPricesInShop: "EXCLUDING_TAX",
    displayPricesInCart: "EXCLUDING_TAX",
    displayTaxTotals: "ITEMIZED", // SINGLE, ITEMIZED
    roundTaxAtSubtotal: false,
  },
  checkout: {
    enableGuestCheckout: true,
    enableCoupons: true,
    enableOrderNotes: true,
    termsPageId: null,
    privacyPageId: null,
    minOrderAmount: 0,
    maxOrderAmount: null,
  },
  inventory: {
    manageStock: true,
    holdStockMinutes: 60,
    notifyLowStock: true,
    notifyOutOfStock: true,
    lowStockThreshold: 5,
    outOfStockThreshold: 0,
    hideOutOfStock: false,
    stockDisplayFormat: "ALWAYS", // ALWAYS, WHEN_LOW, NEVER
  },
  email: {
    fromName: "Aqua Store",
    fromEmail: "noreply@aquastore.com",
    headerImage: null,
    footerText: "Thank you for shopping with Aqua Store!",
    baseColor: "#0ea5e9",
  },
  payment: {
    enabledMethods: ["razorpay", "cod"],
    razorpay: {
      enabled: true,
      testMode: true,
      keyId: "",
      keySecret: "",
    },
    cod: {
      enabled: true,
      title: "Cash on Delivery",
      description: "Pay with cash upon delivery",
      minAmount: 0,
      maxAmount: 50000,
      extraCharge: 0,
    },
  },
  reviews: {
    enableReviews: true,
    verifiedOwnersOnly: false,
    requireApproval: false,
    showAverageRating: true,
    enableReviewImages: true,
    maxImagesPerReview: 5,
  },
  seo: {
    siteTitle: "Aqua Store - Premium Aquarium Products",
    siteDescription: "Shop the best aquarium fish, plants, and equipment online",
    ogImage: null,
    enableSitemap: true,
    enableRobotsTxt: true,
  },
};

// GET - Get all settings or by group
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");

    const where = group ? { group } : {};

    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: "asc" },
    });

    // Merge with defaults
    const result: Record<string, any> = {};

    if (group) {
      result[group] = { ...(DEFAULT_SETTINGS[group] || {}) };
      for (const setting of settings) {
        try {
          result[group][setting.key.replace(`${group}.`, "")] = JSON.parse(setting.value);
        } catch {
          result[group][setting.key.replace(`${group}.`, "")] = setting.value;
        }
      }
    } else {
      // Return all settings grouped
      for (const [grp, defaults] of Object.entries(DEFAULT_SETTINGS)) {
        result[grp] = { ...defaults };
      }
      for (const setting of settings) {
        const [grp, ...keyParts] = setting.key.split(".");
        const key = keyParts.join(".");
        if (!result[grp]) result[grp] = {};
        try {
          result[grp][key] = JSON.parse(setting.value);
        } catch {
          result[grp][key] = setting.value;
        }
      }
    }

    return NextResponse.json({ settings: result });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST/PUT - Update settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { group, settings } = body;

    if (!group || !settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Group and settings object are required" },
        { status: 400 }
      );
    }

    const updates = [];

    for (const [key, value] of Object.entries(settings)) {
      const fullKey = `${group}.${key}`;
      const valueStr = typeof value === "string" ? value : JSON.stringify(value);

      updates.push(
        prisma.setting.upsert({
          where: { key: fullKey },
          create: {
            key: fullKey,
            value: valueStr,
            group,
            autoload: true,
          },
          update: {
            value: valueStr,
          },
        })
      );
    }

    await prisma.$transaction(updates);

    // Return updated settings
    const updatedSettings = await prisma.setting.findMany({
      where: { group },
    });

    const result: Record<string, any> = { ...(DEFAULT_SETTINGS[group] || {}) };
    for (const setting of updatedSettings) {
      const key = setting.key.replace(`${group}.`, "");
      try {
        result[key] = JSON.parse(setting.value);
      } catch {
        result[key] = setting.value;
      }
    }

    return NextResponse.json({ settings: { [group]: result } });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

// DELETE - Reset settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group");
    const key = searchParams.get("key");

    if (key) {
      await prisma.setting.deleteMany({
        where: { key },
      });
    } else if (group) {
      await prisma.setting.deleteMany({
        where: { group },
      });
    } else {
      return NextResponse.json(
        { error: "Group or key is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset settings error:", error);
    return NextResponse.json(
      { error: "Failed to reset settings" },
      { status: 500 }
    );
  }
}
