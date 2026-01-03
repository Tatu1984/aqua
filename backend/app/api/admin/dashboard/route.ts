import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET dashboard stats
export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month stats
    const [
      totalRevenue,
      lastMonthRevenue,
      totalOrders,
      lastMonthOrders,
      totalProducts,
      totalCustomers,
      lastMonthCustomers,
      recentOrders,
      topProducts,
      lowStockProducts,
      pendingOrders,
    ] = await Promise.all([
      // Revenue this month
      prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      // Revenue last month
      prisma.order.aggregate({
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { total: true },
      }),
      // Orders this month
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // Orders last month
      prisma.order.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      // Total products
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      // Customers this month
      prisma.user.count({
        where: { role: "CUSTOMER", createdAt: { gte: startOfMonth } },
      }),
      // Customers last month
      prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          email: true,
          total: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { firstName: true, lastName: true } },
        },
      }),
      // Top products by sales
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      // Low stock products
      prisma.product.findMany({
        where: {
          status: "PUBLISHED",
          stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true,
        },
        take: 10,
        orderBy: { stockQuantity: "asc" },
      }),
      // Pending orders count
      prisma.order.count({ where: { status: "PENDING" } }),
    ]);

    // Get product details for top products
    const topProductIds = topProducts.map((p) => p.productId);
    const productDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true },
    });

    const productMap = new Map(productDetails.map((p) => [p.id, p.name]));

    // Calculate changes
    const currentRevenue = totalRevenue._sum.total || 0;
    const prevRevenue = lastMonthRevenue._sum.total || 0;
    const revenueChange =
      prevRevenue > 0
        ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
        : "0";

    const ordersChange =
      lastMonthOrders > 0
        ? (
            ((totalOrders - lastMonthOrders) / lastMonthOrders) *
            100
          ).toFixed(1)
        : "0";

    const customersChange =
      lastMonthCustomers > 0
        ? (
            ((totalCustomers - lastMonthCustomers) / lastMonthCustomers) *
            100
          ).toFixed(1)
        : "0";

    return NextResponse.json({
      stats: {
        revenue: {
          value: currentRevenue,
          change: `${parseFloat(revenueChange) >= 0 ? "+" : ""}${revenueChange}%`,
          trend: parseFloat(revenueChange) >= 0 ? "up" : "down",
        },
        orders: {
          value: totalOrders,
          change: `${parseFloat(ordersChange) >= 0 ? "+" : ""}${ordersChange}%`,
          trend: parseFloat(ordersChange) >= 0 ? "up" : "down",
        },
        products: {
          value: totalProducts,
          change: "+0",
          trend: "up",
        },
        customers: {
          value: totalCustomers,
          change: `${parseFloat(customersChange) >= 0 ? "+" : ""}${customersChange}%`,
          trend: parseFloat(customersChange) >= 0 ? "up" : "down",
        },
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer:
          o.user?.firstName && o.user?.lastName
            ? `${o.user.firstName} ${o.user.lastName}`
            : o.email,
        amount: o.total,
        status: o.status,
        paymentStatus: o.paymentStatus,
        date: o.createdAt,
      })),
      topProducts: topProducts.map((p) => ({
        id: p.productId,
        name: productMap.get(p.productId) || "Unknown Product",
        sales: p._sum.quantity || 0,
        revenue: p._sum.total || 0,
      })),
      lowStockProducts,
      pendingOrders,
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
