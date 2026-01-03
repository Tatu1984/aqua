import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all tax classes with rates
export async function GET() {
  try {
    const classes = await prisma.taxClass.findMany({
      include: {
        rates: {
          orderBy: { priority: "asc" },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      classes: classes.map((cls) => ({
        ...cls,
        productCount: cls._count.products,
        _count: undefined,
      })),
    });
  } catch (error) {
    console.error("Get tax classes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax classes" },
      { status: 500 }
    );
  }
}

// POST - Create tax class
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, isDefault, rates } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const classSlug =
      slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const existing = await prisma.taxClass.findUnique({
      where: { slug: classSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tax class with this slug already exists" },
        { status: 400 }
      );
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      await prisma.taxClass.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const taxClass = await prisma.taxClass.create({
      data: {
        name,
        slug: classSlug,
        description,
        isDefault: isDefault || false,
        rates: rates?.length
          ? {
              create: rates.map((rate: any) => ({
                name: rate.name,
                rate: rate.rate,
                country: rate.country || "IN",
                state: rate.state,
                postcode: rate.postcode,
                city: rate.city,
                priority: rate.priority || 1,
                compound: rate.compound || false,
                shipping: rate.shipping !== false,
                isActive: rate.isActive !== false,
              })),
            }
          : undefined,
      },
      include: { rates: true },
    });

    return NextResponse.json({ class: taxClass }, { status: 201 });
  } catch (error) {
    console.error("Create tax class error:", error);
    return NextResponse.json(
      { error: "Failed to create tax class" },
      { status: 500 }
    );
  }
}
