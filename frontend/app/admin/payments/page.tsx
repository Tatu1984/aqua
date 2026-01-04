"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreditCard, ArrowUpRight, ArrowDownLeft, RefreshCw, Eye } from "lucide-react";

interface Payment {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string | null;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: { firstName: string | null; lastName: string | null; email: string } | null;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(date));
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = { PENDING: "bg-yellow-500/20 text-yellow-400", PAID: "bg-green-500/20 text-green-400", FAILED: "bg-red-500/20 text-red-400", REFUNDED: "bg-purple-500/20 text-purple-400" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>{status}</span>;
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalRefunds, setTotalRefunds] = useState(0);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const status = searchParams.get("status") || "";
  const statuses = ["PENDING", "PAID", "FAILED", "REFUNDED"];

  useEffect(() => { fetchPayments(); }, [page, status]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (status) params.set("status", status);

      const res = await fetch(`/api/admin/payments?${params}`);
      const data = await res.json();
      setPayments(data.payments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setTotalRevenue(data.totalRevenue || 0);
      setTotalRefunds(data.totalRefunds || 0);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-muted-foreground">View and manage payment transactions ({total} transactions)</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><ArrowDownLeft className="h-5 w-5 text-green-400" /></div><div><p className="text-2xl font-bold">{formatPrice(totalRevenue)}</p><p className="text-sm text-muted-foreground">Total Revenue</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><ArrowUpRight className="h-5 w-5 text-purple-400" /></div><div><p className="text-2xl font-bold">{formatPrice(totalRefunds)}</p><p className="text-sm text-muted-foreground">Total Refunds</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center"><CreditCard className="h-5 w-5 text-[#00D4FF]" /></div><div><p className="text-2xl font-bold">{formatPrice(totalRevenue - totalRefunds)}</p><p className="text-sm text-muted-foreground">Net Revenue</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"><RefreshCw className="h-5 w-5 text-yellow-400" /></div><div><p className="text-2xl font-bold">{total}</p><p className="text-sm text-muted-foreground">Transactions</p></div></div></div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/payments" className={`px-4 py-2 text-sm rounded-lg border transition-colors ${!status ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}>All</Link>
        {statuses.map((s) => (<Link key={s} href={`/admin/payments?status=${s}`} className={`px-4 py-2 text-sm rounded-lg border transition-colors ${status === s ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}>{s}</Link>))}
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (<div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto" /></div>) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50"><tr className="text-left text-sm text-muted-foreground"><th className="p-4 font-medium">Order</th><th className="p-4 font-medium">Customer</th><th className="p-4 font-medium">Amount</th><th className="p-4 font-medium">Method</th><th className="p-4 font-medium">Transaction ID</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Date</th><th className="p-4 font-medium w-20">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {payments.length === 0 ? (<tr><td colSpan={8} className="p-8 text-center text-muted-foreground"><CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />No payments found</td></tr>) : (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4"><Link href={`/admin/orders/${payment.id}`} className="font-mono font-medium text-[#00D4FF] hover:underline">#{payment.orderNumber}</Link></td>
                      <td className="p-4"><div><p className="font-medium">{payment.user ? `${payment.user.firstName} ${payment.user.lastName}` : "Guest"}</p><p className="text-sm text-muted-foreground">{payment.user?.email || "-"}</p></div></td>
                      <td className="p-4 font-medium">{formatPrice(payment.total)}</td>
                      <td className="p-4 text-sm">{payment.paymentMethod || "-"}</td>
                      <td className="p-4"><code className="text-xs bg-secondary px-2 py-1 rounded font-mono">{payment.razorpayPaymentId || "-"}</code></td>
                      <td className="p-4">{getStatusBadge(payment.paymentStatus)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(payment.createdAt)}</td>
                      <td className="p-4"><Link href={`/admin/orders/${payment.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors inline-flex" title="View Order"><Eye className="h-4 w-4" /></Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (<div className="flex items-center justify-center gap-2 p-4 border-t border-border"><Link href={`/admin/payments?page=${Math.max(1, page - 1)}${status ? `&status=${status}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}>Previous</Link><span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span><Link href={`/admin/payments?page=${Math.min(totalPages, page + 1)}${status ? `&status=${status}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}>Next</Link></div>)}
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>}>
      <PaymentsContent />
    </Suspense>
  );
}
