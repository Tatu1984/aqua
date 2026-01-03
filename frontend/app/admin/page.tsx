import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";

// Stats cards data
const stats = [
  {
    title: "Total Revenue",
    value: "₹1,24,500",
    change: "+12.5%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Total Orders",
    value: "156",
    change: "+8.2%",
    trend: "up",
    icon: ShoppingCart,
  },
  {
    title: "Total Products",
    value: "234",
    change: "+3",
    trend: "up",
    icon: Package,
  },
  {
    title: "Total Customers",
    value: "1,089",
    change: "+5.4%",
    trend: "up",
    icon: Users,
  },
];

// Recent orders (mock data)
const recentOrders = [
  {
    id: "ORD001",
    customer: "Rahul Sharma",
    amount: 2499,
    status: "Delivered",
    date: "2024-01-15",
  },
  {
    id: "ORD002",
    customer: "Priya Patel",
    amount: 4999,
    status: "Processing",
    date: "2024-01-15",
  },
  {
    id: "ORD003",
    customer: "Amit Kumar",
    amount: 1299,
    status: "Shipped",
    date: "2024-01-14",
  },
  {
    id: "ORD004",
    customer: "Sneha Reddy",
    amount: 3499,
    status: "Pending",
    date: "2024-01-14",
  },
  {
    id: "ORD005",
    customer: "Vikram Singh",
    amount: 899,
    status: "Delivered",
    date: "2024-01-13",
  },
];

// Top products (mock data)
const topProducts = [
  { name: "Neon Tetra (School of 10)", sales: 45, revenue: 13455 },
  { name: "Betta Fish - Halfmoon", sales: 38, revenue: 18962 },
  { name: "Cherry Shrimp (Pack of 5)", sales: 32, revenue: 7968 },
  { name: "Java Fern - Large", sales: 28, revenue: 4172 },
  { name: "LED Aquarium Light Pro", sales: 22, revenue: 54978 },
];

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-500/10 text-green-500";
    case "Processing":
      return "bg-blue-500/10 text-blue-500";
    case "Shipped":
      return "bg-purple-500/10 text-purple-500";
    case "Pending":
      return "bg-yellow-500/10 text-yellow-500";
    default:
      return "bg-gray-500/10 text-gray-500";
  }
};

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
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
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{order.customer}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.id} • {order.date}
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
            ))}
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
            {topProducts.map((product, index) => (
              <div
                key={product.name}
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
            ))}
          </div>
        </Card>
      </div>

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
            href="/admin/categories/new"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <Package className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Add Category</span>
          </Link>
          <Link
            href="/admin/orders"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <ShoppingCart className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">View Orders</span>
          </Link>
          <Link
            href="/admin/settings"
            className="p-4 rounded-lg bg-secondary hover:bg-secondary/80 text-center transition-colors"
          >
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </Card>
    </div>
  );
}
