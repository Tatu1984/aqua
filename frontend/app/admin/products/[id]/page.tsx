"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Category {
  id: string;
  name: string;
}

interface ProductImage {
  url: string;
  alt?: string;
}

interface ProductData {
  id: string;
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  categoryId: string | null;
  status: string;
  stockQuantity: number;
  lowStockThreshold: number;
  stockStatus: string;
  trackInventory: boolean;
  allowBackorder: boolean;
  isLivestock: boolean;
  isFeatured: boolean;
  weight: number | null;
  seoTitle: string;
  seoDescription: string;
  images: ProductImage[];
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [productRes, categoriesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/products/${id}`, { credentials: "include" }),
          fetch(`${API_URL}/api/admin/categories`, { credentials: "include" }),
        ]);

        if (productRes.ok) {
          const { product: p } = await productRes.json();
          setProduct({
            id: p.id,
            name: p.name,
            sku: p.sku,
            description: p.description || "",
            shortDescription: p.shortDescription || "",
            price: p.price,
            compareAtPrice: p.compareAtPrice,
            costPrice: p.costPrice,
            categoryId: p.categoryId,
            status: p.status,
            stockQuantity: p.stockQuantity,
            lowStockThreshold: p.lowStockThreshold,
            stockStatus: p.stockStatus,
            trackInventory: p.trackInventory,
            allowBackorder: p.allowBackorder,
            isLivestock: p.isLivestock,
            isFeatured: p.isFeatured,
            weight: p.weight,
            seoTitle: p.seoTitle || "",
            seoDescription: p.seoDescription || "",
            images: p.images || [],
          });
        }

        if (categoriesRes.ok) {
          const { categories: cats } = await categoriesRes.json();
          setCategories(cats);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSave = async () => {
    if (!product) return;
    setSaving(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(product),
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to save product");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const res = await fetch(`${API_URL}/api/admin/products/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const addImage = () => {
    if (!imageUrl.trim() || !product) return;
    setProduct({
      ...product,
      images: [...product.images, { url: imageUrl.trim() }],
    });
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    if (!product) return;
    setProduct({
      ...product,
      images: product.images.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Product not found</p>
        <Button asChild className="mt-4">
          <Link href="/admin/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/products">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  product and all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Delete"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={product.name}
                  onChange={(e) =>
                    setProduct({ ...product, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={product.sku}
                  onChange={(e) =>
                    setProduct({ ...product, sku: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="shortDescription">Short Description</Label>
                <Textarea
                  id="shortDescription"
                  value={product.shortDescription}
                  onChange={(e) =>
                    setProduct({ ...product, shortDescription: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  value={product.description}
                  onChange={(e) =>
                    setProduct({ ...product, description: e.target.value })
                  }
                  rows={5}
                />
              </div>
            </div>
          </Card>

          {/* Pricing */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Pricing</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={product.price}
                  onChange={(e) =>
                    setProduct({ ...product, price: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="compareAtPrice">Compare at Price</Label>
                <Input
                  id="compareAtPrice"
                  type="number"
                  value={product.compareAtPrice || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      compareAtPrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="costPrice">Cost Price</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={product.costPrice || ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      costPrice: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Inventory</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="trackInventory">Track Inventory</Label>
                <Switch
                  id="trackInventory"
                  checked={product.trackInventory}
                  onCheckedChange={(checked) =>
                    setProduct({ ...product, trackInventory: checked })
                  }
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input
                    id="stockQuantity"
                    type="number"
                    value={product.stockQuantity}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        stockQuantity: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
                  <Input
                    id="lowStockThreshold"
                    type="number"
                    value={product.lowStockThreshold}
                    onChange={(e) =>
                      setProduct({
                        ...product,
                        lowStockThreshold: parseInt(e.target.value) || 5,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="stockStatus">Stock Status</Label>
                  <Select
                    value={product.stockStatus}
                    onValueChange={(value) =>
                      setProduct({ ...product, stockStatus: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN_STOCK">In Stock</SelectItem>
                      <SelectItem value="LOW_STOCK">Low Stock</SelectItem>
                      <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allowBackorder">Allow Backorders</Label>
                <Switch
                  id="allowBackorder"
                  checked={product.allowBackorder}
                  onCheckedChange={(checked) =>
                    setProduct({ ...product, allowBackorder: checked })
                  }
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Images</h2>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
                <Button type="button" onClick={addImage}>
                  Add
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {product.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <img
                      src={img.url}
                      alt={img.alt || product.name}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* SEO */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">SEO</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={product.seoTitle}
                  onChange={(e) =>
                    setProduct({ ...product, seoTitle: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={product.seoDescription}
                  onChange={(e) =>
                    setProduct({ ...product, seoDescription: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Product Status</Label>
                <Select
                  value={product.status}
                  onValueChange={(value) =>
                    setProduct({ ...product, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={product.categoryId || "none"}
                  onValueChange={(value) =>
                    setProduct({
                      ...product,
                      categoryId: value === "none" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Category</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Options</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured Product</Label>
                <Switch
                  id="isFeatured"
                  checked={product.isFeatured}
                  onCheckedChange={(checked) =>
                    setProduct({ ...product, isFeatured: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isLivestock">Livestock Product</Label>
                <Switch
                  id="isLivestock"
                  checked={product.isLivestock}
                  onCheckedChange={(checked) =>
                    setProduct({ ...product, isLivestock: checked })
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Shipping</h2>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={product.weight || ""}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    weight: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
