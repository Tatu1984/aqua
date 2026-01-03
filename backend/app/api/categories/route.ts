import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isVisible: true },
      include: {
        _count: {
          select: { products: true },
        },
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const formattedCategories = categories
      .filter((c) => !c.parentId) // Only top-level
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        productCount: c._count.products,
        children: c.children.map((child) => ({
          id: child.id,
          name: child.name,
          slug: child.slug,
        })),
      }));

    return NextResponse.json({ categories: formattedCategories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
