import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single tax class with rates
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const taxClass = await prisma.taxClass.findUnique({
      where: { id },
      include: {
        rates: { orderBy: { priority: "asc" } },
        _count: { select: { products: true } },
      },
    });

    if (!taxClass) {
      return NextResponse.json(
        { error: "Tax class not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      class: {
        ...taxClass,
        productCount: taxClass._count.products,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Get tax class error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tax class" },
      { status: 500 }
    );
  }
}

// PUT - Update tax class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description, isDefault, rates } = body;

    const existing = await prisma.taxClass.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Tax class not found" },
        { status: 404 }
      );
    }

    // Handle default change
    if (isDefault && !existing.isDefault) {
      await prisma.taxClass.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const taxClass = await prisma.$transaction(async (tx) => {
      // Update tax class
      await tx.taxClass.update({
        where: { id },
        data: { name, slug, description, isDefault },
      });

      // Handle rates if provided
      if (rates !== undefined) {
        const existingRates = await tx.taxRate.findMany({
          where: { taxClassId: id },
        });
        const existingIds = existingRates.map((r) => r.id);
        const newIds = rates.filter((r: any) => r.id).map((r: any) => r.id);

        // Delete removed rates
        const toDelete = existingIds.filter((eid) => !newIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.taxRate.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert rates
        for (const rate of rates) {
          if (rate.id) {
            await tx.taxRate.update({
              where: { id: rate.id },
              data: {
                name: rate.name,
                rate: rate.rate,
                country: rate.country,
                state: rate.state,
                postcode: rate.postcode,
                city: rate.city,
                priority: rate.priority,
                compound: rate.compound,
                shipping: rate.shipping,
                isActive: rate.isActive,
              },
            });
          } else {
            await tx.taxRate.create({
              data: {
                taxClassId: id,
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
              },
            });
          }
        }
      }

      return tx.taxClass.findUnique({
        where: { id },
        include: { rates: { orderBy: { priority: "asc" } } },
      });
    });

    return NextResponse.json({ class: taxClass });
  } catch (error) {
    console.error("Update tax class error:", error);
    return NextResponse.json(
      { error: "Failed to update tax class" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tax class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.taxClass.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Tax class not found" },
        { status: 404 }
      );
    }

    if (existing._count.products > 0) {
      const force = new URL(request.url).searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Tax class is used by ${existing._count.products} products`,
            productCount: existing._count.products,
          },
          { status: 400 }
        );
      }
      await prisma.product.updateMany({
        where: { taxClassId: id },
        data: { taxClassId: null },
      });
    }

    await prisma.taxClass.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tax class error:", error);
    return NextResponse.json(
      { error: "Failed to delete tax class" },
      { status: 500 }
    );
  }
}
