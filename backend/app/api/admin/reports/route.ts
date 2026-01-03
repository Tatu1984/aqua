import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Comprehensive reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "overview";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const period = searchParams.get("period") || "30days"; // 7days, 30days, 90days, year, all

    // Calculate date range
    let dateFrom = new Date();
    const dateTo = endDate ? new Date(endDate) : new Date();

    if (startDate) {
      dateFrom = new Date(startDate);
    } else {
      switch (period) {
        case "7days":
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case "30days":
          dateFrom.setDate(dateFrom.getDate() - 30);
          break;
        case "90days":
          dateFrom.setDate(dateFrom.getDate() - 90);
          break;
        case "year":
          dateFrom.setFullYear(dateFrom.getFullYear() - 1);
          break;
        case "all":
          dateFrom = new Date(0);
          break;
        default:
          dateFrom.setDate(dateFrom.getDate() - 30);
      }
    }

    switch (reportType) {
      case "overview":
        return NextResponse.json(await getOverviewReport(dateFrom, dateTo));
      case "sales":
        return NextResponse.json(await getSalesReport(dateFrom, dateTo));
      case "products":
        return NextResponse.json(await getProductsReport(dateFrom, dateTo));
      case "customers":
        return NextResponse.json(await getCustomersReport(dateFrom, dateTo));
      case "coupons":
        return NextResponse.json(await getCouponsReport(dateFrom, dateTo));
      case "inventory":
        return NextResponse.json(await getInventoryReport());
      case "tax":
        return NextResponse.json(await getTaxReport(dateFrom, dateTo));
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function getOverviewReport(dateFrom: Date, dateTo: Date) {
  const dateFilter = { gte: dateFrom, lte: dateTo };

  // Previous period for comparison
  const periodLength = dateTo.getTime() - dateFrom.getTime();
  const previousFrom = new Date(dateFrom.getTime() - periodLength);
  const previousTo = new Date(dateFrom.getTime() - 1);

  const [
    currentOrders,
    previousOrders,
    currentRevenue,
    previousRevenue,
    newCustomers,
    previousNewCustomers,
    totalProducts,
    lowStockProducts,
  ] = await Promise.all([
    prisma.order.count({
      where: { createdAt: dateFilter, paymentStatus: "PAID" },
    }),
    prisma.order.count({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        paymentStatus: "PAID",
      },
    }),
    prisma.order.aggregate({
      where: { createdAt: dateFilter, paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        paymentStatus: "PAID",
      },
      _sum: { total: true },
    }),
    prisma.user.count({
      where: { createdAt: dateFilter, role: "CUSTOMER" },
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: previousFrom, lte: previousTo },
        role: "CUSTOMER",
      },
    }),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({
      where: {
        status: "PUBLISHED",
        stockQuantity: { lte: prisma.product.fields.lowStockThreshold },
      },
    }),
  ]);

  const revenue = currentRevenue._sum.total || 0;
  const previousRevenueValue = previousRevenue._sum.total || 0;
  const averageOrderValue = currentOrders > 0 ? revenue / currentOrders : 0;

  return {
    type: "overview",
    period: { from: dateFrom, to: dateTo },
    metrics: {
      revenue: {
        value: revenue,
        previousValue: previousRevenueValue,
        change: previousRevenueValue > 0
          ? ((revenue - previousRevenueValue) / previousRevenueValue) * 100
          : 0,
      },
      orders: {
        value: currentOrders,
        previousValue: previousOrders,
        change: previousOrders > 0
          ? ((currentOrders - previousOrders) / previousOrders) * 100
          : 0,
      },
      averageOrderValue: {
        value: averageOrderValue,
      },
      newCustomers: {
        value: newCustomers,
        previousValue: previousNewCustomers,
        change: previousNewCustomers > 0
          ? ((newCustomers - previousNewCustomers) / previousNewCustomers) * 100
          : 0,
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts,
      },
    },
  };
}

async function getSalesReport(dateFrom: Date, dateTo: Date) {
  // Daily sales breakdown
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      paymentStatus: "PAID",
    },
    select: {
      createdAt: true,
      total: true,
      subtotal: true,
      discount: true,
      shippingCost: true,
      tax: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Group by date
  const dailySales: Record<string, {
    date: string;
    orders: number;
    revenue: number;
    discount: number;
    shipping: number;
    tax: number;
  }> = {};

  for (const order of orders) {
    const dateKey = order.createdAt.toISOString().split("T")[0];
    if (!dailySales[dateKey]) {
      dailySales[dateKey] = {
        date: dateKey,
        orders: 0,
        revenue: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
      };
    }
    dailySales[dateKey].orders += 1;
    dailySales[dateKey].revenue += order.total;
    dailySales[dateKey].discount += order.discount;
    dailySales[dateKey].shipping += order.shippingCost;
    dailySales[dateKey].tax += order.tax;
  }

  // Sales by status
  const ordersByStatus = await prisma.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: dateFrom, lte: dateTo } },
    _count: true,
    _sum: { total: true },
  });

  return {
    type: "sales",
    period: { from: dateFrom, to: dateTo },
    dailySales: Object.values(dailySales),
    byStatus: ordersByStatus.map((s) => ({
      status: s.status,
      count: s._count,
      total: s._sum.total || 0,
    })),
    totals: {
      orders: orders.length,
      revenue: orders.reduce((sum, o) => sum + o.total, 0),
      discounts: orders.reduce((sum, o) => sum + o.discount, 0),
      shipping: orders.reduce((sum, o) => sum + o.shippingCost, 0),
      tax: orders.reduce((sum, o) => sum + o.tax, 0),
    },
  };
}

