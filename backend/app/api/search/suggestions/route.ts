import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    // Get product suggestions
    const products = await prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        images: { take: 1, select: { url: true } },
      },
      take: 5,
      orderBy: { name: "asc" },
    });

    // Get category suggestions
    const categories = await prisma.category.findMany({
      where: {
        isVisible: true,
        name: { contains: q, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      take: 3,
    });

    return NextResponse.json({
      suggestions: {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price,
          image: p.images[0]?.url,
          type: "product",
        })),
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          type: "category",
        })),
      },
    });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return NextResponse.json({ suggestions: { products: [], categories: [] } });
  }
}
