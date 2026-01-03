"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Plus, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ProductForm {
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
  categoryId: string;
  isLivestock: boolean;
  isFeatured: boolean;
  minTemp: string;
  maxTemp: string;
  minPh: string;
  maxPh: string;
  difficulty: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductForm>({
    name: "",
    slug: "",
    sku: "",
    description: "",
    shortDescription: "",
    price: "",
    compareAtPrice: "",
    stockQuantity: "0",
    categoryId: "",
    isLivestock: false,
    isFeatured: false,
    minTemp: "",
    maxTemp: "",
    minPh: "",
    maxPh: "",
    difficulty: "BEGINNER",
  });

  const [variants, setVariants] = useState<
    { name: string; sku: string; price: string; stock: string }[]
  >([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));

    router.push("/admin/products");
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const addVariant = () => {
    setVariants([...variants, { name: "", sku: "", price: "", stock: "0" }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (
    index: number,
    field: keyof (typeof variants)[0],
    value: string
  ) => {
    setVariants(
      variants.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-secondary rounded-lg"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">New Product</h1>
          <p className="text-muted-foreground">Add a new product to your store</p>
        </div>
        <Button type="submit" disabled={saving} loading={saving}>
          Save Product
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Product Name
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                    setForm({
                      ...form,
                      name: e.target.value,
                      slug: generateSlug(e.target.value),
                    });
                  }}
                  placeholder="e.g. Neon Tetra (School of 10)"
                  required
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug</label>
                  <Input
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="neon-tetra-school-10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <Input
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="NT-10"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Short Description
                </label>
                <Input
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm({ ...form, shortDescription: e.target.value })
                  }
                  placeholder="Brief product description for listings"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Full Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Detailed product description..."
                  rows={5}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </div>
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Images</h2>
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop images here, or click to browse
              </p>
              <Button type="button" variant="outline" size="sm">
                Upload Images
              </Button>
            </div>
          </Card>

          {/* Variants */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Variants</h2>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            </div>

            {variants.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No variants added. Add variants for different sizes or options.
              </p>
            ) : (
              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-secondary/50 rounded-lg"
                  >
                    <div className="flex-1 grid sm:grid-cols-4 gap-3">
                      <Input
                        placeholder="Name"
                        value={variant.name}
                        onChange={(e) =>
                          updateVariant(index, "name", e.target.value)
                        }
                      />
                      <Input
                        placeholder="SKU"
                        value={variant.sku}
                        onChange={(e) =>
                          updateVariant(index, "sku", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={(e) =>
                          updateVariant(index, "price", e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={variant.stock}
                        onChange={(e) =>
                          updateVariant(index, "stock", e.target.value)
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="p-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Livestock Parameters */}
          {form.isLivestock && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Livestock Parameters</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Min Temperature (°C)
                  </label>
                  <Input
                    type="number"
                    value={form.minTemp}
                    onChange={(e) => setForm({ ...form, minTemp: e.target.value })}
                    placeholder="22"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Max Temperature (°C)
                  </label>
                  <Input
                    type="number"
                    value={form.maxTemp}
                    onChange={(e) => setForm({ ...form, maxTemp: e.target.value })}
                    placeholder="28"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Min pH</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.minPh}
                    onChange={(e) => setForm({ ...form, minPh: e.target.value })}
                    placeholder="6.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max pH</label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.maxPh}
                    onChange={(e) => setForm({ ...form, maxPh: e.target.value })}
                    placeholder="7.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={form.difficulty}
                    onChange={(e) =>
                      setForm({ ...form, difficulty: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="pl-7"
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Compare at Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    value={form.compareAtPrice}
                    onChange={(e) =>
                      setForm({ ...form, compareAtPrice: e.target.value })
                    }
                    className="pl-7"
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Original price for showing discounts
                </p>
              </div>
            </div>
          </Card>

          {/* Inventory */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Inventory</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                Stock Quantity
              </label>
              <Input
                type="number"
                value={form.stockQuantity}
                onChange={(e) =>
                  setForm({ ...form, stockQuantity: e.target.value })
                }
                placeholder="0"
              />
            </div>
          </Card>

          {/* Organization */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                >
                  <option value="">Select category</option>
                  <option value="freshwater-fish">Freshwater Fish</option>
                  <option value="plants">Aquatic Plants</option>
                  <option value="shrimp">Shrimp & Invertebrates</option>
                  <option value="equipment">Equipment</option>
                  <option value="food">Food & Nutrition</option>
                </select>
              </div>
              <Separator />
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isLivestock}
                    onChange={(e) =>
                      setForm({ ...form, isLivestock: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">This is a livestock product</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) =>
                      setForm({ ...form, isFeatured: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm">Featured product</span>
                </label>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </form>
  );
}
