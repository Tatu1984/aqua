import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const menu = await prisma.menu.findUnique({ where: { id } });
    if (!menu) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const menuItem = await prisma.menuItem.create({
      data: {
        menuId: id,
        title: body.title,
        url: body.url,
        type: body.type || "CUSTOM",
        target: body.target || "_self",
        targetId: body.targetId,
        parentId: body.parentId,
        sortOrder: body.sortOrder || 0,
        isActive: body.isActive !== undefined ? body.isActive : true,
      },
    });

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}
