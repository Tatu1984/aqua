"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Users, Eye, Mail } from "lucide-react";

interface Customer {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  orders: { id: string; total: number }[];
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(price);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function CustomersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      params.set("role", "CUSTOMER");
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setCustomers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    router.push(`/admin/customers${searchValue ? `?search=${searchValue}` : ""}`);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">Manage your customers ({total} customers)</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <form onSubmit={handleSearch} className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" name="search" defaultValue={search} placeholder="Search by name or email..." className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]" />
        </form>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr className="text-left text-sm text-muted-foreground">
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Orders</th>
                  <th className="p-4 font-medium">Total Spent</th>
                  <th className="p-4 font-medium">Joined</th>
                  <th className="p-4 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customers.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" />No customers found</td></tr>
                ) : (
                  customers.map((customer) => {
                    const totalSpent = customer.orders?.reduce((sum, order) => sum + order.total, 0) || 0;
                    return (
                      <tr key={customer.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0A1628] font-medium">{customer.firstName?.[0] || customer.email[0].toUpperCase()}</div>
                            <p className="font-medium">{customer.firstName} {customer.lastName}</p>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{customer.email}</td>
                        <td className="p-4 text-sm">{customer.orders?.length || 0}</td>
                        <td className="p-4 font-medium">{formatPrice(totalSpent)}</td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(customer.createdAt)}</td>
                        <td className="p-4"><Link href={`/admin/customers/${customer.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors inline-flex"><Eye className="h-4 w-4" /></Link></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Link href={`/admin/customers?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}>Previous</Link>
            <span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span>
            <Link href={`/admin/customers?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}>Next</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>}>
      <CustomersContent />
    </Suspense>
  );
}
