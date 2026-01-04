"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Trash2, FolderTree } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  image: string | null;
  bannerImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parentId: "",
    image: "",
    bannerImage: "",
    seoTitle: "",
    seoDescription: "",
    sortOrder: "0",
    isVisible: true,
  });

  useEffect(() => {
    fetchCategory();
    fetchCategories();
  }, [id]);

  async function fetchCategory() {
    try {
      const res = await fetch(`/api/admin/categories/${id}`);
      if (!res.ok) {
        router.push("/admin/categories");
        return;
      }
      const data = await res.json();
      const c = data.category;
      setFormData({
        name: c.name || "",
        slug: c.slug || "",
        description: c.description || "",
        parentId: c.parentId || "",
        image: c.image || "",
        bannerImage: c.bannerImage || "",
        seoTitle: c.seoTitle || "",
        seoDescription: c.seoDescription || "",
        sortOrder: c.sortOrder?.toString() || "0",
        isVisible: c.isVisible ?? true,
      });
    } catch (error) {
      console.error("Failed to fetch category:", error);
      router.push("/admin/categories");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      // Filter out the current category to prevent self-reference
      setCategories((data.categories || []).filter((c: Category) => c.id !== id));
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId || null,
          sortOrder: parseInt(formData.sortOrder) || 0,
        }),
      });

      if (res.ok) {
        alert("Category updated successfully!");
        fetchCategory();
      } else {
        const error = await res.json();
        alert(error.error || "Failed to update category");
      }
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Failed to update category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this category? This action cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/categories");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete category");
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      alert("Failed to delete category");
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
            href="/admin/categories"
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Category</h1>
            <p className="text-muted-foreground">{formData.name}</p>
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
            <FolderTree className="h-5 w-5" />
            Category Information
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">Category Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter category name"
              required
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
              placeholder="category-slug"
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Parent Category</label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData((prev) => ({ ...prev, parentId: e.target.value }))}
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            >
              <option value="">No Parent (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Category description"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData((prev) => ({ ...prev, image: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Banner Image URL</label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => setFormData((prev) => ({ ...prev, bannerImage: e.target.value }))}
                placeholder="https://example.com/banner.jpg"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort Order</label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                placeholder="0"
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isVisible"
                  checked={formData.isVisible}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isVisible: e.target.checked }))}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="isVisible" className="text-sm font-medium">
                  Visible
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">SEO</h2>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Title</label>
            <input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoTitle: e.target.value }))}
              placeholder="SEO optimized title"
              className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">SEO Description</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => setFormData((prev) => ({ ...prev, seoDescription: e.target.value }))}
              placeholder="SEO meta description"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
            />
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
