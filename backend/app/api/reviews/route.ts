import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "aqua-secret-key-change-in-production"
);

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch {
    return null;
  }
}

// Get reviews for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const productSlug = searchParams.get("slug");

    let where: Record<string, unknown> = { status: "APPROVED" };

    if (productId) {
      where.productId = productId;
    } else if (productSlug) {
      const product = await prisma.product.findUnique({
        where: { slug: productSlug },
      });
      if (!product) {
        return NextResponse.json({ reviews: [], stats: null });
      }
      where.productId = product.id;
    }

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate stats
    const stats = {
      count: reviews.length,
      average: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
      distribution: {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      },
    };

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        title: r.title,
        content: r.content,
        author: r.user.firstName
          ? `${r.user.firstName} ${r.user.lastName || ""}`.trim()
          : "Anonymous",
        isVerified: r.isVerified,
        createdAt: r.createdAt,
      })),
      stats,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Failed to get reviews" }, { status: 500 });
  }
}

// Add review
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { productId, rating, title, content } = await request.json();

    if (!productId || !rating) {
      return NextResponse.json(
        { error: "Product ID and rating required" },
        { status: 400 }
      );
    }

    // Check if user already reviewed this product
    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId } },
    });

    if (existing) {
      // Update existing review
      const review = await prisma.review.update({
        where: { id: existing.id },
        data: { rating, title, content },
      });
      return NextResponse.json({ review });
    }

    // Check if user purchased this product (for verified badge)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: "DELIVERED" },
      },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId,
        rating,
        title,
        content,
        isVerified: !!hasPurchased,
        status: "APPROVED", // Auto-approve for now
      },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Add review error:", error);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}
