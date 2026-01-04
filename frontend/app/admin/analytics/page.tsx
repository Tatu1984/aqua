"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from "lucide-react";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  newCustomers: number;
  totalProducts: number;
  ordersThisMonth: number;
  ordersChange: number;
  revenueThisMonth: number;
  revenueChange: number;
}

interface TopProduct {
  productId: string;
  _sum: { quantity: number; total: number };
  product: { name: string } | null;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  user: { firstName: string | null; lastName: string | null } | null;
}

interface OrderStatus {
  status: string;
  _count: { id: number };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = { PENDING: "bg-yellow-500/20 text-yellow-400", PROCESSING: "bg-blue-500/20 text-blue-400", COMPLETED: "bg-green-500/20 text-green-400", CANCELLED: "bg-red-500/20 text-red-400" };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalRevenue: 0, newCustomers: 0, totalProducts: 0, ordersThisMonth: 0, ordersChange: 0, revenueThisMonth: 0, revenueChange: 0 });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      setStats(data.stats || { totalOrders: 0, totalRevenue: 0, newCustomers: 0, totalProducts: 0, ordersThisMonth: 0, ordersChange: 0, revenueThisMonth: 0, revenueChange: 0 });
      setTopProducts(data.topProducts || []);
      setRecentOrders(data.recentOrders || []);
      setOrdersByStatus(data.ordersByStatus || []);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Store performance and insights</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center"><DollarSign className="h-5 w-5 text-[#00D4FF]" /></div>
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
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><ShoppingCart className="h-5 w-5 text-green-400" /></div>
            <div className={`flex items-center gap-1 text-sm ${stats.ordersChange >= 0 ? "text-green-400" : "text-red-400"}`}>
              {stats.ordersChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              {Math.abs(stats.ordersChange).toFixed(1)}%
            </div>
          </div>
          <p className="text-2xl font-bold mt-3">{stats.ordersThisMonth}</p>
          <p className="text-sm text-muted-foreground">Orders this month</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Users className="h-5 w-5 text-purple-400" /></div>
          <p className="text-2xl font-bold mt-3">{stats.newCustomers}</p>
          <p className="text-sm text-muted-foreground">New customers</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><Package className="h-5 w-5 text-orange-400" /></div>
          <p className="text-2xl font-bold mt-3">{stats.totalProducts}</p>
          <p className="text-sm text-muted-foreground">Active products</p>
        </div>
      </div>

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
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {ordersByStatus.map((item) => {
              const total = ordersByStatus.reduce((sum, s) => sum + s._count.id, 0);
              const percentage = total > 0 ? (item._count.id / total) * 100 : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`px-2 py-0.5 rounded-full ${getStatusColor(item.status)}`}>{item.status}</span>
                    <span className="text-muted-foreground">{item._count.id} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-[#00D4FF] rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Top Products</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (<p className="text-muted-foreground text-sm">No sales data yet</p>) : (
              topProducts.map((item, index) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product?.name || "Unknown Product"}</p>
                    <p className="text-xs text-muted-foreground">{item._sum.quantity} sold</p>
                  </div>
                  <p className="font-medium text-[#00D4FF]">{formatPrice(item._sum.total || 0)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold">Recent Orders</h3></div>
        <div className="divide-y divide-border">
          {recentOrders.map((order) => (
            <div key={order.id} className="p-4 flex items-center justify-between">
              <div>
                <Link href={`/admin/orders/${order.id}`} className="font-mono font-medium text-[#00D4FF] hover:underline">#{order.orderNumber}</Link>
                <p className="text-sm text-muted-foreground">{order.user ? `${order.user.firstName} ${order.user.lastName}` : "Guest"}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatPrice(order.total)}</p>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>{order.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
