import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        items: {
          where: { parentId: null },
          orderBy: { sortOrder: "asc" },
          include: {
            children: {
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(menus);
  } catch (error) {
    console.error("Error fetching menus:", error);
    return NextResponse.json({ error: "Failed to fetch menus" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, location } = body;

    // Check if slug exists
    const existing = await prisma.menu.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ message: "Slug already exists" }, { status: 400 });
    }

    const menu = await prisma.menu.create({
      data: {
        name,
        slug,
        location,
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error creating menu:", error);
    return NextResponse.json({ error: "Failed to create menu" }, { status: 500 });
  }
}
