import Link from "next/link";
import { Users, Eye, Mail } from "lucide-react";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

async function getCustomers(page = 1, limit = 20, search = "") {
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
        role: "CUSTOMER" as const,
      }
    : { role: "CUSTOMER" as const };

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        orders: { select: { id: true, total: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { customers, total, totalPages: Math.ceil(total / limit) };
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const { customers, total, totalPages } = await getCustomers(page, 20, search);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customers ({total} customers)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-lg p-4">
        <form method="GET" className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by name or email..."
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
          />
        </form>
      </div>

      {/* Customers Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    No customers found
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const totalSpent = customer.orders.reduce((sum, order) => sum + order.total, 0);
                  return (
                    <tr key={customer.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0A1628] font-medium">
                            {customer.firstName?.[0] || customer.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">
                              {customer.firstName} {customer.lastName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{customer.email}</td>
                      <td className="p-4 text-sm">{customer.orders.length}</td>
                      <td className="p-4 font-medium">{formatPrice(totalSpent)}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(customer.createdAt)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/admin/customers/${customer.id}`}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors inline-flex"
                          title="View Customer"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
            <Link
              href={`/admin/customers?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ""}`}
              className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </Link>
            <span className="text-sm text-muted-foreground px-4">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`/admin/customers?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ""}`}
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
