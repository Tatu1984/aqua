import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("cart_session")?.value;
    const { code } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "No cart found" },
        { status: 400 }
      );
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json(
        { error: "Invalid coupon code" },
        { status: 400 }
      );
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { error: "This coupon is no longer active" },
        { status: 400 }
      );
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This coupon has expired" },
        { status: 400 }
      );
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
      return NextResponse.json(
        {
          error: `Minimum order value of ₹${coupon.minOrderValue} required`,
        },
        { status: 400 }
      );
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponId: coupon.id },
    });

    let discount = 0;
    if (coupon.type === "PERCENTAGE") {
      discount = (subtotal * coupon.value) / 100;
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else if (coupon.type === "FIXED") {
      discount = coupon.value;
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discount: Math.round(discount),
      },
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "Failed to apply coupon" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("cart_session")?.value;

    if (!sessionId) {
      return NextResponse.json(
        { error: "No cart found" },
        { status: 400 }
      );
    }

    await prisma.cart.update({
      where: { sessionId },
      data: { couponId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing coupon:", error);
    return NextResponse.json(
      { error: "Failed to remove coupon" },
      { status: 500 }
    );
  }
}
