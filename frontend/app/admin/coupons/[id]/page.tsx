"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Ticket } from "lucide-react";

export default function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    type: "PERCENTAGE",
    value: "",
    usageLimit: "",
    usageLimitPerUser: "",
    minOrderValue: "",
    maxOrderValue: "",
    maxDiscount: "",
    individualUseOnly: false,
    excludeSaleItems: false,
    isActive: true,
    startsAt: "",
    expiresAt: "",
  });

  useEffect(() => {
    fetchCoupon();
  }, [id]);

  function formatDateForInput(date: string | null) {
    if (!date) return "";
    return new Date(date).toISOString().slice(0, 16);
  }

  async function fetchCoupon() {
    try {
      const res = await fetch(`/api/admin/coupons/${id}`);
      if (!res.ok) {
        router.push("/admin/coupons");
        return;
      }
      const data = await res.json();
      const c = data.coupon;
      setFormData({
        code: c.code || "",
        description: c.description || "",
        type: c.type || "PERCENTAGE",
        value: c.value?.toString() || "",
        usageLimit: c.usageLimit?.toString() || "",
        usageLimitPerUser: c.usageLimitPerUser?.toString() || "",
        minOrderValue: c.minOrderValue?.toString() || "",
        maxOrderValue: c.maxOrderValue?.toString() || "",
        maxDiscount: c.maxDiscount?.toString() || "",
        individualUseOnly: c.individualUseOnly || false,
        excludeSaleItems: c.excludeSaleItems || false,
        isActive: c.isActive ?? true,
        startsAt: formatDateForInput(c.startsAt),
        expiresAt: formatDateForInput(c.expiresAt),
      });
    } catch (error) {
      console.error("Failed to fetch coupon:", error);
      router.push("/admin/coupons");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          value: parseFloat(formData.value) || 0,
          usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
          usageLimitPerUser: formData.usageLimitPerUser ? parseInt(formData.usageLimitPerUser) : null,
          minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
          maxOrderValue: formData.maxOrderValue ? parseFloat(formData.maxOrderValue) : null,
          maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
          startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        }),
      });

      if (res.ok) {
        alert("Coupon updated successfully!");
        fetchCoupon();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update coupon");
      }
    } catch (error) {
      console.error("Failed to update coupon:", error);
      alert("Failed to update coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/coupons");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      alert("Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/coupons"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Coupon</h1>
            <p className="text-muted-foreground font-mono">{formData.code}</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive font-medium rounded-lg hover:bg-destructive/30 transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Coupon Information
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">Coupon Code *</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="SUMMER2024"
              required
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF] font-mono uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Coupon description (internal use)"
              rows={2}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Discount Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="PERCENTAGE">Percentage Discount</option>
                <option value="FIXED_CART">Fixed Cart Discount</option>
                <option value="FIXED_PRODUCT">Fixed Product Discount</option>
                <option value="FREE_SHIPPING">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                {formData.type === "PERCENTAGE" ? "Percentage *" : formData.type === "FREE_SHIPPING" ? "Value (optional)" : "Amount *"}
              </label>
              <input
                type="number"
                step={formData.type === "PERCENTAGE" ? "1" : "0.01"}
                value={formData.value}
                onChange={(e) => setFormData((prev) => ({ ...prev, value: e.target.value }))}
                placeholder={formData.type === "PERCENTAGE" ? "10" : "100"}
                required={formData.type !== "FREE_SHIPPING"}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
          </div>
        </div>

        {/* Usage Limits */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Usage Limits</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Usage Limit</label>
              <input
                type="number"
                value={formData.usageLimit}
                onChange={(e) => setFormData((prev) => ({ ...prev, usageLimit: e.target.value }))}
                placeholder="Unlimited"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Usage Limit Per User</label>
              <input
                type="number"
                value={formData.usageLimitPerUser}
                onChange={(e) => setFormData((prev) => ({ ...prev, usageLimitPerUser: e.target.value }))}
                placeholder="Unlimited"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
            </div>
          </div>
        </div>

        {/* Cart Requirements */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Cart Requirements</h2>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Min Order Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.minOrderValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, minOrderValue: e.target.value }))}
                placeholder="No minimum"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Order Value</label>
              <input
                type="number"
                step="0.01"
                value={formData.maxOrderValue}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxOrderValue: e.target.value }))}
                placeholder="No maximum"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Discount</label>
              <input
                type="number"
                step="0.01"
                value={formData.maxDiscount}
                onChange={(e) => setFormData((prev) => ({ ...prev, maxDiscount: e.target.value }))}
                placeholder="No cap"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
              <p className="text-xs text-muted-foreground mt-1">Cap the discount amount</p>
            </div>
          </div>
        </div>

        {/* Validity */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Validity Period</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, startsAt: e.target.value }))}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Expiry Date</label>
              <input
                type="datetime-local"
                value={formData.expiresAt}
                onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">Options</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="individualUseOnly"
                checked={formData.individualUseOnly}
                onChange={(e) => setFormData((prev) => ({ ...prev, individualUseOnly: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="individualUseOnly" className="text-sm font-medium">
                Individual use only (cannot combine with other coupons)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="excludeSaleItems"
                checked={formData.excludeSaleItems}
                onChange={(e) => setFormData((prev) => ({ ...prev, excludeSaleItems: e.target.checked }))}
                className="w-4 h-4 rounded border-border"
              />
              <label htmlFor="excludeSaleItems" className="text-sm font-medium">
                Exclude sale items
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
