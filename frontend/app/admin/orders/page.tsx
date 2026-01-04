"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingCart, Eye } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
  items: { id: string }[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    ON_HOLD: "bg-orange-500/20 text-orange-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function getPaymentBadge(status: string) {
  const styles: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PAID: "bg-green-500/20 text-green-400",
    FAILED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>
      {status}
    </span>
  );
}

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || "";

  const statuses = ["PENDING", "PROCESSING", "ON_HOLD", "COMPLETED", "CANCELLED", "REFUNDED"];

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders ({total} orders)
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={`px-4 py-2 text-sm rounded-lg border transition-colors ${!status ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${status === s ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Order</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Items</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Payment</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="font-mono font-medium text-[#00D4FF]">
                          #{order.orderNumber}
                        </p>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">
                            {order.user
                              ? `${order.user.firstName} ${order.user.lastName}`
                              : "Guest"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {order.user?.email || order.email}
                          </p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{order.items.length} items</td>
                      <td className="p-4 font-medium">{formatPrice(order.total)}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4">{getPaymentBadge(order.paymentStatus)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors inline-flex"
                          title="View Order"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Link
              href={`/admin/orders?page=${Math.max(1, page - 1)}${status ? `&status=${status}` : ""}`}
              className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </Link>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/admin/orders?page=${Math.min(totalPages, page + 1)}${status ? `&status=${status}` : ""}`}
              className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>}>
      <OrdersContent />
    </Suspense>
  );
}
