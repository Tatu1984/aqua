import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single refund
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            email: true,
            total: true,
            paymentStatus: true,
          },
        },
        items: {
          include: { orderItem: true },
        },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    return NextResponse.json({ refund });
  } catch (error) {
    console.error("Get refund error:", error);
    return NextResponse.json(
      { error: "Failed to fetch refund" },
      { status: 500 }
    );
  }
}

// PUT - Update refund (approve/reject/complete)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, transactionId, processedBy } = body;

    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        order: true,
        items: { include: { orderItem: true } },
      },
    });

    if (!refund) {
      return NextResponse.json({ error: "Refund not found" }, { status: 404 });
    }

    if (refund.status === "COMPLETED" || refund.status === "REJECTED") {
      return NextResponse.json(
        { error: `Refund is already ${refund.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.refund.update({
        where: { id },
        data: {
          status,
          transactionId,
          processedBy,
        },
      });

      // If completing refund, handle inventory restock
      if (status === "COMPLETED") {
        for (const item of refund.items) {
          if (item.restockItems) {
            // Restock inventory
            if (item.orderItem.variantId) {
              await tx.productVariant.update({
                where: { id: item.orderItem.variantId },
                data: {
                  stockQuantity: { increment: item.quantity },
                  stockStatus: "IN_STOCK",
                },
              });
            } else {
              await tx.product.update({
                where: { id: item.orderItem.productId },
                data: {
                  stockQuantity: { increment: item.quantity },
                  stockStatus: "IN_STOCK",
                },
              });
            }

            // Log inventory change
            await tx.inventoryLog.create({
              data: {
                productId: item.orderItem.productId,
                variantId: item.orderItem.variantId,
                type: "INCREASE",
                quantity: item.quantity,
                previousQty: 0, // Will be calculated
                newQty: 0, // Will be calculated
                reason: "REFUND",
                referenceType: "Refund",
                referenceId: id,
                notes: `Restocked from refund ${id}`,
              },
            });
          }
        }

        // Add order note
        await tx.orderNote.create({
          data: {
            orderId: refund.orderId,
            content: `Refund of ₹${refund.amount.toFixed(2)} completed. Transaction ID: ${transactionId || "N/A"}`,
            type: "CUSTOMER",
            addedBy: processedBy || "system",
          },
        });
      }

      if (status === "REJECTED") {
        // Revert order payment status if needed
        const allRefunds = await tx.refund.findMany({
          where: { orderId: refund.orderId, status: { not: "REJECTED" } },
        });
        const totalRefunded = allRefunds
          .filter((r) => r.id !== id)
          .reduce((sum, r) => sum + r.amount, 0);

        if (totalRefunded === 0) {
          await tx.order.update({
            where: { id: refund.orderId },
            data: { paymentStatus: "PAID" },
          });
        } else if (totalRefunded < refund.order.total) {
          await tx.order.update({
            where: { id: refund.orderId },
            data: { paymentStatus: "PARTIALLY_REFUNDED" },
          });
        }

        await tx.orderNote.create({
          data: {
            orderId: refund.orderId,
            content: `Refund of ₹${refund.amount.toFixed(2)} rejected`,
            type: "PRIVATE",
            addedBy: processedBy || "system",
          },
        });
      }

      return result;
    });

    return NextResponse.json({ refund: updated });
  } catch (error) {
    console.error("Update refund error:", error);
    return NextResponse.json(
      { error: "Failed to update refund" },
      { status: 500 }
    );
  }
}
