import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all coupons
export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      coupons: coupons.map((c) => ({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        usageLimit: c.usageLimit,
        usageCount: c.usageCount,
        perUserLimit: c.perUserLimit,
        isActive: c.isActive,
        startsAt: c.startsAt,
        expiresAt: c.expiresAt,
        ordersCount: c._count.orders,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Coupons fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    );
  }
}

// POST create coupon
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
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        perUserLimit: data.perUserLimit,
        isActive: data.isActive ?? true,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
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
