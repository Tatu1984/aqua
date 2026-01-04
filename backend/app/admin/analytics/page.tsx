import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Eye, Package, Calendar } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getAnalytics() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now.setDate(now.getDate() - 7));
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Get current month stats
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
    dailyRevenue,
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
    prisma.$queryRaw`
      SELECT
        DATE("createdAt") as date,
        SUM(total) as revenue
      FROM orders
      WHERE "createdAt" >= ${startOfWeek} AND "paymentStatus" = 'PAID'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Promise<{ date: Date; revenue: number }[]>,
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

  return {
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
    dailyRevenue,
  };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}

export default async function AnalyticsPage() {
  const { stats, topProducts, recentOrders, ordersByStatus, dailyRevenue } = await getAnalytics();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Store performance and insights
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.revenueChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.revenueChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stats.revenueChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold mt-3">{formatPrice(stats.revenueThisMonth)}</p>
          <p className="text-sm text-muted-foreground">Revenue this month</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-green-400" />
            </div>
            <div className={`flex items-center gap-1 text-sm ${stats.ordersChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.ordersChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stats.ordersChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold mt-3">{stats.ordersThisMonth}</p>
          <p className="text-sm text-muted-foreground">Orders this month</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-purple-400" />
          </div>
          <p className="text-2xl font-bold mt-3">{stats.newCustomers}</p>
          <p className="text-sm text-muted-foreground">New customers</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
            <Package className="h-5 w-5 text-orange-400" />
          </div>
          <p className="text-2xl font-bold mt-3">{stats.totalProducts}</p>
          <p className="text-sm text-muted-foreground">Active products</p>
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-[#00D4FF]">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-sm text-muted-foreground mt-1">Lifetime earnings</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">Total Orders</h3>
          <p className="text-3xl font-bold">{stats.totalOrders}</p>
          <p className="text-sm text-muted-foreground mt-1">All time orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {ordersByStatus.map((item) => {
              const total = ordersByStatus.reduce((sum, s) => sum + s._count.id, 0);
              const percentage = total > 0 ? (item._count.id / total) * 100 : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                    <span className="text-muted-foreground">
                      {item._count.id} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#00D4FF] rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sales data yet</p>
            ) : (
              topProducts.map((item, index) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {item.product?.name || "Unknown Product"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item._sum.quantity} sold
                    </p>
                  </div>
                  <p className="font-medium text-[#00D4FF]">
                    {formatPrice(item._sum.total || 0)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Recent Orders</h3>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-mono font-medium text-[#00D4FF]">
                  #{order.orderNumber}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(order.total)}</p>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
