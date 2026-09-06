// src/features/marketplace/adapter.ts
import type { Doc } from "@/convex/_generated/dataModel";
import type {
  Product,
  CartItem,
  Order,
  Review,
  Seller,
  SellerAnalytics,
} from "./types";
import type { Id } from "@/convex/_generated/dataModel";

export function adaptProduct(
  product: Doc<"products"> & {
    sellerName?: string;
    sellerAvatar?: string;
    sellerVerified?: boolean;
    isLiked?: boolean;
    isInCart?: boolean;
  },
): Product {
  return {
    _id: product._id,
    sellerId: product.sellerId,
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    category: product.category,
    images: product.images || [],
    stock: product.stock,
    unit: product.unit,
    tags: product.tags || [],
    status: product.status as Product["status"],
    isDigital: product.isDigital || false,
    deliveryAvailable: product.deliveryAvailable || false,
    location: product.location,
    latitude: product.latitude,
    longitude: product.longitude,
    rating: (product as any).rating || undefined,
    reviewCount: (product as any).reviewCount || 0,
    createdAt: product._creationTime,
    updatedAt: product._creationTime,
    sellerName: product.sellerName || undefined,
    sellerAvatar: product.sellerAvatar || undefined,
    sellerVerified: product.sellerVerified || false,
    isLiked: product.isLiked || false,
    isInCart: product.isInCart || false,
  };
}

export function adaptCartItem(
  item: Doc<"cartItems"> & { product?: any },
): CartItem {
  return {
    _id: item._id,
    userId: item.userId,
    productId: item.productId,
    product: item.product ? adaptProduct(item.product) : undefined,
    quantity: item.quantity,
  };
}

export function adaptOrder(
  order: Doc<"orders"> & {
    product?: any;
    buyerName?: string;
    sellerName?: string;
  },
): Order {
  return {
    _id: order._id,
    buyerId: order.buyerId,
    sellerId: order.sellerId,
    productId: order.productId,
    product: order.product ? adaptProduct(order.product) : undefined,
    quantity: order.quantity,
    totalAmount: order.totalAmount,
    currency: order.currency,
    status: order.status as Order["status"],
    deliveryAddress: order.deliveryAddress,
    note: order.note,
    paidAt: order.paidAt,
    deliveredAt: order.deliveredAt,
    createdAt: order._creationTime,
    buyerName: order.buyerName,
    sellerName: order.sellerName,
  };
}

export function adaptReview(
  review: Doc<"productReviews"> & {
    reviewerName?: string;
    reviewerAvatar?: string;
  },
): Review {
  return {
    _id: review._id,
    productId: review.productId,
    orderId: review.orderId,
    reviewerId: review.reviewerId,
    rating: review.rating,
    comment: review.comment,
    createdAt: review._creationTime,
    reviewerName: review.reviewerName,
    reviewerAvatar: review.reviewerAvatar,
  };
}

export function adaptSeller(
  user: Doc<"users"> & {
    totalSales?: number;
    rating?: number;
    reviewCount?: number;
  },
): Seller {
  return {
    userId: user._id,
    name: user.name,
    avatar: user.avatar,
    verified: false,
    rating: user.rating || undefined,
    reviewCount: user.reviewCount || 0,
    totalSales: user.totalSales || 0,
    responseTime: undefined,
    joinDate: user._creationTime,
    location: user.city,
    bio: user.bio,
  };
}

export function adaptSellerAnalytics(data: {
  sellerId: Id<"users">;
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageRating: number;
  responseTime: number;
  followers: number;
}): SellerAnalytics {
  return {
    sellerId: data.sellerId,
    totalRevenue: data.totalRevenue,
    totalOrders: data.totalOrders,
    totalProducts: data.totalProducts,
    averageRating: data.averageRating,
    responseTime: data.responseTime || 0,
    followers: data.followers || 0,
  };
}
