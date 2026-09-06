import { useRouter } from "expo-router";
import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/marketplace/components/ProductCard.tsx
import { useState } from "react";
import {
  Package,
  Heart,
  ShoppingCart,
  Star,
  Truck,
  ShieldCheck,
  Clock,
} from "lucide-react-native";
import { formatPrice } from "../utils/formatter";
import { getStockStatus, isInStock } from "../utils/inventory";
import type { Product } from "../types";

interface Props {
  product: Product;
  index: number;
  onPress: () => void;
  onLike?: () => void;
  onAddToCart?: () => void;
}

export function ProductCard({
  product,
  index,
  onPress,
  onLike,
  onAddToCart,
}: Props) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(product.isLiked || false);
  const [likeCount, setLikeCount] = useState(0); // compteur local

  const isAvailable = isInStock(product.stock);
  const stockStatus = getStockStatus(product.stock);

  const handleLike = (e: GestureResponderEvent) => {
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleAddToCart = (e: GestureResponderEvent) => {
    onAddToCart?.();
  };

  const handleSellerClick = (e: GestureResponderEvent) => {
    if (product.sellerId) {
      router.push(`/profile/${product.sellerId}`);
    }
  };

  const categoryColor = "#F97316";

  const renderStockBadge = () => {
    if (!isAvailable) {
      return (
        <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/90 text-white border border-red-400/30">
          Épuisé
        </Text>
      );
    }
    if (stockStatus === "low_stock") {
      return (
        <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white border border-amber-400/30 animate-pulse">
          Stock limité
        </Text>
      );
    }
    return (
      <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white border border-emerald-400/30">
        En stock
      </Text>
    );
  };

  return (
    <Pressable
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onPress={onPress}
      className="relative rounded-2xl overflow-hidden"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", transform: isHovered ? "scale(1.015)" : "scale(1)" }}
    >
      {/* Glow effect */}
      <View
        className="absolute inset-0 opacity-0"
        style={{ opacity: isHovered ? 1 : 0 }}
      />

      {/* Image */}
      <View className="relative h-52 overflow-hidden bg-black/20">
        {product.images && product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover"
            style={{
              transform: isHovered ? "scale(1.05)" : "scale(1)"
            }}
            loading="lazy"
          />
        ) : (
          <View className="w-full h-full flex items-center justify-center">
            <Package size={48} className="text-white/20" />
          </View>
        )}

        {/* Gradient overlay */}
        <View
          className="absolute inset-0"
          style={{  }}
        />

        {/* Badge stock */}
        <View className="absolute top-3 left-3">{renderStockBadge()}</View>

        {/* Like button */}
        <Pressable
          onPress={handleLike}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <Heart
            size={16}
            className={
              isLiked
                ? "fill-rose-500 text-rose-500"
                : "text-white/80 hover:text-rose-400"
            }
          />
        </Pressable>

        {/* Prix sur l'image */}
        <View className="absolute bottom-3 left-3">
          <Text
            className="px-3 py-1.5 rounded-xl text-sm font-bold"
            style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
          >
            {formatPrice(product.price, product.currency)}
          </Text>
        </View>
      </View>

      {/* Contenu */}
      <View className="p-4 space-y-2.5">
        {/* En-tête : catégorie + temps */}
        <View className="flex items-center justify-between">
          {product.category && (
            <Text
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: categoryColor }}
            >
              {product.category}
            </Text>
          )}
          {product.createdAt && (
            <Text className="text-[9px] text-white/30 flex items-center gap-1">
              <Clock size={10} />
              {new Date(product.createdAt).toLocaleDateString("fr-FR")}
            </Text>
          )}
        </View>

        {/* Titre */}
        <Text className="text-white font-bold text-base leading-tight">
          {product.title}
        </Text>

        {/* Description courte */}
        {product.description && (
          <Text className="text-sm text-white/60 leading-relaxed">
            {product.description}
          </Text>
        )}

        {/* Métriques : note, avis, stock */}
        <View className="flex items-center gap-3 text-xs text-white/40">
          {product.rating && product.rating > 0 && (
            <Text className="flex items-center gap-1 text-yellow-400">
              <Star size={12} fill="currentColor" />
              {product.rating.toFixed(1)}
              {product.reviewCount !== undefined && product.reviewCount > 0 && (
                <Text className="text-white/30">({product.reviewCount})</Text>
              )}
            </Text>
          )}
          {product.stock > 0 && (
            <Text className="text-emerald-400/60">
              {product.stock} en stock
            </Text>
          )}
        </View>

        {/* Footer : vendeur + panier */}
        <View className="flex items-center justify-between pt-2 border-t border-white/5">
          <Pressable
            onPress={handleSellerClick}
            className="flex items-center gap-2"
          >
            {product.sellerAvatar ? (
              <Image
               
               
                className="w-6 h-6 rounded-full object-cover border border-white/10"
                loading="lazy"
               source={{ uri: product.sellerAvatar }} accessibilityLabel={product.sellerName}/>
            ) : (
              <View
                className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: categoryColor }}
              >
                {product.sellerName?.[0] || "V"}
              </View>
            )}
            <Text className="text-white/50 text-xs truncate max-w-[100px]">
              {product.sellerName || "Vendeur"}
            </Text>
            {product.sellerVerified && (
              <ShieldCheck size={12} className="text-emerald-400" />
            )}
          </Pressable>

          {/* Panier + badges */}
          <View className="flex items-center gap-2">
            {product.deliveryAvailable && (
              <Text className="flex items-center gap-0.5 text-[9px] text-emerald-400/70">
                <Truck size={11} />
                Livraison
              </Text>
            )}
            {product.isDigital && (
              <Text className="flex items-center gap-0.5 text-[9px] text-blue-400/70">
                <Text className="text-xs">💻</Text> Digital
              </Text>
            )}
            {onAddToCart && isAvailable && (
              <Pressable
                onPress={handleAddToCart}
                className="p-2 rounded-xl bg-orange-500/20"
                style={{ borderWidth: 1, borderColor: "rgba(251,146,60,0.2)", borderStyle: "solid" }}
              >
                <ShoppingCart size={14} className="text-orange-400" />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Pressable>
  );
}
