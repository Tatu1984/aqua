"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, ChevronRight, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ProductCard } from "@/components/product";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image?: string;
    stockStatus: string;
    category?: string;
  };
}

export default function WishlistPage() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/account/wishlist");
      return;
    }

    if (user) {
      fetchWishlist();
    }
  }, [user, isLoading, router]);

  const fetchWishlist = async () => {
    try {
      const res = await fetch(`${API_URL}/api/wishlist`, {
        credentials: "include",
      });
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error("Failed to fetch wishlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId: string) => {
    try {
      await fetch(`${API_URL}/api/wishlist?productId=${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      setItems(items.filter((item) => item.productId !== productId));
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 w-32 bg-muted rounded mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/account" className="hover:text-primary">
            Account
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>Wishlist</span>
        </div>

        <h1 className="text-3xl font-bold mb-8">My Wishlist</h1>

        {items.length === 0 ? (
          <div className="text-center py-12 bg-card border border-border rounded-lg">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your wishlist is empty</p>
            <Link href="/" className="text-primary hover:underline">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="relative group">
                <ProductCard
                  product={{
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    price: item.product.price,
                    compareAtPrice: item.product.compareAtPrice,
                    image: item.product.image || "https://picsum.photos/400",
                    category: item.product.category,
                    stockStatus: item.product.stockStatus as "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK",
                    isLivestock: false,
                    isFeatured: false,
                  }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => removeFromWishlist(item.productId)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
