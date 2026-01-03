"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, MoreHorizontal, Tag, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: string;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  ordersCount: number;
  createdAt: string;
}

const emptyCoupon = {
  code: "",
  description: "",
  type: "PERCENTAGE",
  value: 10,
  minOrderValue: null as number | null,
  maxDiscount: null as number | null,
  usageLimit: null as number | null,
  perUserLimit: null as number | null,
  isActive: true,
  startsAt: "",
  expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCoupon);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openNewDialog = () => {
    setEditingId(null);
    setForm(emptyCoupon);
    setDialogOpen(true);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || "",
      type: coupon.type,
      value: coupon.value,
      minOrderValue: coupon.minOrderValue,
      maxDiscount: coupon.maxDiscount,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      isActive: coupon.isActive,
      startsAt: coupon.startsAt ? coupon.startsAt.split("T")[0] : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url = editingId
        ? `${API_URL}/api/admin/coupons/${editingId}`
        : `${API_URL}/api/admin/coupons`;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          startsAt: form.startsAt || null,
          expiresAt: form.expiresAt || null,
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save coupon");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchCoupons();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete coupon");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete coupon");
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isExpired = (coupon: Coupon) =>
    coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  const isUsedUp = (coupon: Coupon) =>
    coupon.usageLimit && coupon.usageCount >= coupon.usageLimit;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-muted-foreground">Manage discount coupons</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr className="text-left text-sm text-muted-foreground">
                <th className="p-4">Code</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Usage</th>
                <th className="p-4">Valid Period</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No coupons found
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-border hover:bg-secondary/50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <span className="font-mono font-medium">{coupon.code}</span>
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {coupon.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium">
                        {coupon.type === "PERCENTAGE"
                          ? `${coupon.value}%`
                          : formatPrice(coupon.value)}
                      </p>
                      {coupon.minOrderValue && (
                        <p className="text-xs text-muted-foreground">
                          Min: {formatPrice(coupon.minOrderValue)}
                        </p>
                      )}
                      {coupon.maxDiscount && (
                        <p className="text-xs text-muted-foreground">
                          Max: {formatPrice(coupon.maxDiscount)}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <p>
                        {coupon.usageCount}
                        {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {coupon.ordersCount} orders
                      </p>
                    </td>
                    <td className="p-4 text-sm">
                      {coupon.startsAt && (
                        <p>From: {formatDate(coupon.startsAt)}</p>
                      )}
                      {coupon.expiresAt && (
                        <p>Until: {formatDate(coupon.expiresAt)}</p>
                      )}
                      {!coupon.startsAt && !coupon.expiresAt && (
                        <p className="text-muted-foreground">No date limit</p>
                      )}
                    </td>
                    <td className="p-4">
                      {isExpired(coupon) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isUsedUp(coupon) ? (
                        <Badge variant="secondary">Used Up</Badge>
                      ) : coupon.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(coupon)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(coupon.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="SUMMER2024"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Summer sale discount"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(value) => setForm({ ...form, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="value">
                  {form.type === "PERCENTAGE" ? "Percentage" : "Amount"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={form.value}
                  onChange={(e) =>
                    setForm({ ...form, value: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrderValue">Min Order Value</Label>
                <Input
                  id="minOrderValue"
                  type="number"
                  value={form.minOrderValue || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      minOrderValue: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="maxDiscount">Max Discount</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={form.maxDiscount || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxDiscount: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  value={form.usageLimit || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      usageLimit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <Label htmlFor="perUserLimit">Per User Limit</Label>
                <Input
                  id="perUserLimit"
                  type="number"
                  value={form.perUserLimit || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      perUserLimit: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={form.isActive}
                onCheckedChange={(checked) => setForm({ ...form, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.code}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
