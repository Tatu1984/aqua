"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Edit, UserCheck, UserX, Users, Search } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  _count: { orders: number; reviews: number };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", { year: "numeric", month: "short", day: "numeric" }).format(new Date(date));
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = { ACTIVE: "bg-green-500/20 text-green-400", PENDING: "bg-yellow-500/20 text-yellow-400", SUSPENDED: "bg-red-500/20 text-red-400", REJECTED: "bg-gray-500/20 text-gray-400" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-500/20 text-gray-400"}`}>{status}</span>;
}

function getRoleBadge(role: string) {
  const styles: Record<string, string> = { ADMIN: "bg-purple-500/20 text-purple-400", MANAGER: "bg-blue-500/20 text-blue-400", STAFF: "bg-orange-500/20 text-orange-400", CUSTOMER: "bg-gray-500/20 text-gray-400" };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role] || "bg-gray-500/20 text-gray-400"}`}>{role}</span>;
}

function UsersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<{ status: string; _count: { id: number } }[]>([]);
  const [loading, setLoading] = useState(true);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const role = searchParams.get("role") || "";

  const statuses = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"];
  const roles = ["ADMIN", "MANAGER", "STAFF", "CUSTOMER"];

  useEffect(() => { fetchUsers(); }, [page, search, status, role]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (role) params.set("role", role);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setStats(data.stats || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchValue = formData.get("search") as string;
    const params = new URLSearchParams();
    if (searchValue) params.set("search", searchValue);
    if (status) params.set("status", status);
    if (role) params.set("role", role);
    router.push(`/admin/users?${params}`);
  };

  const pendingCount = stats.find(s => s.status === "PENDING")?._count.id || 0;
  const activeCount = stats.find(s => s.status === "ACTIVE")?._count.id || 0;
  const suspendedCount = stats.find(s => s.status === "SUSPENDED")?._count.id || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions ({total} users)</p>
        </div>
        <Link href="/admin/users/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors">
          <Plus className="h-4 w-4" />Add User
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#00D4FF]/20 flex items-center justify-center"><Users className="h-5 w-5 text-[#00D4FF]" /></div><div><p className="text-2xl font-bold">{total}</p><p className="text-sm text-muted-foreground">Total Users</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center"><UserCheck className="h-5 w-5 text-yellow-400" /></div><div><p className="text-2xl font-bold">{pendingCount}</p><p className="text-sm text-muted-foreground">Pending</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center"><UserCheck className="h-5 w-5 text-green-400" /></div><div><p className="text-2xl font-bold">{activeCount}</p><p className="text-sm text-muted-foreground">Active</p></div></div></div>
        <div className="bg-card border border-border rounded-lg p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center"><UserX className="h-5 w-5 text-red-400" /></div><div><p className="text-2xl font-bold">{suspendedCount}</p><p className="text-sm text-muted-foreground">Suspended</p></div></div></div>
      </div>

      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" name="search" defaultValue={search} placeholder="Search by name or email..." className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]" />
        </form>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users" className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${!status && !role ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}>All</Link>
          {statuses.map((s) => (<Link key={s} href={`/admin/users?status=${s}${search ? `&search=${search}` : ""}`} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${status === s ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}>{s}</Link>))}
          <span className="border-l border-border mx-2" />
          {roles.map((r) => (<Link key={r} href={`/admin/users?role=${r}${search ? `&search=${search}` : ""}`} className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${role === r ? "bg-[#00D4FF] text-[#0A1628] border-[#00D4FF]" : "border-border hover:bg-secondary"}`}>{r}</Link>))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (<div className="p-8 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF] mx-auto" /></div>) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50"><tr className="text-left text-sm text-muted-foreground"><th className="p-4 font-medium">User</th><th className="p-4 font-medium">Role</th><th className="p-4 font-medium">Status</th><th className="p-4 font-medium">Orders</th><th className="p-4 font-medium">Joined</th><th className="p-4 font-medium">Last Login</th><th className="p-4 font-medium w-24">Actions</th></tr></thead>
              <tbody className="divide-y divide-border">
                {users.length === 0 ? (<tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-50" />No users found</td></tr>) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[#00D4FF] flex items-center justify-center text-[#0A1628] font-medium">{user.firstName?.[0] || user.email[0].toUpperCase()}</div><div><p className="font-medium">{user.firstName} {user.lastName}</p><p className="text-sm text-muted-foreground">{user.email}</p></div></div></td>
                      <td className="p-4">{getRoleBadge(user.role)}</td>
                      <td className="p-4">{getStatusBadge(user.status)}</td>
                      <td className="p-4 text-sm">{user._count?.orders || 0}</td>
                      <td className="p-4 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                      <td className="p-4 text-sm text-muted-foreground">{user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}</td>
                      <td className="p-4"><Link href={`/admin/users/${user.id}`} className="p-2 rounded-lg hover:bg-secondary transition-colors inline-flex"><Edit className="h-4 w-4" /></Link></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (<div className="flex items-center justify-center gap-2 p-4 border-t border-border"><Link href={`/admin/users?page=${Math.max(1, page - 1)}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}${role ? `&role=${role}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === 1 ? "pointer-events-none opacity-50" : ""}`}>Previous</Link><span className="text-sm text-muted-foreground px-4">Page {page} of {totalPages}</span><Link href={`/admin/users?page=${Math.min(totalPages, page + 1)}${search ? `&search=${search}` : ""}${status ? `&status=${status}` : ""}${role ? `&role=${role}` : ""}`} className={`px-4 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition-colors ${page === totalPages ? "pointer-events-none opacity-50" : ""}`}>Next</Link></div>)}
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6 flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" /></div>}>
      <UsersContent />
    </Suspense>
  );
}
