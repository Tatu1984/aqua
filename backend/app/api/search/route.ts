import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const inStock = searchParams.get("inStock");
    const isLivestock = searchParams.get("isLivestock");
    const sort = searchParams.get("sort") || "relevance";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    // Text search
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { sku: { contains: q, mode: "insensitive" } },
      ];
    }

    // Category filter
    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
        include: { children: true },
      });
      if (categoryRecord) {
        const categoryIds = [
          categoryRecord.id,
          ...categoryRecord.children.map((c) => c.id),
        ];
        where.categoryId = { in: categoryIds };
      }
    }

    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, number>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, number>).lte = parseFloat(maxPrice);
    }

    // Stock filter
    if (inStock === "true") {
      where.stockStatus = "IN_STOCK";
    }

    // Livestock filter
    if (isLivestock === "true") {
      where.isLivestock = true;
    } else if (isLivestock === "false") {
      where.isLivestock = false;
    }

    // Sorting
    let orderBy: Record<string, string> = { createdAt: "desc" };
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" };
        break;
      case "price_desc":
        orderBy = { price: "desc" };
        break;
      case "name":
        orderBy = { name: "asc" };
        break;
      case "newest":
        orderBy = { createdAt: "desc" };
        break;
      case "popular":
        orderBy = { sortOrder: "asc" };
        break;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Get facets for filters
    const [categories, priceRange] = await Promise.all([
      prisma.category.findMany({
        where: { isVisible: true, parentId: null },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { products: true } },
        },
      }),
      prisma.product.aggregate({
        where: { status: "PUBLISHED" },
        _min: { price: true },
        _max: { price: true },
      }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0]?.url,
        category: p.category?.name,
        categorySlug: p.category?.slug,
        stockStatus: p.stockStatus,
        stockQuantity: p.stockQuantity,
        isLivestock: p.isLivestock,
        isFeatured: p.isFeatured,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      facets: {
        categories: categories.map((c) => ({
          name: c.name,
          slug: c.slug,
          count: c._count.products,
        })),
        priceRange: {
          min: priceRange._min.price || 0,
          max: priceRange._max.price || 10000,
        },
      },
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
