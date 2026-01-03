import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all shipping zones
export async function GET() {
  try {
    const zones = await prisma.shippingZone.findMany({
      include: {
        locations: true,
        methods: {
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ zones });
  } catch (error) {
    console.error("Get shipping zones error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping zones" },
      { status: 500 }
    );
  }
}

// POST - Create shipping zone
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, sortOrder, isActive, locations, methods } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const zone = await prisma.shippingZone.create({
      data: {
        name,
        description,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
        locations: locations?.length
          ? {
              create: locations.map((loc: any) => ({
                type: loc.type,
                code: loc.code,
              })),
            }
          : undefined,
        methods: methods?.length
          ? {
              create: methods.map((method: any, index: number) => ({
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
                sortOrder: method.sortOrder ?? index,
                isActive: method.isActive !== false,
                settings: method.settings,
              })),
            }
          : undefined,
      },
      include: {
        locations: true,
        methods: true,
      },
    });

    return NextResponse.json({ zone }, { status: 201 });
  } catch (error) {
    console.error("Create shipping zone error:", error);
    return NextResponse.json(
      { error: "Failed to create shipping zone" },
      { status: 500 }
    );
  }
}
