"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, UserCheck, UserX, Ban, Eye, EyeOff, ShieldCheck, ShieldX } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  status: string;
  emailVerified: boolean;
  isActive: boolean;
  notes: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    orders: number;
    reviews: number;
  };
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    role: "CUSTOMER",
    status: "ACTIVE",
    emailVerified: false,
    notes: "",
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) throw new Error("User not found");
      const data = await res.json();
      setUser(data);
      setFormData({
        email: data.email,
        password: "",
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        phone: data.phone || "",
        role: data.role,
        status: data.status,
        emailVerified: data.emailVerified,
        notes: data.notes || "",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload: any = { ...formData };
      if (!payload.password) delete payload.password;

      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update user");
      }

      router.push("/admin/users");
      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to ${newStatus.toLowerCase()} this user?`)) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setFormData(prev => ({ ...prev, status: newStatus }));
      router.refresh();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete user");

      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      alert("Failed to delete user");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">User not found</p>
        <Link href="/admin/users" className="text-[#00D4FF] hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/users"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit User</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {formData.status === "PENDING" && (
            <>
              <button
                onClick={() => handleStatusChange("ACTIVE")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 font-medium rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleStatusChange("REJECTED")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 font-medium rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <UserX className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
          {formData.status === "ACTIVE" && (
            <button
              onClick={() => handleStatusChange("SUSPENDED")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 text-orange-400 font-medium rounded-lg hover:bg-orange-500/30 transition-colors"
            >
              <Ban className="h-4 w-4" />
              Suspend
            </button>
          )}
          {formData.status === "SUSPENDED" && (
            <button
              onClick={() => handleStatusChange("ACTIVE")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 font-medium rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <UserCheck className="h-4 w-4" />
              Reactivate
            </button>
          )}
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{user._count.orders}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Reviews</p>
          <p className="text-2xl font-bold">{user._count.reviews}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Joined</p>
          <p className="text-lg font-medium">
            {new Date(user.createdAt).toLocaleDateString("en-IN", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Last Login</p>
          <p className="text-lg font-medium">
            {user.lastLoginAt
              ? new Date(user.lastLoginAt).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "Never"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {/* Account Information */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Account Information</h2>

          <div>
            <label className="block text-sm font-medium mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              New Password <span className="text-xs text-muted-foreground">(leave blank to keep current)</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full h-10 px-3 pr-10 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>
        </div>

        {/* Role & Status */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Role & Status</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="CUSTOMER">Customer</option>
                <option value="STAFF">Staff</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.emailVerified}
              onChange={(e) => setFormData({ ...formData, emailVerified: e.target.checked })}
              className="w-4 h-4 rounded border-border text-[#00D4FF] focus:ring-[#00D4FF]"
            />
            <span className="text-sm flex items-center gap-2">
              {formData.emailVerified ? (
                <ShieldCheck className="h-4 w-4 text-green-400" />
              ) : (
                <ShieldX className="h-4 w-4 text-muted-foreground" />
              )}
              Email verified
            </span>
          </label>
        </div>

        {/* Admin Notes */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Admin Notes</h2>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Internal notes about this user..."
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/admin/users"
              className="px-6 py-2 border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </Link>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Delete User
          </button>
        </div>
      </form>
    </div>
  );
}
