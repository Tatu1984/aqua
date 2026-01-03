import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all coupons with full details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status"); // active, inactive, expired
    const type = searchParams.get("type");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status === "active") {
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    } else if (status === "inactive") {
      where.isActive = false;
    } else if (status === "expired") {
      where.expiresAt = { lt: new Date() };
    }

    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        where,
        include: {
          products: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
          categories: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
          _count: { select: { orders: true, usages: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.coupon.count({ where }),
    ]);

    return NextResponse.json({
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        // Usage limits
        usageLimit: c.usageLimit,
        usageLimitPerUser: c.usageLimitPerUser,
        usageCount: c.usageCount,
        limitUsageToXItems: c.limitUsageToXItems,
        // Cart requirements
        minOrderValue: c.minOrderValue,
        maxOrderValue: c.maxOrderValue,
        maxDiscount: c.maxDiscount,
        // Restrictions
        individualUseOnly: c.individualUseOnly,
        excludeSaleItems: c.excludeSaleItems,
        allowedEmails: c.allowedEmails,
        // Product/Category restrictions
        includedProducts: c.products
          .filter((p) => p.type === "INCLUDE")
          .map((p) => p.product),
        excludedProducts: c.products
          .filter((p) => p.type === "EXCLUDE")
          .map((p) => p.product),
        includedCategories: c.categories
          .filter((c) => c.type === "INCLUDE")
          .map((c) => c.category),
        excludedCategories: c.categories
          .filter((c) => c.type === "EXCLUDE")
          .map((c) => c.category),
        // Status
        isActive: c.isActive,
        startsAt: c.startsAt,
        expiresAt: c.expiresAt,
        // Stats
        ordersCount: c._count.orders,
        usagesCount: c._count.usages,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST create coupon with full restrictions
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Check for duplicate code
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code.toUpperCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        type: data.type || "PERCENTAGE",
        value: data.value,
        // Usage limits
        usageLimit: data.usageLimit,
        usageLimitPerUser: data.usageLimitPerUser,
        limitUsageToXItems: data.limitUsageToXItems,
        // Cart requirements
        minOrderValue: data.minOrderValue,
        maxOrderValue: data.maxOrderValue,
        maxDiscount: data.maxDiscount,
        // Restrictions
        individualUseOnly: data.individualUseOnly || false,
        excludeSaleItems: data.excludeSaleItems || false,
        allowedEmails: data.allowedEmails, // JSON string of email patterns
        // Status
        isActive: data.isActive ?? true,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        // Product restrictions
        products: data.includedProducts?.length || data.excludedProducts?.length
          ? {
              create: [
                ...(data.includedProducts || []).map((productId: string) => ({
                  productId,
                  type: "INCLUDE",
                })),
                ...(data.excludedProducts || []).map((productId: string) => ({
                  productId,
                  type: "EXCLUDE",
                })),
              ],
            }
          : undefined,
        // Category restrictions
        categories: data.includedCategories?.length || data.excludedCategories?.length
          ? {
              create: [
                ...(data.includedCategories || []).map((categoryId: string) => ({
                  categoryId,
                  type: "INCLUDE",
                })),
                ...(data.excludedCategories || []).map((categoryId: string) => ({
                  categoryId,
                  type: "EXCLUDE",
                })),
              ],
            }
          : undefined,
      },
      include: {
        products: { include: { product: true } },
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Coupon creation error:", error);
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete coupons
export async function DELETE(request: NextRequest) {
  try {
    const { ids } = await request.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Coupon IDs are required" },
        { status: 400 }
      );
    }

    await prisma.coupon.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Bulk delete coupons error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupons" },
      { status: 500 }
    );
  }
}
