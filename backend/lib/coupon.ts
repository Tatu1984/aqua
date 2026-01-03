import { prisma } from "./db";

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  compareAtPrice?: number; // Sale price detection
  categoryId?: string;
}

interface CouponValidationResult {
  valid: boolean;
  error?: string;
  discount?: number;
  coupon?: any;
}

// Validate and calculate coupon discount
export async function validateCoupon(
  code: string,
  cartItems: CartItem[],
  cartTotal: number,
  userId?: string,
  email?: string
): Promise<CouponValidationResult> {
  try {
    // Find coupon
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        products: true,
        categories: true,
        usages: userId ? { where: { userId } } : undefined,
      },
    });

    if (!coupon) {
      return { valid: false, error: "Invalid coupon code" };
    }

    // Check if active
    if (!coupon.isActive) {
      return { valid: false, error: "Coupon is not active" };
    }

    // Check date validity
    const now = new Date();
    if (coupon.startsAt && now < coupon.startsAt) {
      return { valid: false, error: "Coupon is not yet active" };
    }
    if (coupon.expiresAt && now > coupon.expiresAt) {
      return { valid: false, error: "Coupon has expired" };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: "Coupon usage limit reached" };
    }

    // Check per-user limit
    if (userId && coupon.usageLimitPerUser) {
      const userUsageCount = coupon.usages?.length || 0;
      if (userUsageCount >= coupon.usageLimitPerUser) {
        return { valid: false, error: "You have reached the usage limit for this coupon" };
      }
    }

    // Check email restriction
    if (coupon.allowedEmails && email) {
      try {
        const allowedPatterns = JSON.parse(coupon.allowedEmails);
        const emailMatches = allowedPatterns.some((pattern: string) => {
          if (pattern.includes("*")) {
            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$", "i");
            return regex.test(email);
          }
          return email.toLowerCase() === pattern.toLowerCase();
        });
        if (!emailMatches) {
          return { valid: false, error: "Coupon is not valid for your email address" };
        }
      } catch {
        // Ignore invalid JSON
      }
    }

    // Check minimum order value
    if (coupon.minOrderValue && cartTotal < coupon.minOrderValue) {
      return {
        valid: false,
        error: `Minimum order value of ₹${coupon.minOrderValue} required`,
      };
    }

    // Check maximum order value
    if (coupon.maxOrderValue && cartTotal > coupon.maxOrderValue) {
      return {
        valid: false,
        error: `Maximum order value of ₹${coupon.maxOrderValue} exceeded`,
      };
    }

    // Filter applicable items based on restrictions
    let applicableItems = [...cartItems];
    let applicableTotal = cartTotal;

    // Product restrictions
    const includedProducts = coupon.products.filter((p) => p.type === "INCLUDE");
    const excludedProducts = coupon.products.filter((p) => p.type === "EXCLUDE");

    if (includedProducts.length > 0) {
      const includedIds = includedProducts.map((p) => p.productId);
      applicableItems = applicableItems.filter((item) =>
        includedIds.includes(item.productId)
      );
    }

    if (excludedProducts.length > 0) {
      const excludedIds = excludedProducts.map((p) => p.productId);
      applicableItems = applicableItems.filter(
        (item) => !excludedIds.includes(item.productId)
      );
    }

    // Category restrictions
    const includedCategories = coupon.categories.filter((c) => c.type === "INCLUDE");
    const excludedCategories = coupon.categories.filter((c) => c.type === "EXCLUDE");

    if (includedCategories.length > 0) {
      const includedCatIds = includedCategories.map((c) => c.categoryId);
      applicableItems = applicableItems.filter(
        (item) => item.categoryId && includedCatIds.includes(item.categoryId)
      );
    }

    if (excludedCategories.length > 0) {
      const excludedCatIds = excludedCategories.map((c) => c.categoryId);
      applicableItems = applicableItems.filter(
        (item) => !item.categoryId || !excludedCatIds.includes(item.categoryId)
      );
    }

    // Exclude sale items if required
    if (coupon.excludeSaleItems) {
      applicableItems = applicableItems.filter(
        (item) => !item.compareAtPrice || item.price >= item.compareAtPrice
      );
    }

    // Limit to X items if specified
    if (coupon.limitUsageToXItems) {
      applicableItems = applicableItems.slice(0, coupon.limitUsageToXItems);
    }

    // No applicable items
    if (applicableItems.length === 0) {
      return { valid: false, error: "Coupon does not apply to any items in your cart" };
    }

    // Calculate applicable total
    applicableTotal = applicableItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate discount
    let discount = 0;

    switch (coupon.type) {
      case "PERCENTAGE":
        discount = (applicableTotal * coupon.value) / 100;
        break;
      case "FIXED_CART":
        discount = coupon.value;
        break;
      case "FIXED_PRODUCT":
        discount = coupon.value * applicableItems.reduce((sum, i) => sum + i.quantity, 0);
        break;
      case "FREE_SHIPPING":
        // Handled separately - return 0 discount but valid
        return {
          valid: true,
          discount: 0,
          coupon: { ...coupon, isFreeShipping: true },
        };
    }

    // Apply max discount cap
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    // Discount cannot exceed applicable total
    discount = Math.min(discount, applicableTotal);

    return {
      valid: true,
      discount: Math.round(discount * 100) / 100, // Round to 2 decimals
      coupon,
    };
  } catch (error) {
    console.error("Coupon validation error:", error);
    return { valid: false, error: "Failed to validate coupon" };
  }
}

// Apply coupon (increment usage count)
export async function applyCoupon(
  couponId: string,
  userId?: string,
  orderId?: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Increment usage count
      await tx.coupon.update({
        where: { id: couponId },
        data: { usageCount: { increment: 1 } },
      });

      // Log usage if user provided
      if (userId) {
        await tx.couponUsage.create({
          data: {
            couponId,
            userId,
            orderId,
          },
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Apply coupon error:", error);
    return false;
  }
}

// Revert coupon usage (for cancelled orders)
export async function revertCouponUsage(
  couponId: string,
  userId?: string,
  orderId?: string
): Promise<boolean> {
  try {
    await prisma.$transaction(async (tx) => {
      // Decrement usage count
      await tx.coupon.update({
        where: { id: couponId },
        data: { usageCount: { decrement: 1 } },
      });

      // Remove usage log
      if (orderId) {
        await tx.couponUsage.deleteMany({
          where: { couponId, orderId },
        });
      }
    });

    return true;
  } catch (error) {
    console.error("Revert coupon usage error:", error);
    return false;
  }
}
