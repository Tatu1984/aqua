import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all shipping classes
export async function GET() {
  try {
    const classes = await prisma.shippingClass.findMany({
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({
      classes: classes.map((cls) => ({
        ...cls,
        productCount: cls._count.products,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Get shipping classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping classes" },
      { status: 500 }
    );
  }
}

// POST - Create shipping class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const classSlug =
      slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.shippingClass.findUnique({
      where: { slug: classSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Shipping class with this slug already exists" },
        { status: 400 }
      );
    }

    const shippingClass = await prisma.shippingClass.create({
      data: {
        name,
        slug: classSlug,
        description,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ class: shippingClass }, { status: 201 });
  } catch (error) {
    console.error("Create shipping class error:", error);
    return NextResponse.json(
      { error: "Failed to create shipping class" },
      { status: 500 }
    );
  }
}
