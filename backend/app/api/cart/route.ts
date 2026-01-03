import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// Get cart
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get("cart_session")?.value;

    if (!sessionId) {
      return NextResponse.json({
        cart: { items: [], subtotal: 0, itemCount: 0 },
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { take: 1 },
              },
            },
            variant: true,
          },
        },
        coupon: true,
      },
    });

    if (!cart) {
      return NextResponse.json({
        cart: { items: [], subtotal: 0, itemCount: 0 },
      });
    }

    const items = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        price: item.variant?.price || item.product.price,
        compareAtPrice:
          item.variant?.compareAtPrice || item.product.compareAtPrice,
        image: item.product.images[0]?.url || null,
        stockQuantity: item.variant?.stockQuantity || item.product.stockQuantity,
        stockStatus: item.variant?.stockStatus || item.product.stockStatus,
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            sku: item.variant.sku,
          }
        : null,
    }));

    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    let discount = 0;
    if (cart.coupon && cart.coupon.isActive) {
      if (cart.coupon.type === "PERCENTAGE") {
        discount = (subtotal * cart.coupon.value) / 100;
        if (cart.coupon.maxDiscount) {
          discount = Math.min(discount, cart.coupon.maxDiscount);
        }
      } else if (cart.coupon.type === "FIXED") {
        discount = cart.coupon.value;
      }
    }

    return NextResponse.json({
      cart: {
        id: cart.id,
        items,
        subtotal,
        discount,
        total: subtotal - discount,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
        coupon: cart.coupon
          ? { code: cart.coupon.code, discount }
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// Add to cart
export async function POST(request: NextRequest) {
  try {
    const { productId, variantId, quantity = 1 } = await request.json();

    let sessionId = request.cookies.get("cart_session")?.value;

    // Create session if doesn't exist
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: { sessionId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { sessionId },
      });
    }

    // Check if item already exists
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId || null,
          quantity,
        },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("cart_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json(
      { error: "Failed to add to cart" },
      { status: 500 }
    );
  }
}

// Update cart item
export async function PUT(request: NextRequest) {
  try {
    const { itemId, quantity } = await request.json();

    if (quantity < 1) {
      await prisma.cartItem.delete({
        where: { id: itemId },
      });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

// Remove from cart
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID required" },
        { status: 400 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from cart:", error);
    return NextResponse.json(
      { error: "Failed to remove from cart" },
      { status: 500 }
    );
  }
}
