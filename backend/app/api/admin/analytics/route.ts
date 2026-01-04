import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      totalOrders,
      totalRevenue,
      newCustomers,
      totalProducts,
      ordersThisMonth,
      ordersLastMonth,
      revenueThisMonth,
      revenueLastMonth,
      topProducts,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: "PAID" },
      }),
      prisma.user.count({
        where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
      }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: startOfMonth }, paymentStatus: "PAID" },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
          paymentStatus: "PAID",
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
    ]);

    // Get product names for top products
    const productIds = topProducts.map((p) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });

    const topProductsWithNames = topProducts.map((p) => ({
      ...p,
      product: products.find((prod) => prod.id === p.productId),
    }));

    // Calculate percentage changes
    const ordersChange = ordersLastMonth > 0
      ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth) * 100
      : 100;

    const revenueChange = (revenueLastMonth._sum.total || 0) > 0
      ? (((revenueThisMonth._sum.total || 0) - (revenueLastMonth._sum.total || 0)) / (revenueLastMonth._sum.total || 1)) * 100
      : 100;

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue: totalRevenue._sum.total || 0,
        newCustomers,
        totalProducts,
        ordersThisMonth,
        ordersChange,
        revenueThisMonth: revenueThisMonth._sum.total || 0,
        revenueChange,
      },
      topProducts: topProductsWithNames,
      recentOrders,
      ordersByStatus,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
