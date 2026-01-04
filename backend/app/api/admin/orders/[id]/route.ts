import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        shippingAddress: true,
        billingAddr: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                images: { take: 1, select: { url: true } },
              },
            },
            variant: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
        notes: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Transform notes to match frontend expectations (orderNotes)
    const transformedOrder = {
      ...order,
      orderNotes: order.notes.map((note) => ({
        id: note.id,
        note: note.content,
        isCustomerNote: note.type === "CUSTOMER",
        createdAt: note.createdAt,
      })),
    };

    return NextResponse.json(transformedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const order = await prisma.order.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
