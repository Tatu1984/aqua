"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  MapPin,
  Star,
  CreditCard,
  Edit,
} from "lucide-react";

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  addresses: {
    id: string;
    type: string;
    firstName: string;
    lastName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    isDefault: boolean;
  }[];
  orders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    product: { name: string };
  }[];
  _count: {
    orders: number;
    reviews: number;
  };
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
  }).format(new Date(date));
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    COMPLETED: "bg-green-500/20 text-green-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    ACTIVE: "bg-green-500/20 text-green-400",
    SUSPENDED: "bg-red-500/20 text-red-400",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const fetchCustomer = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("Customer not found");
      const data = await res.json();
      setCustomer(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Customer not found</p>
        <Link href="/admin/customers" className="text-[#00D4FF] hover:underline">
          Back to customers
        </Link>
      </div>
    );
  }

  const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = customer.orders.length > 0 ? totalSpent / customer.orders.length : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0A1628] text-xl font-bold">
              {customer.firstName?.[0] || customer.email[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                {customer.firstName} {customer.lastName}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
              </h1>
              <p className="text-muted-foreground">{customer.email}</p>
            </div>
          </div>
        </div>

        <Link
          href={`/admin/users/${customer.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
        >
          <Edit className="h-4 w-4" />
          Edit User
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-[#00D4FF]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customer._count.orders}</p>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(totalSpent)}</p>
              <p className="text-sm text-muted-foreground">Total Spent</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatPrice(avgOrderValue)}</p>
              <p className="text-sm text-muted-foreground">Avg. Order</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{customer._count.reviews}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-[#00D4FF]" />
                Recent Orders
              </h2>
              <Link
                href={`/admin/orders?customer=${customer.id}`}
                className="text-sm text-[#00D4FF] hover:underline"
              >
                View All
              </Link>
            </div>
            {customer.orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {customer.orders.slice(0, 5).map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div>
                      <p className="font-mono font-medium text-[#00D4FF]">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(order.total)}</p>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 text-[#00D4FF]" />
                Reviews
              </h2>
            </div>
            {customer.reviews.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No reviews yet
              </div>
            ) : (
              <div className="divide-y divide-border">
                {customer.reviews.map((review) => (
                  <div key={review.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{review.product.name}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{review.comment}</p>
                    <p className="text-xs text-muted-foreground mt-2">{formatDate(review.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Joined {formatDate(customer.createdAt)}</span>
              </div>
              {customer.lastLoginAt && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Last login {formatDate(customer.lastLoginAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#00D4FF]" />
              Addresses
            </h3>
            {customer.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No addresses saved</p>
            ) : (
              <div className="space-y-3">
                {customer.addresses.map((address) => (
                  <div
                    key={address.id}
                    className="p-3 bg-secondary/30 rounded-lg text-sm space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {address.firstName} {address.lastName}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                        {address.type}
                      </span>
                    </div>
                    <p className="text-muted-foreground">{address.addressLine1}</p>
                    <p className="text-muted-foreground">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    {address.isDefault && (
                      <span className="text-xs text-[#00D4FF]">Default</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
