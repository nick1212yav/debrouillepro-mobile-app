import { View, Pressable, Image, Text, GestureResponderEvent } from "react-native";

// src/features/marketplace/components/ProductCard.tsx
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(product.isLiked || false);
  const [likeCount, setLikeCount] = useState(0); // compteur local

  const isAvailable = isInStock(product.stock);
  const stockStatus = getStockStatus(product.stock);

  const handleLike = (e: GestureResponderEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    onLike?.();
  };

  const handleAddToCart = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onAddToCart?.();
  };

  const handleSellerClick = (e: GestureResponderEvent) => {
    e.stopPropagation();
    if (product.sellerId) {
      navigate(`/profile/${product.sellerId}`);
    }
  };

  const categoryColor = "#F97316";

  const renderStockBadge = () => {
    if (!isAvailable) {
      return (
        <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-500/90 text-white backdrop-blur-sm border border-red-400/30">Épuisé
        </Text>
      );
    }
    if (stockStatus === "low_stock") {
      return (
        <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-sm border border-amber-400/30 animate-pulse">Stock limité
        </Text>
      );
    }
    return (
      <Text className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-sm border border-emerald-400/30">En stock
      </Text>
    );
  };

  return (
    <View initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{
        delay: 0.05 + index * 0.04,
        type: "spring",
        damping: 20,
        stiffness: 300,
      }} onHoverStart={() => setIsHovered(true)} onHoverEnd={() => setIsHovered(false)} onPress={onPress} className="relative rounded-2xl overflow-hidden transition-all duration-300" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", boxShadow: isHovered
                ? `0 20px 60px rgba(0,0,0,0.3), 0 0 40px ${categoryColor}15`
                : "0 4px 20px rgba(0,0,0,0.1)", transform: isHovered ? [{ scale: 1.015 }] : [{ scale: 1 }] }}>
      {/* Glow effect */}
      <View className="absolute inset-0 pointer-events-none opacity-0 transition-opacity duration-500" style={{ opacity: isHovered ? 1 : 0 }} />

      {/* Image */}
      <View className="relative h-52 overflow-hidden bg-black/20">{product.images && product.images.length > 0 ? (
          <Image src={product.images[0]} alt={product.title} className="w-full h-full object-cover" style={{ transform: isHovered ? [{ scale: 1.05 }] : [{ scale: 1 }] }}  />
        ) : (
          <View className="w-full h-full flex items-center justify-center"><Package size={48} className="text-white/20" /></View>
        )}{}<View className="absolute inset-0" style={{  }} />{}<View className="absolute top-3 left-3">{renderStockBadge()}</View>{}<Pressable onPress={handleLike} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all active:scale-95" style={{ backgroundColor: "rgba(0,0,0,0.5)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Heart size={16} className={
              isLiked
                ? "fill-rose-500 text-rose-500"
                : "text-white/80 hover:text-rose-400"
            } /></Pressable>{}<View className="absolute bottom-3 left-3"><Text className="px-3 py-1.5 rounded-xl text-sm font-bold backdrop-blur-md" style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#FCD34D", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{formatPrice(product.price, product.currency)}</Text></View></View>

      {/* Contenu */}
      <View className="p-4 space-y-2.5">{}<View className="flex items-center justify-between">{product.category && (
            <Text className="text-[10px] font-bold uppercase tracking-wider" style={{ color: categoryColor }}>{product.category}</Text>
          )}{product.createdAt && (
            <Text className="text-[9px] text-white/30 flex items-center gap-1"><Clock size={10} />{new Date(product.createdAt).toLocaleDateString("fr-FR")}</Text>
          )}</View>{}<Text className="text-white font-bold text-base leading-tight">{product.title}</Text>{}{product.description && (
          <Text className="text-sm text-white/60 leading-relaxed">{product.description}</Text>
        )}{}<View className="flex items-center gap-3 text-xs text-white/40">{product.rating && product.rating > 0 && (
            <Text className="flex items-center gap-1 text-yellow-400"><Star size={12} fill="currentColor" />{product.rating.toFixed(1)}{product.reviewCount !== undefined && product.reviewCount > 0 && (
                <Text className="text-white/30">({product.reviewCount})</Text>
              )}</Text>
          )}{product.stock > 0 && (
            <Text className="text-emerald-400/60">{product.stock}en stock
            </Text>
          )}</View>{}<View className="flex items-center justify-between pt-2 border-t border-white/5"><Pressable onPress={handleSellerClick} className="flex items-center gap-2 transition-opacity">{product.sellerAvatar ? (
              <Image className="w-6 h-6 rounded-full object-cover border border-white/10" source={{ uri: product.sellerAvatar }} accessibilityLabel={product.sellerName} />
            ) : (
              <View className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: categoryColor }}>{product.sellerName?.[0] || "V"}</View>
            )}<Text className="text-white/50 text-xs truncate max-w-[100px]">{product.sellerName || "Vendeur"}</Text>{product.sellerVerified && (
              <ShieldCheck size={12} className="text-emerald-400" />
            )}</Pressable>{}<View className="flex items-center gap-2">{product.deliveryAvailable && (
              <Text className="flex items-center gap-0.5 text-[9px] text-emerald-400/70"><Truck size={11} />Livraison
              </Text>
            )}{product.isDigital && (
              <Text className="flex items-center gap-0.5 text-[9px] text-blue-400/70"><Text className="text-xs">💻</Text>Digital
              </Text>
            )}{onAddToCart && isAvailable && (
              <Pressable whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }} onPress={handleAddToCart} className="p-2 rounded-xl bg-orange-500/20 transition-all" style={{ borderWidth: 1, borderColor: "rgba(251,146,60,0.2)", borderStyle: "solid" }}>
                <ShoppingCart size={14} className="text-orange-400" />
              </Pressable>
            )}</View></View></View>
    </View>
  );
}
