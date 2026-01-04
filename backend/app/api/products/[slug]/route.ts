import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
        },
        reviews: {
          where: { status: "APPROVED" },
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: "PUBLISHED",
      },
      include: {
        images: { take: 1 },
      },
      take: 4,
    });

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) /
          product.reviews.length
        : 0;

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        sku: product.sku,
        description: product.description,
        shortDescription: product.shortDescription,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stockStatus: product.stockStatus,
        stockQuantity: product.stockQuantity,
        isLivestock: product.isLivestock,
        livestockData: product.livestockData
          ? JSON.parse(product.livestockData)
          : null,
        expressOnly: product.expressOnly,
        shippingRestricted: product.shippingRestricted,
        allowedPincodes: product.allowedPincodes
          ? JSON.parse(product.allowedPincodes)
          : [],
        category: product.category
          ? { name: product.category.name, slug: product.category.slug }
          : null,
        images: product.images.map((i) => ({
          id: i.id,
          url: i.url,
          alt: i.alt,
        })),
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          name: v.name,
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          stockStatus: v.stockStatus,
          stockQuantity: v.stockQuantity,
          image: v.image,
        })),
        reviews: {
          items: product.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            content: r.content,
            author: r.user.firstName
              ? `${r.user.firstName} ${r.user.lastName || ""}`
              : "Anonymous",
            createdAt: r.createdAt,
          })),
          count: product.reviews.length,
          average: Math.round(avgRating * 10) / 10,
        },
      },
      relatedProducts: relatedProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0]?.url || null,
        stockStatus: p.stockStatus,
      })),
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
