"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, Plus, GripVertical, ChevronDown, ChevronRight, X } from "lucide-react";

interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  type: string;
  target: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  children?: MenuItem[];
}

interface Menu {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  items: MenuItem[];
}

export default function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [menu, setMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    location: "",
  });
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    title: "",
    url: "",
    type: "CUSTOM",
    target: "_self",
  });

  useEffect(() => {
    fetchMenu();
  }, [id]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/admin/menus/${id}`);
      if (!res.ok) throw new Error("Menu not found");
      const data = await res.json();
      setMenu(data);
      setFormData({
        name: data.name,
        slug: data.slug,
        location: data.location || "",
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
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to update menu");

      router.refresh();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this menu and all its items?")) return;

    try {
      const res = await fetch(`/api/admin/menus/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete menu");

      router.push("/admin/menus");
      router.refresh();
    } catch (error) {
      alert("Failed to delete menu");
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title) return;

    try {
      const res = await fetch(`/api/admin/menus/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newItem,
          sortOrder: menu?.items.length || 0,
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      const item = await res.json();
      setMenu(prev => prev ? { ...prev, items: [...prev.items, item] } : null);
      setNewItem({ title: "", url: "", type: "CUSTOM", target: "_self" });
      setShowAddItem(false);
    } catch (error) {
      alert("Failed to add menu item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Delete this menu item?")) return;

    try {
      const res = await fetch(`/api/admin/menus/${id}/items/${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete item");

      setMenu(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      } : null);
    } catch (error) {
      alert("Failed to delete menu item");
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4FF]" />
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Menu not found</p>
        <Link href="/admin/menus" className="text-[#00D4FF] hover:underline">
          Back to menus
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/menus"
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Edit Menu</h1>
          <p className="text-muted-foreground">{menu.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Menu Settings */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold">Menu Settings</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Slug <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="">Select location...</option>
                <option value="header">Header</option>
                <option value="footer">Footer</option>
                <option value="mobile">Mobile</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </form>
        </div>

        {/* Menu Items */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold">Menu Items</h2>
            <button
              onClick={() => setShowAddItem(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          </div>

          {/* Add Item Form */}
          {showAddItem && (
            <div className="p-4 border-b border-border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">New Menu Item</h3>
                <button onClick={() => setShowAddItem(false)} className="p-1 hover:bg-secondary rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="Title"
                  className="h-9 px-3 bg-background border border-border rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={newItem.url}
                  onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                  placeholder="URL"
                  className="h-9 px-3 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={newItem.type}
                  onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                  className="h-9 px-3 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="CUSTOM">Custom</option>
                  <option value="PAGE">Page</option>
                  <option value="CATEGORY">Category</option>
                  <option value="PRODUCT">Product</option>
                </select>
                <select
                  value={newItem.target}
                  onChange={(e) => setNewItem({ ...newItem, target: e.target.value })}
                  className="h-9 px-3 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="_self">Same Window</option>
                  <option value="_blank">New Window</option>
                </select>
                <button
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-[#00D4FF] text-[#0A1628] text-sm font-medium rounded-lg hover:bg-[#00D4FF]/90"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="divide-y divide-border">
            {menu.items.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                No menu items yet
              </div>
            ) : (
              menu.items.map((item) => (
                <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-secondary/30 group">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    {item.url && (
                      <p className="text-xs text-muted-foreground">{item.url}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-secondary rounded">{item.type}</span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 rounded hover:bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
