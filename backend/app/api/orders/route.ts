import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aqua-secret-key-change-in-production"
);

function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `AQ-${timestamp}-${random}`;
}

// Get user orders
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = payload.userId as string;

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json({ error: "Failed to get orders" }, { status: 500 });
  }
}

// Create order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      items,
      email,
      phone,
      shippingAddress,
      paymentMethod,
      couponCode,
      subtotal,
      discount,
      shippingCost,
      tax,
      total,
    } = body;

    // Get user if logged in
    let userId: string | null = null;
    const token = request.cookies.get("auth-token")?.value;
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        userId = payload.userId as string;
      } catch {
        // Guest checkout
      }
    }

    // Create or find address
    let addressId: string | null = null;
    if (shippingAddress && userId) {
      const address = await prisma.address.create({
        data: {
          userId,
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          phone: shippingAddress.phone || phone,
          addressLine1: shippingAddress.addressLine1,
          addressLine2: shippingAddress.addressLine2,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
          country: shippingAddress.country || "India",
        },
      });
      addressId = address.id;
    }

    // Find coupon if provided
    let couponId: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
      });
      if (coupon) {
        couponId = coupon.id;
      }
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        email,
        phone,
        status: "PENDING",
        paymentStatus: paymentMethod === "COD" ? "PENDING" : "PENDING",
        subtotal,
        discount: discount || 0,
        shippingCost: shippingCost || 0,
        tax: tax || 0,
        total,
        shippingAddressId: addressId,
        paymentMethod,
        couponId,
        couponCode,
        items: {
          create: items.map((item: {
            productId: string;
            variantId?: string;
            name: string;
            sku: string;
            price: number;
            quantity: number;
            image?: string;
          }) => ({
            productId: item.productId,
            variantId: item.variantId,
            name: item.name,
            sku: item.sku,
            price: item.price,
            quantity: item.quantity,
            total: item.price * item.quantity,
            image: item.image,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // Update stock
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { decrement: item.quantity },
        },
      });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
