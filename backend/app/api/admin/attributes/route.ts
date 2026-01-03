import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - List all attributes with terms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeTerms = searchParams.get("includeTerms") === "true";

    const attributes = await prisma.attribute.findMany({
      include: includeTerms
        ? {
            terms: {
              orderBy: { sortOrder: "asc" },
            },
          }
        : undefined,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ attributes });
  } catch (error) {
    console.error("Get attributes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch attributes" },
      { status: 500 }
    );
  }
}

// POST - Create attribute
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, type, sortOrder, isVisible, isVariation, terms } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const existing = await prisma.attribute.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Attribute with this slug already exists" },
        { status: 400 }
      );
    }

    const attribute = await prisma.attribute.create({
      data: {
        name,
        slug,
        type: type || "SELECT",
        sortOrder: sortOrder || 0,
        isVisible: isVisible !== false,
        isVariation: isVariation !== false,
        terms: terms?.length
          ? {
              create: terms.map((term: any, index: number) => ({
                name: term.name,
                slug: term.slug,
                value: term.value,
                sortOrder: term.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        terms: true,
      },
    });

    return NextResponse.json({ attribute }, { status: 201 });
  } catch (error) {
    console.error("Create attribute error:", error);
    return NextResponse.json(
      { error: "Failed to create attribute" },
      { status: 500 }
    );
  }
}
