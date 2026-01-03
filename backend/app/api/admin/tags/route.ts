import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all tags with product count
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          _count: { select: { products: true } },
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      prisma.tag.count({ where }),
    ]);

    return NextResponse.json({
      tags: tags.map((tag) => ({
        ...tag,
        productCount: tag._count.products,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tags error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST - Create tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const tagSlug = slug || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    // Check for duplicate slug
    const existing = await prisma.tag.findUnique({
      where: { slug: tagSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tag with this slug already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug: tagSlug,
        description,
      },
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

// DELETE - Bulk delete tags
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Tag IDs are required" },
        { status: 400 }
      );
    }

    await prisma.tag.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deletedCount: ids.length });
  } catch (error) {
    console.error("Bulk delete tags error:", error);
    return NextResponse.json(
      { error: "Failed to delete tags" },
      { status: 500 }
    );
  }
}
