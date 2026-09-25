// src/features/publications/modules/marketplace.tsx

import { Linking } from "react-native";

import {
  ProductCard as ProductContent,
  type ProductCardData,
} from "@/features/marketplace/components/ProductCard";
import type { ProductStatus } from "@/features/marketplace/types";

import {
  getBoolean,
  getNumber,
  getOptionalNumber,
  getOptionalString,
  getPublicationExtras,
  getString,
  isRecord,
  parseMeta,
} from "../meta";
import { registerPublicationRenderer } from "../registry";

registerPublicationRenderer(
  "marketplace",
  ({ publication, index, onLike, onAction }) => {
    const meta = parseMeta(publication.meta);
    const extras = getPublicationExtras(publication);

    /**
     * Une publication Marketplace doit référencer un véritable produit.
     *
     * On ne transforme jamais l'ID de la publication en Id<"products">.
     * Si la référence produit est absente, ce module ne rend pas de
     * ProductCard et laisse le renderer central utiliser son fallback.
     */
    const productId = getOptionalString(meta, "productId");

    if (!productId) {
      return null;
    }

    const status: ProductStatus =
      publication.status === "active" ? "active" : "archived";

    const author = isRecord(extras.author) ? extras.author : undefined;

    const product: ProductCardData = {
      _id: productId,

      title: publication.title,
      description: publication.description,

      price: Number.parseFloat(publication.price || "0"),
      currency: getString(meta, "currency", "XAF"),
      category: getString(meta, "category"),

      images: publication.images || [],

      stock: getNumber(meta, "stock", 0),
      unit: getOptionalString(meta, "unit"),

      tags: publication.tags || [],

      status,

      isDigital: getBoolean(meta, "isDigital"),
      deliveryAvailable: getBoolean(meta, "deliveryAvailable"),

      location: publication.location || undefined,
      latitude: getOptionalNumber(meta, "latitude"),
      longitude: getOptionalNumber(meta, "longitude"),

      rating: getOptionalNumber(meta, "avgRating"),
      reviewCount: getNumber(meta, "reviewCount", 0),

      createdAt: publication._creationTime,
      updatedAt: publication._creationTime,

      sellerId: publication.authorId,

      sellerName: getOptionalString(meta, "sellerName") || author?.name,

      sellerAvatar: getOptionalString(meta, "sellerAvatar") || author?.avatar,

      sellerVerified: getBoolean(meta, "sellerVerified"),

      isLiked: publication.likedByMe || false,
      isInCart: false,
    };

    const handlePress = () => {
      void Linking.openURL(`/marketplace/${productId}`);
    };

    const handleAddToCart = () => {
      onAction("add-to-cart");
    };

    return (
      <ProductContent
        product={product}
        index={index}
        onPress={handlePress}
        onLike={onLike}
        onAddToCart={handleAddToCart}
      />
    );
  },
);
