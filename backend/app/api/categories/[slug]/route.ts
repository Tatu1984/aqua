import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isVisible: true },
          orderBy: { sortOrder: "asc" },
        },
        parent: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        image: category.image,
        bannerImage: category.bannerImage,
        productCount: category._count.products,
        parent: category.parent
          ? { name: category.parent.name, slug: category.parent.slug }
          : null,
        children: category.children.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          image: c.image,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}
