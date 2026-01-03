import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get single attribute with terms
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const attribute = await prisma.attribute.findUnique({
      where: { id },
      include: {
        terms: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!attribute) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ attribute });
  } catch (error) {
    console.error("Get attribute error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attribute" },
      { status: 500 }
    );
  }
}

// PUT - Update attribute
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, slug, type, sortOrder, isVisible, isVariation, terms } = body;

    // Check if attribute exists
    const existing = await prisma.attribute.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      );
    }

    // Check for duplicate slug (excluding current)
    if (slug && slug !== existing.slug) {
      const duplicate = await prisma.attribute.findFirst({
        where: { slug, id: { not: id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Attribute with this slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update attribute and handle terms
    const attribute = await prisma.$transaction(async (tx) => {
      // Update attribute
      const updated = await tx.attribute.update({
        where: { id },
        data: {
          name,
          slug,
          type,
          sortOrder,
          isVisible,
          isVariation,
        },
      });

      // Handle terms if provided
      if (terms !== undefined) {
        // Get existing term IDs
        const existingTerms = await tx.attributeTerm.findMany({
          where: { attributeId: id },
          select: { id: true },
        });
        const existingIds = existingTerms.map((t) => t.id);
        const newIds = terms.filter((t: any) => t.id).map((t: any) => t.id);

        // Delete removed terms
        const toDelete = existingIds.filter((eid) => !newIds.includes(eid));
        if (toDelete.length > 0) {
          await tx.attributeTerm.deleteMany({
            where: { id: { in: toDelete } },
          });
        }

        // Update or create terms
        for (const term of terms) {
          if (term.id) {
            await tx.attributeTerm.update({
              where: { id: term.id },
              data: {
                name: term.name,
                slug: term.slug,
                value: term.value,
                sortOrder: term.sortOrder,
              },
            });
          } else {
            await tx.attributeTerm.create({
              data: {
                attributeId: id,
                name: term.name,
                slug: term.slug,
                value: term.value,
                sortOrder: term.sortOrder,
              },
            });
          }
        }
      }

      return updated;
    });

    // Fetch updated attribute with terms
    const result = await prisma.attribute.findUnique({
      where: { id },
      include: { terms: { orderBy: { sortOrder: "asc" } } },
    });

    return NextResponse.json({ attribute: result });
  } catch (error) {
    console.error("Update attribute error:", error);
    return NextResponse.json(
      { error: "Failed to update attribute" },
      { status: 500 }
    );
  }
}

// DELETE - Delete attribute
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if attribute exists
    const existing = await prisma.attribute.findUnique({
      where: { id },
      include: { productAttributes: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Attribute not found" },
        { status: 404 }
      );
    }

    // Warn if attribute is in use
    if (existing.productAttributes.length > 0) {
      const force = new URL(request.url).searchParams.get("force") === "true";
      if (!force) {
        return NextResponse.json(
          {
            error: `Attribute is used by ${existing.productAttributes.length} products. Use force=true to delete anyway.`,
            usageCount: existing.productAttributes.length,
          },
          { status: 400 }
        );
      }
    }

    await prisma.attribute.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete attribute error:", error);
    return NextResponse.json(
      { error: "Failed to delete attribute" },
      { status: 500 }
    );
  }
}
