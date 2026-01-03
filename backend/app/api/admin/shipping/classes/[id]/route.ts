import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single shipping class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shippingClass = await prisma.shippingClass.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!shippingClass) {
      return NextResponse.json(
        { error: "Shipping class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      class: {
        ...shippingClass,
        productCount: shippingClass._count.products,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Get shipping class error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping class" },
      { status: 500 }
    );
  }
}

// PUT - Update shipping class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, sortOrder } = body;

    const existing = await prisma.shippingClass.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Shipping class not found" },
        { status: 404 }
      );
    }

    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.shippingClass.findFirst({
        where: { slug, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Shipping class with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const shippingClass = await prisma.shippingClass.update({
      where: { id },
      data: { name, slug, description, sortOrder },
    });

    return NextResponse.json({ class: shippingClass });
  } catch (error) {
    console.error("Update shipping class error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping class" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.shippingClass.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Shipping class not found" },
        { status: 404 }
      );
    }

    if (existing._count.products > 0) {
      const force = new URL(request.url).searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Shipping class is used by ${existing._count.products} products`,
            productCount: existing._count.products,
          },
          { status: 400 }
        );
      }
      // Remove shipping class from products first
      await prisma.product.updateMany({
        where: { shippingClassId: id },
        data: { shippingClassId: null },
      });
    }

    await prisma.shippingClass.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shipping class error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping class" },
      { status: 500 }
    );
  }
}
