// src/features/marketplace/utils/coupon.ts
import type { Coupon } from "../types";

export function isCouponValid(coupon: Coupon): boolean {
  const now = Date.now();
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < now)
    return false;
  if (coupon.minPurchase && coupon.minPurchase > (coupon.currentPrice || 0))
    return false;
  return true;
}

export function applyCoupon(price: number, coupon: Coupon): number {
  if (!isCouponValid(coupon)) return price;
  if (coupon.type === "percentage") {
    return price * (1 - coupon.discount / 100);
  }
  return Math.max(0, price - coupon.discount);
}

export function generateCouponCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getCouponSavings(price: number, coupon: Coupon): number {
  const finalPrice = applyCoupon(price, coupon);
  return price - finalPrice;
}
