"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface DashboardStats {
  revenue: { value: number; change: string; trend: string };
  orders: { value: number; change: string; trend: string };
  products: { value: number; change: string; trend: string };
  customers: { value: number; change: string; trend: string };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  date: string;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [pendingOrders, setPendingOrders] = useState(0);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(`${API_URL}/api/admin/dashboard`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setRecentOrders(data.recentOrders);
          setTopProducts(data.topProducts);
          setLowStockProducts(data.lowStockProducts);
          setPendingOrders(data.pendingOrders);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-500/10 text-green-500";
      case "PROCESSING":
        return "bg-blue-500/10 text-blue-500";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-500";
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-500";
      case "CANCELLED":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          title: "Total Revenue",
          value: formatPrice(stats.revenue.value),
          change: stats.revenue.change,
          trend: stats.revenue.trend,
          icon: TrendingUp,
        },
        {
          title: "Total Orders",
          value: stats.orders.value.toString(),
          change: stats.orders.change,
          trend: stats.orders.trend,
          icon: ShoppingCart,
        },
        {
          title: "Total Products",
          value: stats.products.value.toString(),
          change: stats.products.change,
          trend: stats.products.trend,
          icon: Package,
        },
        {
          title: "Total Customers",
          value: stats.customers.value.toString(),
          change: stats.customers.change,
          trend: stats.customers.trend,
          icon: Users,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your store.
        </p>
      </div>

      {/* Alerts */}
      {(pendingOrders > 0 || lowStockProducts.length > 0) && (
        <div className="space-y-3">
          {pendingOrders > 0 && (
            <div className="flex items-center gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <p className="text-sm">
                You have{" "}
                <Link href="/admin/orders" className="font-medium underline">
                  {pendingOrders} pending order{pendingOrders > 1 ? "s" : ""}
                </Link>{" "}
                awaiting processing.
              </p>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm">
                <span className="font-medium">{lowStockProducts.length} products</span> are
                running low on stock.{" "}
                <button
                  onClick={() => {
                    const el = document.getElementById("low-stock");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="underline"
                >
                  View details
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-3">
              {stat.trend === "up" ? (
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-500" : "text-red-500"
                }`}
              >
                {stat.change}
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <Link
              href="/admin/orders"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No orders yet
              </p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-medium">{order.customer}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.orderNumber} • {formatDate(order.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(order.amount)}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Products */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Top Products</h2>
            <Link
              href="/admin/products"
              className="text-sm text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No sales data yet
              </p>
            ) : (
              topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                >
                  <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {product.sales} sales
                    </p>
                  </div>
                  <p className="font-medium">{formatPrice(product.revenue)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Low Stock Products */}
      {lowStockProducts.length > 0 && (
        <Card className="p-6" id="low-stock">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-bold">Low Stock Alert</h2>
            </div>
            <Link
              href="/admin/products"
              className="text-sm text-primary hover:underline"
            >
              Manage Inventory
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="pb-3">Product</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3">Stock</th>
                  <th className="pb-3">Threshold</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {product.sku}
                    </td>
                    <td className="py-3 font-medium">{product.stockQuantity}</td>
                    <td className="py-3 text-sm text-muted-foreground">
                      {product.lowStockThreshold}
                    </td>
                    <td className="py-3">
                      {product.stockQuantity === 0 ? (
                        <Badge variant="destructive">Out of Stock</Badge>
                      ) : (
                        <Badge variant="warning">Low Stock</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/admin/products/new"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Add Product</span>
          </Link>
          <Link
            href="/admin/categories"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Categories</span>
          </Link>
          <Link
            href="/admin/orders"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">View Orders</span>
          </Link>
          <Link
            href="/admin/coupons"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Coupons</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
