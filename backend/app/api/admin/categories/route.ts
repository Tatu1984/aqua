import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all categories for admin
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        bannerImage: c.bannerImage,
        parentId: c.parentId,
        parentName: c.parent?.name,
        childrenCount: c.children.length,
        productCount: c._count.products,
        sortOrder: c.sortOrder,
        isVisible: c.isVisible,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error("Admin categories fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST create category
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        image: data.image,
        bannerImage: data.bannerImage,
        parentId: data.parentId || null,
        sortOrder: data.sortOrder || 0,
        isVisible: data.isVisible ?? true,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Category creation error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
