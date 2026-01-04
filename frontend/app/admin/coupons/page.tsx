"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Ticket, Copy } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderValue: number | null;
  usageLimit: number | null;
  expiresAt: string | null;
  isActive: boolean;
  _count: { usages: number };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function getTypeBadge(type: string) {
  const styles: Record<string, { bg: string; text: string }> = {
    PERCENTAGE: { bg: "bg-blue-500/20", text: "text-blue-400" },
    FIXED_CART: { bg: "bg-green-500/20", text: "text-green-400" },
    FIXED_PRODUCT: { bg: "bg-purple-500/20", text: "text-purple-400" },
    FREE_SHIPPING: { bg: "bg-orange-500/20", text: "text-orange-400" },
  };
  const style = styles[type] || { bg: "bg-gray-500/20", text: "text-gray-400" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.bg} ${style.text}`}>{type.replace("_", " ")}</span>;
}

function getCouponValue(coupon: { type: string; value: number }) {
  if (coupon.type === "PERCENTAGE") return `${coupon.value}%`;
  if (coupon.type === "FREE_SHIPPING") return "Free Shipping";
  return formatPrice(coupon.value);
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      setCoupons(data.coupons || data || []);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons ({coupons.length} coupons)</p>
        </div>
        <Link href="/admin/coupons/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
          <Plus className="h-4 w-4" />Add Coupon
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-secondary/50">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Value</th>
                <th className="p-4 font-medium">Uses</th>
                <th className="p-4 font-medium">Min. Order</th>
                <th className="p-4 font-medium">Expires</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {coupons.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground"><Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />No coupons found</td></tr>
              ) : (
                coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="p-4"><div className="flex items-center gap-2"><code className="px-2 py-1 bg-secondary rounded text-[#00D4FF] font-mono font-medium">{coupon.code}</code><button className="p-1 rounded hover:bg-secondary transition-colors" title="Copy code"><Copy className="h-3.5 w-3.5 text-muted-foreground" /></button></div></td>
                    <td className="p-4">{getTypeBadge(coupon.type)}</td>
                    <td className="p-4 font-medium">{getCouponValue(coupon)}</td>
                    <td className="p-4 text-sm">{coupon._count?.usages || 0}{coupon.usageLimit && ` / ${coupon.usageLimit}`}</td>
                    <td className="p-4 text-sm">{coupon.minOrderValue ? formatPrice(coupon.minOrderValue) : "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{formatDate(coupon.expiresAt)}</td>
                    <td className="p-4">{isExpired(coupon.expiresAt) ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-400">Expired</span> : coupon.isActive ? <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">Active</span> : <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-400">Inactive</span>}</td>
                    <td className="p-4"><div className="flex items-center gap-2"><Link href={`/admin/coupons/${coupon.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors"><Edit className="h-4 w-4" /></Link><button className="p-2 rounded-lg hover:bg-destructive/20 text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
