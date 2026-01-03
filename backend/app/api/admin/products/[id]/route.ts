import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      product: {
        ...product,
        livestockData: product.livestockData
          ? JSON.parse(product.livestockData)
          : null,
        allowedCities: product.allowedCities
          ? JSON.parse(product.allowedCities)
          : null,
        variants: product.variants.map((v) => ({
          ...v,
          attributes: v.attributes ? JSON.parse(v.attributes) : null,
        })),
      },
    });
  } catch (error) {
    console.error("Product fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    // Check if product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Generate new slug if name changed
    let slug = existing.slug;
    if (data.name && data.name !== existing.name) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Check for duplicate slug
      const slugExists = await prisma.product.findFirst({
        where: { slug, id: { not: id } },
      });
      if (slugExists) {
        slug = `${slug}-${Date.now()}`;
      }
    }

    // Check for duplicate SKU
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.product.findFirst({
        where: { sku: data.sku, id: { not: id } },
      });
      if (skuExists) {
        return NextResponse.json(
          { error: "SKU already in use" },
          { status: 400 }
        );
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        slug,
        sku: data.sku ?? existing.sku,
        description: data.description,
        shortDescription: data.shortDescription,
        type: data.type,
        status: data.status,
        categoryId: data.categoryId,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPrice: data.costPrice,
        trackInventory: data.trackInventory,
        stockQuantity: data.stockQuantity,
        lowStockThreshold: data.lowStockThreshold,
        stockStatus: data.stockStatus,
        allowBackorder: data.allowBackorder,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        weight: data.weight,
        length: data.length,
        width: data.width,
        height: data.height,
        isLivestock: data.isLivestock,
        livestockData: data.livestockData
          ? JSON.stringify(data.livestockData)
          : null,
        shippingRestricted: data.shippingRestricted,
        allowedCities: data.allowedCities
          ? JSON.stringify(data.allowedCities)
          : null,
        expressOnly: data.expressOnly,
        isFeatured: data.isFeatured,
        sortOrder: data.sortOrder,
        publishedAt:
          data.status === "PUBLISHED" && !existing.publishedAt
            ? new Date()
            : existing.publishedAt,
      },
      include: {
        category: true,
        images: true,
        variants: true,
      },
    });

    // Update images if provided
    if (data.images) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      await prisma.productImage.createMany({
        data: data.images.map(
          (img: { url: string; alt?: string }, idx: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt || product.name,
            sortOrder: idx,
          })
        ),
      });
    }

    // Update variants if provided
    if (data.variants) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      await prisma.productVariant.createMany({
        data: data.variants.map(
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
            productId: id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stockQuantity: v.stockQuantity || 0,
            stockStatus:
              (v.stockQuantity || 0) > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
            image: v.image,
            attributes: v.attributes ? JSON.stringify(v.attributes) : null,
            sortOrder: idx,
          })
        ),
      });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if product exists
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product (images and variants cascade)
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
