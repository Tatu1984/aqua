import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single tag
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tag = await prisma.tag.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true } },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({
      tag: {
        ...tag,
        productCount: tag._count.products,
        _count: undefined,
      },
    });
  } catch (error) {
    console.error("Get tag error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tag" },
      { status: 500 }
    );
  }
}

// PUT - Update tag
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, description } = body;

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check for duplicate slug
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.tag.findFirst({
        where: { slug, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Tag with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: { name, slug, description },
    });

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    await prisma.tag.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete tag error:", error);
    return NextResponse.json(
      { error: "Failed to delete tag" },
      { status: 500 }
    );
  }
}
