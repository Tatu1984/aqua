import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET all products for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const categoryId = searchParams.get("categoryId") || "";
    const stockStatus = searchParams.get("stockStatus") || "";

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (stockStatus) {
      where.stockStatus = stockStatus;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        stockQuantity: p.stockQuantity,
        stockStatus: p.stockStatus,
        status: p.status,
        isFeatured: p.isFeatured,
        isLivestock: p.isLivestock,
        category: p.category?.name,
        categoryId: p.categoryId,
        image: p.images[0]?.url,
        createdAt: p.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin products fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create product
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check for duplicate slug
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "Product with this name already exists" },
        { status: 400 }
      );
    }

    // Check for duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      return NextResponse.json(
        { error: "Product with this SKU already exists" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        sku: data.sku,
        description: data.description,
        shortDescription: data.shortDescription,
        type: data.type || "SIMPLE",
        status: data.status || "PUBLISHED",
        categoryId: data.categoryId || null,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        manageStock: data.manageStock ?? true,
        stockQuantity: data.stockQuantity || 0,
        lowStockThreshold: data.lowStockThreshold || 5,
        stockStatus: data.stockStatus || "IN_STOCK",
        backorderMode: data.backorderMode ?? "NO",
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        isLivestock: data.isLivestock ?? false,
        livestockData: data.livestockData
          ? JSON.stringify(data.livestockData)
          : null,
        shippingRestricted: data.shippingRestricted ?? false,
        allowedPincodes: data.allowedPincodes
          ? JSON.stringify(data.allowedPincodes)
          : null,
        expressOnly: data.expressOnly ?? false,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder || 0,
        publishedAt: data.status === "PUBLISHED" ? new Date() : null,
        images: data.images?.length
          ? {
              create: data.images.map(
                (img: { url: string; alt?: string }, idx: number) => ({
                  url: img.url,
                  alt: img.alt || data.name,
                  sortOrder: idx,
                })
              ),
            }
          : undefined,
        variants: data.variants?.length
          ? {
              create: data.variants.map(
                (
                  v: {
                    sku: string;
                    name: string;
                    price: number;
                    compareAtPrice?: number;
                    stockQuantity?: number;
                    image?: string;
                    attributes?: Record<string, unknown>;
                  },
                  idx: number
                ) => ({
                  sku: v.sku,
                  name: v.name,
                  price: v.price,
                  compareAtPrice: v.compareAtPrice,
                  stockQuantity: v.stockQuantity || 0,
                  stockStatus:
                    (v.stockQuantity || 0) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
                  image: v.image,
                  sortOrder: idx,
                })
              ),
            }
          : undefined,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
