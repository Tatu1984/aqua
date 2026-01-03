import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all notes for an order
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const notes = await prisma.orderNote.findMany({
      where: { orderId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get order notes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order notes" },
      { status: 500 }
    );
  }
}

// POST - Add note to order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content, type, addedBy } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const note = await prisma.orderNote.create({
      data: {
        orderId: id,
        content,
        type: type || "PRIVATE",
        addedBy: addedBy || "admin",
      },
    });

    // TODO: If type is CUSTOMER, send email notification
    // This would trigger the email notification system

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create order note error:", error);
    return NextResponse.json(
      { error: "Failed to create order note" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { error: "Note ID is required" },
        { status: 400 }
      );
    }

    const note = await prisma.orderNote.findFirst({
      where: { id: noteId, orderId: id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await prisma.orderNote.delete({ where: { id: noteId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete order note error:", error);
    return NextResponse.json(
      { error: "Failed to delete order note" },
      { status: 500 }
    );
  }
}
