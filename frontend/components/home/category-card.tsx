"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    image?: string;
    productCount?: number;
    description?: string;
  };
  variant?: "default" | "large" | "minimal";
  index?: number;
}

export function CategoryCard({ category, variant = "default", index = 0 }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Link href={`/category/${category.slug}`} className="group block">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl",
            variant === "large" ? "aspect-[4/3]" : "aspect-square",
            variant === "minimal" && "aspect-[3/2]"
          )}
        >
          {/* Background Image */}
          <Image
            src={category.image || "https://via.placeholder.com/400"}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />

          {/* Gradient Overlay */}
          <div
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              "bg-gradient-to-t from-ocean-dark/90 via-ocean-dark/40 to-transparent",
              "group-hover:from-ocean-dark/95 group-hover:via-ocean-dark/50"
            )}
          />

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <h3
              className={cn(
                "font-bold text-white",
                variant === "large" ? "text-2xl" : "text-lg",
                variant === "minimal" && "text-base"
              )}
            >
              {category.name}
            </h3>

            {category.description && variant === "large" && (
              <p className="text-white/70 text-sm mt-1 line-clamp-2">
                {category.description}
              </p>
            )}

            {category.productCount !== undefined && (
              <p className="text-white/60 text-sm mt-1">
                {category.productCount} products
              </p>
            )}

            {/* Arrow indicator */}
            <motion.div
              className="mt-2 flex items-center text-primary text-sm font-medium"
              initial={{ x: 0 }}
              whileHover={{ x: 5 }}
            >
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                Explore
              </span>
              <ArrowRight className="h-4 w-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
            </motion.div>
          </div>

          {/* Hover border effect */}
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-primary/50 transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
}