async function getProductsReport(dateFrom: Date, dateTo: Date) {
  // Top selling products
  const topProducts = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      order: {
        createdAt: { gte: dateFrom, lte: dateTo },
        paymentStatus: "PAID",
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 20,
  });

  // Get product details
  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true, sku: true, price: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  // Sales by category
  const categoryStats = await prisma.orderItem.findMany({
    where: {
      order: {
        createdAt: { gte: dateFrom, lte: dateTo },
        paymentStatus: "PAID",
      },
    },
    include: {
      product: {
        select: {
          category: { select: { id: true, name: true } },
        },
      },
    },
  });

  const categoryMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  for (const item of categoryStats) {
    const catId = item.product.category?.id || "uncategorized";
    const catName = item.product.category?.name || "Uncategorized";
    if (!categoryMap[catId]) {
      categoryMap[catId] = { name: catName, quantity: 0, revenue: 0 };
    }
    categoryMap[catId].quantity += item.quantity;
    categoryMap[catId].revenue += item.total;
  }

  return {
    type: "products",
    period: { from: dateFrom, to: dateTo },
    topProducts: topProducts.map((p) => ({
      product: productMap.get(p.productId),
      quantitySold: p._sum.quantity || 0,
      revenue: p._sum.total || 0,
    })),
    byCategory: Object.entries(categoryMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue),
  };
}

async function getCustomersReport(dateFrom: Date, dateTo: Date) {
  // New vs returning customers
  const [newCustomers, returningCustomers] = await Promise.all([
    prisma.order.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        paymentStatus: "PAID",
        user: { createdAt: { gte: dateFrom } },
      },
      select: { userId: true, total: true },
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: dateFrom, lte: dateTo },
        paymentStatus: "PAID",
        user: { createdAt: { lt: dateFrom } },
      },
      select: { userId: true, total: true },
    }),
  ]);

  // Top customers
  const topCustomers = await prisma.order.groupBy({
    by: ["userId"],
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      paymentStatus: "PAID",
      userId: { not: null },
    },
    _count: true,
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 10,
  });

  const userIds = topCustomers.map((c) => c.userId!).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  return {
    type: "customers",
    period: { from: dateFrom, to: dateTo },
    newCustomers: {
      count: new Set(newCustomers.map((o) => o.userId)).size,
      orders: newCustomers.length,
      revenue: newCustomers.reduce((sum, o) => sum + o.total, 0),
    },
    returningCustomers: {
      count: new Set(returningCustomers.map((o) => o.userId)).size,
      orders: returningCustomers.length,
      revenue: returningCustomers.reduce((sum, o) => sum + o.total, 0),
    },
    topCustomers: topCustomers.map((c) => ({
      customer: userMap.get(c.userId!),
      orders: c._count,
      totalSpent: c._sum.total || 0,
    })),
  };
}

async function getCouponsReport(dateFrom: Date, dateTo: Date) {
  const coupons = await prisma.coupon.findMany({
    include: {
      orders: {
        where: {
          createdAt: { gte: dateFrom, lte: dateTo },
          paymentStatus: "PAID",
        },
        select: { discount: true },
      },
      _count: { select: { usages: true } },
    },
  });

  return {
    type: "coupons",
    period: { from: dateFrom, to: dateTo },
    coupons: coupons
      .map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        usageCount: c._count.usages,
        usageLimit: c.usageLimit,
        totalDiscount: c.orders.reduce((sum, o) => sum + o.discount, 0),
        ordersCount: c.orders.length,
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount),
  };
}

async function getInventoryReport() {
  const [
    totalProducts,
    inStock,
    outOfStock,
    lowStock,
    onBackorder,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "PUBLISHED", stockStatus: "IN_STOCK" } }),
    prisma.product.count({ where: { status: "PUBLISHED", stockStatus: "OUT_OF_STOCK" } }),
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        manageStock: true,
        stockQuantity: { gt: 0 },
      },
      select: { id: true, name: true, sku: true, stockQuantity: true, lowStockThreshold: true },
    }),
    prisma.product.count({ where: { status: "PUBLISHED", stockStatus: "ON_BACKORDER" } }),
  ]);

  // Filter low stock products
  const lowStockProducts = lowStock.filter(
    (p) => p.stockQuantity <= p.lowStockThreshold
  );

  // Recent inventory movements
  const recentMovements = await prisma.inventoryLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    type: "inventory",
    summary: {
      total: totalProducts,
      inStock,
      outOfStock,
      lowStock: lowStockProducts.length,
      onBackorder,
    },
    lowStockProducts: lowStockProducts.slice(0, 20),
    recentMovements,
  };
}

async function getTaxReport(dateFrom: Date, dateTo: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo },
      paymentStatus: "PAID",
    },
    select: {
      tax: true,
      shippingAddress: {
        select: { state: true },
      },
    },
  });

  // Group by state
  const taxByState: Record<string, number> = {};
  for (const order of orders) {
    const state = order.shippingAddress?.state || "Unknown";
    taxByState[state] = (taxByState[state] || 0) + order.tax;
  }

  return {
    type: "tax",
    period: { from: dateFrom, to: dateTo },
    totalTax: orders.reduce((sum, o) => sum + o.tax, 0),
    orderCount: orders.length,
    byState: Object.entries(taxByState)
      .map(([state, tax]) => ({ state, tax }))
      .sort((a, b) => b.tax - a.tax),
  };
}
