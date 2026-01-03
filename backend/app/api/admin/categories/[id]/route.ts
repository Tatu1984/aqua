import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Check if category exists
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check for duplicate slug
      const slugExists = await prisma.category.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Prevent circular parent reference
    if (data.parentId === id) {
      return NextResponse.json(
        { error: "Category cannot be its own parent" },
        { status: 400 }
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        slug,
        description: data.description,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        image: data.image,
        bannerImage: data.bannerImage,
        parentId: data.parentId,
        sortOrder: data.sortOrder,
        isVisible: data.isVisible,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Category update error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check for products
    if (existing._count.products > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${existing._count.products} products. Move or delete products first.`,
        },
        { status: 400 }
      );
    }

    // Check for children
    if (existing._count.children > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category with ${existing._count.children} subcategories. Delete subcategories first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
