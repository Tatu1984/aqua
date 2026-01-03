"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Minus,
  Plus,
  Heart,
  Share2,
  Truck,
  Shield,
  Thermometer,
  Droplets,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product";
import { ProductReviews } from "@/components/product/product-reviews";
import { useCart } from "@/hooks/use-cart";
import { getProduct, ProductDetail, ProductListItem } from "@/lib/api";

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const { addItem, isLoading: cartLoading } = useCart();

  useEffect(() => {
    async function fetchProduct() {
      try {
        const data = await getProduct(slug);
        setProduct(data.product);
        setRelatedProducts(data.relatedProducts);
        if (data.product.variants.length > 0) {
          setSelectedVariant(data.product.variants[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id, selectedVariant || undefined, quantity);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Button asChild>
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const currentVariant = product.variants.find((v) => v.id === selectedVariant);
  const price = currentVariant?.price || product.price;
  const compareAtPrice = currentVariant?.compareAtPrice || product.compareAtPrice;
  const stockStatus = currentVariant?.stockStatus || product.stockStatus;
  const stockQuantity = currentVariant?.stockQuantity || product.stockQuantity;

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        {product.category && (
          <>
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-primary"
            >
              {product.category.name}
            </Link>
            <ChevronRight className="h-4 w-4" />
          </>
        )}
        <span className="text-foreground truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-xl overflow-hidden bg-secondary">
            <Image
              src={product.images[selectedImage]?.url || "https://via.placeholder.com/800"}
              alt={product.images[selectedImage]?.alt || product.name}
              fill
              className="object-cover"
              priority
            />
            {discount > 0 && (
              <Badge variant="coral" className="absolute top-4 left-4">
                -{discount}%
              </Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === index
                      ? "border-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || ""}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">{product.name}</h1>

          {/* Rating */}
          {product.reviews.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.reviews.average)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.reviews.average} ({product.reviews.count} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-bold">{formatPrice(price)}</span>
            {compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="mb-6">
            <span
              className={`text-sm font-medium ${
                stockStatus === "IN_STOCK"
                  ? "text-green-500"
                  : stockStatus === "LOW_STOCK"
                  ? "text-yellow-500"
                  : "text-red-500"
              }`}
            >
              {stockStatus === "IN_STOCK"
                ? `In Stock (${stockQuantity} available)`
                : stockStatus === "LOW_STOCK"
                ? `Low Stock (${stockQuantity} left)`
                : "Out of Stock"}
            </span>
          </div>

          {/* Livestock Parameters */}
          {product.isLivestock && product.livestockData && (
            <Card className="p-4 mb-6">
              <h3 className="font-medium mb-3">Water Parameters</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Thermometer className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Temperature</p>
                    <p className="font-medium">
                      {product.livestockData.minTemp}-{product.livestockData.maxTemp}°C
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Droplets className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">pH Level</p>
                    <p className="font-medium">
                      {product.livestockData.minPh}-{product.livestockData.maxPh}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <Badge
                  variant={
                    product.livestockData.difficulty === "BEGINNER"
                      ? "success"
                      : product.livestockData.difficulty === "INTERMEDIATE"
                      ? "warning"
                      : "destructive"
                  }
                >
                  {product.livestockData.difficulty === "BEGINNER"
                    ? "Beginner Friendly"
                    : product.livestockData.difficulty === "INTERMEDIATE"
                    ? "Intermediate"
                    : "Advanced"}
                </Badge>
              </div>
            </Card>
          )}

          {/* Variants */}
          {product.variants.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Size/Variant</label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedVariant === variant.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stockQuantity, quantity + 1))}
                className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={stockStatus === "OUT_OF_STOCK" || cartLoading}
              loading={cartLoading}
            >
              Add to Cart
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Shipping Notice */}
          {product.expressOnly && (
            <Card className="p-4 mb-6 border-yellow-500/50">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium">Express Shipping Only</p>
                  <p className="text-sm text-muted-foreground">
                    This is a live product. Available in:{" "}
                    {product.allowedCities.join(", ")}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Trust badges */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-4 w-4" />
              <span>Quality Assured</span>
            </div>
            <div className="flex items-center gap-1">
              <Truck className="h-4 w-4" />
              <span>Fast Shipping</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Description */}
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description || product.shortDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <ProductReviews
        productId={product.id}
        productName={product.name}
        averageRating={product.reviews.average}
        totalReviews={product.reviews.count}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={{
                  id: p.id,
                  name: p.name,
                  slug: p.slug,
                  price: p.price,
                  compareAtPrice: p.compareAtPrice,
                  image: p.image || "https://via.placeholder.com/400",
                  stockStatus: p.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
