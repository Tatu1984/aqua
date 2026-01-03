import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single shipping zone
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const zone = await prisma.shippingZone.findUnique({
      where: { id },
      include: {
        locations: true,
        methods: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!zone) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ zone });
  } catch (error) {
    console.error("Get shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping zone" },
      { status: 500 }
    );
  }
}

// PUT - Update shipping zone
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, sortOrder, isActive, locations, methods } = body;

    const existing = await prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    const zone = await prisma.$transaction(async (tx) => {
      // Update zone
      await tx.shippingZone.update({
        where: { id },
        data: { name, description, sortOrder, isActive },
      });

      // Handle locations
      if (locations !== undefined) {
        await tx.shippingZoneLocation.deleteMany({
          where: { shippingZoneId: id },
        });
        if (locations.length > 0) {
          await tx.shippingZoneLocation.createMany({
            data: locations.map((loc: any) => ({
              shippingZoneId: id,
              type: loc.type,
              code: loc.code,
            })),
          });
        }
      }

      // Handle methods
      if (methods !== undefined) {
        const existingMethods = await tx.shippingZoneMethod.findMany({
          where: { shippingZoneId: id },
        });
        const existingIds = existingMethods.map((m) => m.id);
        const newIds = methods.filter((m: any) => m.id).map((m: any) => m.id);

        // Delete removed methods
        const toDelete = existingIds.filter((eid) => !newIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.shippingZoneMethod.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Upsert methods
        for (const method of methods) {
          if (method.id) {
            await tx.shippingZoneMethod.update({
              where: { id: method.id },
              data: {
                methodType: method.methodType,
                title: method.title,
                description: method.description,
                cost: method.cost,
                costPerItem: method.costPerItem,
                costPerWeight: method.costPerWeight,
                minAmount: method.minAmount,
                maxAmount: method.maxAmount,
                minWeight: method.minWeight,
                maxWeight: method.maxWeight,
                taxable: method.taxable,
                sortOrder: method.sortOrder,
                isActive: method.isActive,
                settings: method.settings,
              },
            });
          } else {
            await tx.shippingZoneMethod.create({
              data: {
                shippingZoneId: id,
                methodType: method.methodType,
                title: method.title,
                description: method.description,
                cost: method.cost,
                costPerItem: method.costPerItem,
                costPerWeight: method.costPerWeight,
                minAmount: method.minAmount,
                maxAmount: method.maxAmount,
                minWeight: method.minWeight,
                maxWeight: method.maxWeight,
                taxable: method.taxable !== false,
                sortOrder: method.sortOrder,
                isActive: method.isActive !== false,
                settings: method.settings,
              },
            });
          }
        }
      }

      return tx.shippingZone.findUnique({
        where: { id },
        include: {
          locations: true,
          methods: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json({ zone });
  } catch (error) {
    console.error("Update shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to update shipping zone" },
      { status: 500 }
    );
  }
}

// DELETE - Delete shipping zone
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.shippingZone.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Shipping zone not found" },
        { status: 404 }
      );
    }

    await prisma.shippingZone.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping zone" },
      { status: 500 }
    );
  }
}
