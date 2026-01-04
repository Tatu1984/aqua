"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Save, Package, Upload, X, ImageIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    shortDescription: "",
    type: "SIMPLE",
    status: "DRAFT",
    visibility: "VISIBLE",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    costPrice: "",
    stockQuantity: "0",
    lowStockThreshold: "5",
    stockStatus: "IN_STOCK",
    weight: "",
    length: "",
    width: "",
    height: "",
    isFeatured: false,
    isLivestock: false,
    requiresShipping: true,
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  function generateSKU(name: string) {
    const prefix = name.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${random}`;
  }

  function handleNameChange(name: string) {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
      sku: prev.sku || generateSKU(name),
    }));
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setImages((prev) => [...prev, data.url]);
        } else {
          const error = await res.json();
          alert(error.error || "Failed to upload image");
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price) || 0,
          compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : null,
          costPrice: formData.costPrice ? parseFloat(formData.costPrice) : null,
          stockQuantity: parseInt(formData.stockQuantity) || 0,
          lowStockThreshold: parseInt(formData.lowStockThreshold) || 5,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          length: formData.length ? parseFloat(formData.length) : null,
          width: formData.width ? parseFloat(formData.width) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          categoryId: formData.categoryId || null,
          images: images,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/admin/products/${data.product.id}`);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Failed to create product:", error);
      alert("Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Add Product</h1>
          <p className="text-muted-foreground">Create a new product</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Package className="h-5 w-5" />
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter product name"
                  required
                  className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Slug</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="product-slug"
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">SKU *</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    placeholder="PRO-XXXX"
                    required
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Short Description</label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => setFormData((prev) => ({ ...prev, shortDescription: e.target.value }))}
                  placeholder="Brief product description"
                  rows={2}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Full product description"
                  rows={5}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Pricing</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Compare at Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, compareAtPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
                    placeholder="0.00"
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Inventory</h2>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Quantity</label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                    placeholder="0"
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                    placeholder="5"
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stock Status</label>
                  <select
                    value={formData.stockStatus}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stockStatus: e.target.value }))}
                    className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                  >
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                    <option value="ON_BACKORDER">On Backorder</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Shipping</h2>

              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="requiresShipping"
                  checked={formData.requiresShipping}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requiresShipping: e.target.checked }))}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="requiresShipping" className="text-sm font-medium">
                  This product requires shipping
                </label>
              </div>

              {formData.requiresShipping && (
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight}
                      onChange={(e) => setFormData((prev) => ({ ...prev, weight: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Length (cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.length}
                      onChange={(e) => setFormData((prev) => ({ ...prev, length: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Width (cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.width}
                      onChange={(e) => setFormData((prev) => ({ ...prev, width: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Height (cm)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.height}
                      onChange={(e) => setFormData((prev) => ({ ...prev, height: e.target.value }))}
                      placeholder="0.00"
                      className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                    />
                  </div>
                </div>
              )}
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
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Images */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Product Images
              </h2>

              {/* Image Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                      <Image src={url} alt={`Product ${index + 1}`} fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg hover:border-[#00D4FF] hover:bg-secondary/50 transition-colors disabled:opacity-50"
                >
                  <Upload className="h-5 w-5" />
                  {uploading ? "Uploading..." : "Upload Images"}
                </button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  JPEG, PNG, WebP or GIF. Max 5MB.
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Status</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Product Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData((prev) => ({ ...prev, visibility: e.target.value }))}
                  className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
                >
                  <option value="VISIBLE">Visible</option>
                  <option value="CATALOG">Catalog Only</option>
                  <option value="SEARCH">Search Only</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Category</h2>

              <select
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Type */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Product Type</h2>

              <select
                value={formData.type}
                onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full h-10 px-4 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4FF]"
              >
                <option value="SIMPLE">Simple Product</option>
                <option value="VARIABLE">Variable Product</option>
                <option value="GROUPED">Grouped Product</option>
                <option value="VIRTUAL">Virtual Product</option>
                <option value="DOWNLOADABLE">Downloadable Product</option>
              </select>
            </div>

            {/* Options */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-lg font-semibold">Options</h2>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isFeatured" className="text-sm font-medium">
                    Featured Product
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isLivestock"
                    checked={formData.isLivestock}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isLivestock: e.target.checked }))}
                    className="w-4 h-4 rounded border-border"
                  />
                  <label htmlFor="isLivestock" className="text-sm font-medium">
                    Livestock Product
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-card border border-border rounded-lg p-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00D4FF] text-[#0A1628] font-medium rounded-lg hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {loading ? "Creating..." : "Create Product"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
