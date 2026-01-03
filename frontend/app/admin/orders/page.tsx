"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Eye,
  MoreHorizontal,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: { quantity: number }[];
  user?: { firstName: string; lastName: string };
}

type OrderStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return <Clock className="h-4 w-4" />;
    case "PROCESSING":
      return <Package className="h-4 w-4" />;
    case "SHIPPED":
      return <Truck className="h-4 w-4" />;
    case "DELIVERED":
      return <CheckCircle className="h-4 w-4" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    case "SHIPPED":
      return "bg-purple-500/10 text-purple-500 border-purple-500/20";
    case "DELIVERED":
      return "bg-green-500/10 text-green-500 border-green-500/20";
    case "CANCELLED":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    default:
      return "bg-gray-500/10 text-gray-500 border-gray-500/20";
  }
};

const getPaymentBadge = (status: PaymentStatus) => {
  switch (status) {
    case "PAID":
      return <Badge variant="success">Paid</Badge>;
    case "PENDING":
      return <Badge variant="warning">Pending</Badge>;
    case "FAILED":
      return <Badge variant="destructive">Failed</Badge>;
    case "REFUNDED":
      return <Badge variant="secondary">Refunded</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: "20",
        });
        if (search) params.append("search", search);
        if (statusFilter !== "all") params.append("status", statusFilter);

        const res = await fetch(`${API_URL}/api/orders?${params}`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders);
          setTotalPages(data.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [page, search, statusFilter]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === orderId ? { ...o, status: newStatus } : o
          )
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const openInvoice = (orderId: string) => {
    window.open(`${API_URL}/api/orders/${orderId}/invoice?print=true`, "_blank");
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage customer orders</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-background border border-input rounded-md text-sm"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4">Order</th>
                <th className="p-4">Customer</th>
                <th className="p-4">Items</th>
                <th className="p-4">Total</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment</th>
                <th className="p-4">Date</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="p-8 text-center text-muted-foreground"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-border hover:bg-secondary/50"
                  >
                    <td className="p-4">
                      <span className="font-mono font-medium">
                        {order.orderNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">
                          {order.user
                            ? `${order.user.firstName || ""} ${order.user.lastName || ""}`.trim() ||
                              order.email
                            : order.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {order.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                    </td>
                    <td className="p-4 font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="p-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          order.status as OrderStatus
                        )}`}
                      >
                        {getStatusIcon(order.status as OrderStatus)}
                        {order.status}
                      </div>
                    </td>
                    <td className="p-4">
                      {getPaymentBadge(order.paymentStatus as PaymentStatus)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openInvoice(order.id)}>
                            <FileText className="h-4 w-4 mr-2" />
                            Download Invoice
                          </DropdownMenuItem>
                          {order.status === "PENDING" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(order.id, "PROCESSING")
                              }
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Mark Processing
                            </DropdownMenuItem>
                          )}
                          {order.status === "PROCESSING" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(order.id, "SHIPPED")
                              }
                            >
                              <Truck className="h-4 w-4 mr-2" />
                              Mark Shipped
                            </DropdownMenuItem>
                          )}
                          {order.status === "SHIPPED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(order.id, "DELIVERED")
                              }
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Delivered
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
