import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all refunds
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const status = searchParams.get("status");
    const orderId = searchParams.get("orderId");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (orderId) where.orderId = orderId;

    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({
        where,
        include: {
          order: {
            select: {
              orderNumber: true,
              email: true,
              total: true,
            },
          },
          items: {
            include: {
              orderItem: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.refund.count({ where }),
    ]);

    return NextResponse.json({
      refunds,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get refunds error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refunds" },
      { status: 500 }
    );
  }
}

// POST - Create refund
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, amount, reason, items, restockItems, refundMethod } = body;

    if (!orderId || amount === undefined) {
      return NextResponse.json(
        { error: "Order ID and amount are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, refunds: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Calculate already refunded amount
    const refundedAmount = order.refunds
      .filter((r) => r.status !== "REJECTED")
      .reduce((sum, r) => sum + r.amount, 0);

    if (amount > order.total - refundedAmount) {
      return NextResponse.json(
        {
          error: `Refund amount exceeds remaining order value. Max refundable: ${order.total - refundedAmount}`,
        },
        { status: 400 }
      );
    }

    const refund = await prisma.$transaction(async (tx) => {
      // Create refund
      const newRefund = await tx.refund.create({
        data: {
          orderId,
          amount,
          reason,
          refundMethod: refundMethod || "ORIGINAL_PAYMENT",
          status: "PENDING",
          items: items?.length
            ? {
                create: items.map((item: any) => ({
                  orderItemId: item.orderItemId,
                  quantity: item.quantity,
                  amount: item.amount,
                  restockItems: restockItems || false,
                })),
              }
            : undefined,
        },
        include: {
          items: { include: { orderItem: true } },
        },
      });

      // Update order payment status if fully refunded
      const totalRefunded = refundedAmount + amount;
      if (totalRefunded >= order.total) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "REFUNDED",
            status: "REFUNDED",
          },
        });
      } else if (totalRefunded > 0) {
        await tx.order.update({
          where: { id: orderId },
          data: { paymentStatus: "PARTIALLY_REFUNDED" },
        });
      }

      // Add order note
      await tx.orderNote.create({
        data: {
          orderId,
          content: `Refund of ₹${amount.toFixed(2)} created. Reason: ${reason || "No reason provided"}`,
          type: "PRIVATE",
          addedBy: "system",
        },
      });

      return newRefund;
    });

    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    console.error("Create refund error:", error);
    return NextResponse.json(
      { error: "Failed to create refund" },
      { status: 500 }
    );
  }
}
