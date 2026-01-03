"use client";

import { useState } from "react";
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

// Mock orders data
const mockOrders = [
  {
    id: "ORD-2024-001",
    customer: { name: "Rahul Sharma", email: "rahul@example.com" },
    items: 3,
    total: 2499,
    status: "DELIVERED",
    paymentStatus: "PAID",
    createdAt: "2024-01-15T10:30:00",
  },
  {
    id: "ORD-2024-002",
    customer: { name: "Priya Patel", email: "priya@example.com" },
    items: 5,
    total: 4999,
    status: "PROCESSING",
    paymentStatus: "PAID",
    createdAt: "2024-01-15T09:15:00",
  },
  {
    id: "ORD-2024-003",
    customer: { name: "Amit Kumar", email: "amit@example.com" },
    items: 2,
    total: 1299,
    status: "SHIPPED",
    paymentStatus: "PAID",
    createdAt: "2024-01-14T16:45:00",
  },
  {
    id: "ORD-2024-004",
    customer: { name: "Sneha Reddy", email: "sneha@example.com" },
    items: 1,
    total: 3499,
    status: "PENDING",
    paymentStatus: "PENDING",
    createdAt: "2024-01-14T14:20:00",
  },
  {
    id: "ORD-2024-005",
    customer: { name: "Vikram Singh", email: "vikram@example.com" },
    items: 4,
    total: 899,
    status: "CANCELLED",
    paymentStatus: "REFUNDED",
    createdAt: "2024-01-13T11:00:00",
  },
];

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
              {filteredOrders.length === 0 ? (
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
                      <span className="font-mono font-medium">{order.id}</span>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{order.customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {order.customer.email}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{order.items} items</td>
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
                          <DropdownMenuItem>
                            <Package className="h-4 w-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
