"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Eye, Thermometer, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image: string;
    category?: string;
    stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
    isLivestock?: boolean;
    livestockData?: {
      minTemp: number;
      maxTemp: number;
      minPh: number;
      maxPh: number;
      difficulty: string;
    };
    isFeatured?: boolean;
    isNew?: boolean;
  };
  variant?: "default" | "compact" | "horizontal";
}

export function ProductCard({ product, variant = "default" }: ProductCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const stockStatusConfig = {
    IN_STOCK: { label: "In Stock", className: "stock-in" },
    LOW_STOCK: { label: "Low Stock", className: "stock-low" },
    OUT_OF_STOCK: { label: "Out of Stock", className: "stock-out" },
  };

  if (variant === "horizontal") {
    return (
      <Card className="flex overflow-hidden group" hover>
        <div className="relative w-32 h-32 flex-shrink-0 product-image-zoom">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex-1 p-4">
          <Link href={`/product/${product.slug}`}>
            <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.category && (
            <p className="text-xs text-muted-foreground mt-1">{product.category}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold text-lg">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="price-original text-sm">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn("overflow-hidden group", variant === "compact" && "p-2")}
        hover
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary/50">
          <Link href={`/product/${product.slug}`}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={cn(
                "object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
            />
          </Link>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {discount > 0 && (
              <Badge variant="coral" className="text-xs">
                -{discount}%
              </Badge>
            )}
            {product.isNew && (
              <Badge variant="aqua" className="text-xs">
                New
              </Badge>
            )}
            {product.isFeatured && (
              <Badge variant="secondary" className="text-xs">
                Featured
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={cn(
              "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all",
              "bg-background/80 backdrop-blur-sm hover:bg-background",
              isWishlisted ? "text-accent" : "text-muted-foreground"
            )}
          >
            <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
          </button>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-2 left-2 right-2 flex gap-2"
          >
            <Button size="sm" className="flex-1 h-9" asChild>
              <Link href={`/product/${product.slug}`}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Link>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-9"
              disabled={product.stockStatus === "OUT_OF_STOCK"}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className={cn("p-4", variant === "compact" && "p-2")}>
          {/* Category */}
          {product.category && (
            <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          )}

          {/* Name */}
          <Link href={`/product/${product.slug}`}>
            <h3
              className={cn(
                "font-medium line-clamp-2 group-hover:text-primary transition-colors",
                variant === "compact" ? "text-sm" : "text-base"
              )}
            >
              {product.name}
            </h3>
          </Link>

          {/* Livestock Parameters */}
          {product.isLivestock && product.livestockData && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="param-badge">
                <Thermometer className="h-3 w-3" />
                {product.livestockData.minTemp}-{product.livestockData.maxTemp}°C
              </span>
              <span className="param-badge">
                <Droplets className="h-3 w-3" />
                pH {product.livestockData.minPh}-{product.livestockData.maxPh}
              </span>
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className={cn("font-bold", variant === "compact" ? "text-base" : "text-lg")}>
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && (
                <span className="price-original text-sm">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>
            <span
              className={cn(
                "text-xs font-medium",
                stockStatusConfig[product.stockStatus].className
              )}
            >
              {stockStatusConfig[product.stockStatus].label}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
