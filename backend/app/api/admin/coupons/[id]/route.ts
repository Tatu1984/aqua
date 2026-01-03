import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single coupon with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const coupon = await prisma.coupon.findUnique({
      where: { id },
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
        usages: {
          include: {
            user: { select: { id: true, email: true, firstName: true } },
          },
          take: 20,
          orderBy: { usedAt: "desc" },
        },
        _count: { select: { orders: true, usages: true } },
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({
      coupon: {
        ...coupon,
        includedProducts: coupon.products
          .filter((p) => p.type === "INCLUDE")
          .map((p) => p.product),
        excludedProducts: coupon.products
          .filter((p) => p.type === "EXCLUDE")
          .map((p) => p.product),
        includedCategories: coupon.categories
          .filter((c) => c.type === "INCLUDE")
          .map((c) => c.category),
        excludedCategories: coupon.categories
          .filter((c) => c.type === "EXCLUDE")
          .map((c) => c.category),
        recentUsages: coupon.usages,
        ordersCount: coupon._count.orders,
        usagesCount: coupon._count.usages,
      },
    });
  } catch (error) {
    console.error("Coupon fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    );
  }
}

// PUT update coupon with restrictions
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Check if coupon exists
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Check for duplicate code
    if (data.code && data.code.toUpperCase() !== existing.code) {
      const codeExists = await prisma.coupon.findFirst({
        where: { code: data.code.toUpperCase(), id: { not: id } },
      });
      if (codeExists) {
        return NextResponse.json(
          { error: "Coupon code already exists" },
          { status: 400 }
        );
      }
    }

    const coupon = await prisma.$transaction(async (tx) => {
      // Update main coupon data
      const updated = await tx.coupon.update({
        where: { id },
        data: {
          code: data.code ? data.code.toUpperCase() : existing.code,
          description: data.description,
          type: data.type,
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
          individualUseOnly: data.individualUseOnly,
          excludeSaleItems: data.excludeSaleItems,
          allowedEmails: data.allowedEmails,
          // Status
          isActive: data.isActive,
          startsAt: data.startsAt !== undefined
            ? data.startsAt ? new Date(data.startsAt) : null
            : existing.startsAt,
          expiresAt: data.expiresAt !== undefined
            ? data.expiresAt ? new Date(data.expiresAt) : null
            : existing.expiresAt,
        },
      });

      // Handle product restrictions if provided
      if (data.includedProducts !== undefined || data.excludedProducts !== undefined) {
        // Clear existing product restrictions
        await tx.couponProduct.deleteMany({
          where: { couponId: id },
        });

        // Add new product restrictions
        const productRestrictions = [
          ...(data.includedProducts || []).map((productId: string) => ({
            couponId: id,
            productId,
            type: "INCLUDE" as const,
          })),
          ...(data.excludedProducts || []).map((productId: string) => ({
            couponId: id,
            productId,
            type: "EXCLUDE" as const,
          })),
        ];

        if (productRestrictions.length > 0) {
          await tx.couponProduct.createMany({
            data: productRestrictions,
          });
        }
      }

      // Handle category restrictions if provided
      if (data.includedCategories !== undefined || data.excludedCategories !== undefined) {
        // Clear existing category restrictions
        await tx.couponCategory.deleteMany({
          where: { couponId: id },
        });

        // Add new category restrictions
        const categoryRestrictions = [
          ...(data.includedCategories || []).map((categoryId: string) => ({
            couponId: id,
            categoryId,
            type: "INCLUDE" as const,
          })),
          ...(data.excludedCategories || []).map((categoryId: string) => ({
            couponId: id,
            categoryId,
            type: "EXCLUDE" as const,
          })),
        ];

        if (categoryRestrictions.length > 0) {
          await tx.couponCategory.createMany({
            data: categoryRestrictions,
          });
        }
      }

      return updated;
    });

    // Fetch updated coupon with all relations
    const result = await prisma.coupon.findUnique({
      where: { id },
      include: {
        products: { include: { product: true } },
        categories: { include: { category: true } },
      },
    });

    return NextResponse.json({ coupon: result });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    );
  }
}

// DELETE coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if coupon exists
    const existing = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { orders: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    // Warn if coupon has been used
    if (existing._count.orders > 0) {
      const force = new URL(request.url).searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Coupon has been used in ${existing._count.orders} orders. Use force=true to delete anyway.`,
            ordersCount: existing._count.orders,
          },
          { status: 400 }
        );
      }
    }

    await prisma.coupon.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    );
  }
}
