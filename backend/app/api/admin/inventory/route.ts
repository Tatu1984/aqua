import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Get inventory logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");
    const type = searchParams.get("type");
    const reason = searchParams.get("reason");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;
    if (reason) where.reason = reason;

    const [logs, total] = await Promise.all([
      prisma.inventoryLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.inventoryLog.count({ where }),
    ]);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get inventory logs error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory logs" },
      { status: 500 }
    );
  }
}

// POST - Manual inventory adjustment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, variantId, type, quantity, reason, notes, createdBy } = body;

    if (!productId || !type || quantity === undefined) {
      return NextResponse.json(
        { error: "Product ID, type, and quantity are required" },
        { status: 400 }
      );
    }

    if (!["INCREASE", "DECREASE", "SET"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be INCREASE, DECREASE, or SET" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      let previousQty: number;
      let newQty: number;

      if (variantId) {
        // Variant inventory
        const variant = await tx.productVariant.findUnique({
          where: { id: variantId },
          select: { stockQuantity: true },
        });

        if (!variant) {
          throw new Error("Variant not found");
        }

        previousQty = variant.stockQuantity;

        if (type === "INCREASE") {
          newQty = previousQty + quantity;
        } else if (type === "DECREASE") {
          newQty = Math.max(0, previousQty - quantity);
        } else {
          newQty = quantity;
        }

        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockQuantity: newQty,
            stockStatus: newQty <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
          },
        });
      } else {
        // Product inventory
        const product = await tx.product.findUnique({
          where: { id: productId },
          select: { stockQuantity: true, lowStockThreshold: true, backorderMode: true },
        });

        if (!product) {
          throw new Error("Product not found");
        }

        previousQty = product.stockQuantity;

        if (type === "INCREASE") {
          newQty = previousQty + quantity;
        } else if (type === "DECREASE") {
          newQty = Math.max(0, previousQty - quantity);
        } else {
          newQty = quantity;
        }

        let stockStatus = "IN_STOCK";
        if (newQty <= 0) {
          stockStatus = product.backorderMode !== "NO" ? "ON_BACKORDER" : "OUT_OF_STOCK";
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            stockQuantity: newQty,
            stockStatus,
          },
        });
      }

      // Create log
      const log = await tx.inventoryLog.create({
        data: {
          productId,
          variantId,
          type,
          quantity,
          previousQty,
          newQty,
          reason: reason || "ADJUSTMENT",
          notes,
          createdBy,
        },
      });

      return { log, previousQty, newQty };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Inventory adjustment error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to adjust inventory" },
      { status: 500 }
    );
  }
}

// PUT - Bulk inventory update
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { updates, reason, notes, createdBy } = body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    const results = await prisma.$transaction(async (tx) => {
      const logs = [];

      for (const update of updates) {
        const { productId, variantId, quantity } = update;

        if (variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: variantId },
            select: { stockQuantity: true },
          });

          if (variant) {
            const previousQty = variant.stockQuantity;

            await tx.productVariant.update({
              where: { id: variantId },
              data: {
                stockQuantity: quantity,
                stockStatus: quantity <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
              },
            });

            logs.push(
              await tx.inventoryLog.create({
                data: {
                  productId,
                  variantId,
                  type: "SET",
                  quantity,
                  previousQty,
                  newQty: quantity,
                  reason: reason || "BULK_UPDATE",
                  notes,
                  createdBy,
                },
              })
            );
          }
        } else {
          const product = await tx.product.findUnique({
            where: { id: productId },
            select: { stockQuantity: true, backorderMode: true },
          });

          if (product) {
            const previousQty = product.stockQuantity;

            let stockStatus = "IN_STOCK";
            if (quantity <= 0) {
              stockStatus = product.backorderMode !== "NO" ? "ON_BACKORDER" : "OUT_OF_STOCK";
            }

            await tx.product.update({
              where: { id: productId },
              data: { stockQuantity: quantity, stockStatus },
            });

            logs.push(
              await tx.inventoryLog.create({
                data: {
                  productId,
                  variantId: null,
                  type: "SET",
                  quantity,
                  previousQty,
                  newQty: quantity,
                  reason: reason || "BULK_UPDATE",
                  notes,
                  createdBy,
                },
              })
            );
          }
        }
      }

      return logs;
    });

    return NextResponse.json({ logs: results, count: results.length });
  } catch (error) {
    console.error("Bulk inventory update error:", error);
    return NextResponse.json(
      { error: "Failed to update inventory" },
      { status: 500 }
    );
  }
}
