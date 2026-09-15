import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/pages/modules/MarketplaceProPage.tsx
// ✅ Version définitive – toutes les erreurs TS7006 résolues globalement

import { useState } from "react";
import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  ShoppingBag,
  Plus,
  X,
  MessageCircle,
  Heart,
  ChevronDown,
  Filter,
  Check,
  Store,
  Tag,
  Zap,
  Package,
  ShoppingCart,
  Trash2,
  Minus,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from "lucide-react-native";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";

type SortKey = "recent" | "prix_asc" | "prix_desc";
const CATEGORIES = [
  "Tout",
  "Alimentation",
  "Artisanat",
  "Tech",
  "Mode",
  "Services",
  "Autre",
];
const CATEGORY_ICONS: Record<string, string> = {
  Tout: "🏪",
  Alimentation: "🥗",
  Artisanat: "🧶",
  Tech: "📱",
  Mode: "👗",
  Services: "⚡",
  Autre: "📦",
};
const SORT_LABELS: Record<SortKey, string> = {
  recent: "Plus récents",
  prix_asc: "Prix ↑",
  prix_desc: "Prix ↓",
};

type Product = {
  _id: Id<"products">;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  stock: number;
  tags: string[];
  isDigital: boolean;
  deliveryAvailable: boolean;
  sellerId: Id<"users">;
  sellerName?: string;
  sellerAvatar?: string;
  status: string;
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
function SellerAvatar({
  name,
  avatar,
  size = 40,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  if (avatar)
    return (
      <Image className="rounded-full object-cover" style={{ width: size, height: size }} source={{ uri: avatar }} accessibilityLabel={name} />
    );
  return (
    <View className="rounded-full flex items-center justify-center font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.35, flexShrink: 0 }}>{(name ?? "V").slice(0, 1).toUpperCase()}</View>
  );
}

// ─── Cart Sheet ───────────────────────────────────────────────────────────────
function CartSheet({
  onClose,
  onCheckout,
}: {
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useQuery(api.commerce.getMyCart, {});
  const updateItem = useMutation(api.commerce.updateCartItem);
  const clearCart = useMutation(api.commerce.clearCart);
  const [clearing, setClearing] = useState(false);

  const total = (cart ?? []).reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0,
  );

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearCart();
    } finally {
      setClearing(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl max-h-[80vh] flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between px-5 py-4 border-b border-white/8"><Text className="text-white font-bold text-lg flex items-center gap-2"><ShoppingCart size={18} />Panier
          </Text><View className="flex items-center gap-2">{cart && cart.length > 0 && (
              <Pressable onPress={() => void handleClear()} disabled={clearing} className="text-red-400 text-xs flex items-center gap-1"><Trash2 size={12} /><Text>Vider</Text></Pressable>
            )}<Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View></View>

        <View className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{  }}>{cart === undefined ? (
            [0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))
          ) : cart.length === 0 ? (
            <View className="text-center py-10"><ShoppingCart size={36} className="mx-auto mb-3 text-white/15" /><Text className="text-white/30 text-sm">Panier vide</Text></View>
          ) : (
            cart.map((item) => (
              <View key={item._id} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>{item.product?.images[0] ? (
                  <Image className="w-14 h-14 rounded-xl object-cover flex-shrink-0" source={{ uri: item.product.images[0] }} accessibilityLabel={item.product.title} />
                ) : (
                  <View className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Package size={20} className="text-white/30" /></View>
                )}<View className="flex-1 min-w-0"><Text className="text-white text-sm font-semibold truncate">{item.product?.title}</Text><Text className="text-orange-400 font-bold text-sm">{(item.product?.price ?? 0).toLocaleString()}{" "}{item.product?.currency}</Text></View><View className="flex items-center gap-2"><Pressable onPress={() =>
                      void updateItem({
                        itemId: item._id,
                        quantity: item.quantity - 1,
                      })} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><Minus size={12} className="text-white" /></Pressable><Text className="text-white font-bold text-sm w-4 text-center">{item.quantity}</Text><Pressable onPress={() =>
                      void updateItem({
                        itemId: item._id,
                        quantity: item.quantity + 1,
                      })} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><Plus size={12} className="text-white" /></Pressable></View></View>
            ))
          )}</View>

        {cart && cart.length > 0 && (
          <View className="px-5 pb-8 pt-3 border-t border-white/8"><View className="flex items-center justify-between mb-3"><Text className="text-white/60 text-sm">Total</Text><Text className="text-white font-black text-xl">{total.toLocaleString()}FCFA
              </Text></View><Pressable onPress={onCheckout} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ boxShadow: "0 8px 24px rgba(99,102,241,0.4)" }}><Text>Commander</Text><ArrowRight size={16} /></Pressable></View>
        )}
      </View>
    </View>
  );
}

// ─── Checkout Flow ────────────────────────────────────────────────────────────
function CheckoutSheet({
  cart,
  onClose,
}: {
  cart: ReturnType<typeof useQuery<typeof api.commerce.getMyCart>>;
  onClose: (ordered: boolean) => void;
}) {
  const [step, setStep] = useState<"address" | "confirm" | "done">("address");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const createOrder = useMutation(api.commerce.createOrder);
  const clearCart = useMutation(api.commerce.clearCart);

  const total = (cart ?? []).reduce(
    (s, i) => s + (i.product?.price ?? 0) * i.quantity,
    0,
  );

  const handleOrder = async () => {
    if (!address.trim()) {
      toast.error("Adresse requise");
      return;
    }
    setLoading(true);
    try {
      for (const item of cart ?? []) {
        if (!item.product) continue;
        await createOrder({
          productId: item.productId,
          quantity: item.quantity,
          deliveryAddress: address,
          note,
        });
      }
      await clearCart();
      setStep("done");
    } catch (e) {
      toast.error("Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onPress={(e) =>
        step !== "done" && e.target === e.currentTarget && onClose(false)
      }>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        {step === "done" ? (
          <View className="text-center py-6"><View initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 200 }}><CheckCircle2 size={56} className="mx-auto mb-4 text-green-400" /></View><Text className="text-white font-bold text-xl mb-2">Commande confirmée !
            </Text><Text className="text-white/50 text-sm mb-6">Vous recevrez une notification dès que le vendeur confirme.
            </Text><Pressable onPress={() => onClose(true)} className="px-8 py-3 rounded-2xl font-bold text-white" style={{  }}><Text>Retour à la boutique</Text></Pressable></View>
        ) : step === "address" ? (
          <>
            <View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg">Adresse de livraison
              </Text><Pressable onPress={() => onClose(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
            <View className="space-y-4"><View><Text className="text-xs text-white/50 mb-1 block">Adresse complète *
                </Text><TextInput value={address} onChangeText={(value) => setAddress(value)} placeholder="Quartier, rue, numéro, ville..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View><View><Text className="text-xs text-white/50 mb-1 block">Note pour le vendeur
                </Text><TextInput value={note} onChangeText={(value) => setNote(value)} placeholder="Instructions spéciales..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><Pressable onPress={() => setStep("confirm")} className="w-full py-3.5 rounded-xl font-bold text-white" style={{  }}><Text>Continuer</Text></Pressable></View>
          </>
        ) : (
          <>
            <View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg">Récapitulatif</Text><Pressable onPress={() => setStep("address")} className="text-white/50 text-xs"><Text>Modifier</Text></Pressable></View>
            <View className="space-y-2 mb-4">{(cart ?? []).map((item) => (
                <View key={item._id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Text className="text-white text-sm truncate flex-1">{item.product?.title}× {item.quantity}</Text><Text className="text-orange-400 font-bold text-sm ml-3">{(
                      (item.product?.price ?? 0) * item.quantity
                    ).toLocaleString()}</Text></View>
              ))}</View>
            <View className="flex items-center justify-between py-3 border-t border-white/10 mb-4"><Text className="text-white/60">Total</Text><Text className="text-white font-black text-xl">{total.toLocaleString()}FCFA
              </Text></View>
            <View className="p-3 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Text className="text-white/40 text-xs mb-1">Livraison à</Text><Text className="text-white text-sm">{address}</Text></View>
            <Pressable onPress={() => void handleOrder()} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2" style={{  }}>{loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Traitement...
                </>
              ) : (
                <>Confirmer la commande</>
              )}</Pressable>
          </>
        )}
      </View>
    </View>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────
function ProductDetail({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: Id<"products">) => void;
}) {
  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const reviews = useQuery(api.commerce.getProductReviews, {
    productId: product._id,
  });
  const [adding, setAdding] = useState(false);

  const avgRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const handleAdd = async () => {
    setAdding(true);
    try {
      await onAddToCart(product._id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 flex flex-col" style={{  }}>
      {/* Image gallery */}
      <View className="relative h-64 flex-shrink-0">{product.images[imgIdx] ? (
          <Image className="w-full h-full object-cover" source={{ uri: product.images[imgIdx] }} accessibilityLabel={product.title} />
        ) : (
          <View className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}><Package size={48} className="text-white/20" /></View>
        )}<View className="absolute inset-0" style={{  }} /><Pressable onPress={onClose} className="absolute top-4 left-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><ArrowLeft size={20} className="text-white" /></Pressable><Pressable onPress={() => setIsFav((v) => !v)} className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}><Heart size={20} className={isFav ? "text-red-400 fill-red-400" : "text-white"} /></Pressable>{product.images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">{product.images.map((_, i) => (
              <Pressable key={i} onPress={() => setImgIdx(i)} className="" style={{ width: i === imgIdx ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: i === imgIdx ? "#8B5CF6" : "rgba(255,255,255,0.4)" }} />
            ))}</View>
        )}</View>

      {/* Content */}
      <View className="flex-1 overflow-y-auto px-5 pt-3 pb-28" style={{  }}><View className="flex items-start justify-between mb-2"><View className="flex-1"><Text className="text-xs font-semibold px-2 py-0.5 rounded-full mb-2 inline-block" style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#fb923c", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}>{CATEGORY_ICONS[product.category] ?? "📦"}{product.category}</Text><Text className="text-white font-bold text-xl leading-tight mt-1">{product.title}</Text></View><View className="text-right ml-4"><View className="text-2xl font-black" style={{  }}>{product.price.toLocaleString()}</View><View className="text-white/50 text-xs">{product.currency}</View></View></View><View className="flex items-center gap-4 mb-4">{avgRating && (
            <Text className="flex items-center gap-1 text-sm text-yellow-400"><Star size={13} fill="currentColor" />{avgRating}<Text className="text-white/40 text-xs">({reviews?.length})</Text></Text>
          )}{product.deliveryAvailable && (
            <Text className="flex items-center gap-1 text-xs text-emerald-400"><Zap size={11} />Livraison dispo
            </Text>
          )}<Text className="text-xs text-white/50">Stock: {product.stock}</Text></View><View className="mb-5"><Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-2">Description
          </Text><Text className="text-white/80 text-sm leading-relaxed">{product.description}</Text></View>{product.tags.length > 0 && (
          <View className="flex gap-2 flex-wrap mb-5">{product.tags.map((tag) => (
              <Text key={tag} className="text-xs px-2.5 py-1 rounded-full" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)", borderStyle: "solid", color: "#a5b4fc" }}>#{tag}</Text>
            ))}</View>
        )}{}<View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Vendeur
          </Text><View className="flex items-center gap-3"><SellerAvatar name={product.sellerName} avatar={product.sellerAvatar} size={44} /><View className="flex-1"><Text className="text-white font-semibold">{product.sellerName ?? "Vendeur"}</Text><View className="flex items-center gap-1 mt-0.5"><Check size={12} className="text-green-400" /><Text className="text-green-400 text-xs">Vendeur vérifié</Text></View></View></View></View>{}{reviews && reviews.length > 0 && (
          <View><Text className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-3">Avis ({reviews.length})
            </Text><View className="space-y-3">{reviews.slice(0, 3).map((r) => (
                <View key={r._id} className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="flex items-center gap-2 mb-1"><Text className="text-white text-xs font-semibold">{r.reviewerName ?? "Utilisateur"}</Text><View className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={9}
                          className={
                            i < r.rating ? "text-yellow-400" : "text-white/20"
                          }
                          fill={i < r.rating ? "currentColor" : "none"}
                        />
                      ))}</View></View>{r.comment && (
                    <Text className="text-white/60 text-xs">{r.comment}</Text>
                  )}</View>
              ))}</View></View>
        )}</View>

      {/* CTA */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4" style={{  }}><Authenticated><View className="flex gap-3"><Pressable onPress={() => toast("Messagerie vendeur — bientôt !")} className="flex-1 py-3.5 rounded-2xl font-bold text-white/80 flex items-center justify-center gap-2 active:scale-95 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}><MessageCircle size={16} /><Text>Contacter</Text></Pressable><Pressable onPress={() => void handleAdd()} disabled={adding || product.stock === 0} className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50" style={{ boxShadow: "0 6px 20px rgba(249,115,22,0.4)" }}>{adding ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ShoppingCart size={16} />
              )}{product.stock === 0 ? "Épuisé" : "Ajouter"}</Pressable></View></Authenticated><Unauthenticated><SignInButton /></Unauthenticated></View>
    </View>
  );
}

// ─── Sell Form ────────────────────────────────────────────────────────────────
function SellForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Alimentation");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [stock, setStock] = useState("1");
  const [tags, setTags] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [loading, setLoading] = useState(false);
  const createProduct = useMutation(api.commerce.createProduct);

  const handleSubmit = async () => {
    if (!title.trim() || !price || !description.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      await createProduct({
        title,
        description,
        price: parseInt(price, 10),
        currency: "FCFA",
        category,
        images: [],
        stock: parseInt(stock, 10) || 1,
        unit: undefined,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isDigital: false,
        deliveryAvailable: delivery,
      });
      toast.success("Annonce publiée !");
      onClose();
    } catch {
      toast.error("Erreur lors de la publication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between mb-6"><Text className="text-white font-bold text-lg">Publier une annonce</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
        <View className="space-y-4"><View><Text className="text-xs text-white/50 mb-1 block">Titre *</Text><TextInput value={title} onChangeText={(value) => setTitle(value)} placeholder="Ex: Robe wax taille M..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><View><Text className="text-xs text-white/50 mb-2 block">Catégorie *
            </Text><View className="flex flex-wrap gap-2">{CATEGORIES.filter((c) => c !== "Tout").map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ backgroundColor: category === c
                                        ? "rgba(249,115,22,0.3)"
                                        : "rgba(255,255,255,0.07)", borderColor: "#f97316", borderStyle: "solid" }}>{CATEGORY_ICONS[c]}{c}</Pressable>
              ))}</View></View><View className="flex gap-3"><View className="flex-1"><Text className="text-xs text-white/50 mb-1 block">Prix (FCFA) *
              </Text><TextInput value={price} onChangeText={(value) => setPrice(value.replace(/\D/g, ""))} placeholder="5000" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><View className="w-24"><Text className="text-xs text-white/50 mb-1 block">Stock</Text><TextInput value={stock} onChangeText={(value) => setStock(value.replace(/\D/g, ""))} placeholder="1" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View></View><View><Text className="text-xs text-white/50 mb-1 block">Description *
            </Text><TextInput value={description} onChangeText={(value) => setDescription(value)} placeholder="Décrivez votre produit..." className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} multiline textAlignVertical="top" /></View><View><Text className="text-xs text-white/50 mb-1 block">Tags (séparés par virgule)
            </Text><TextInput value={tags} onChangeText={(value) => setTags(value)} placeholder="artisanat, fait main, coton" className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} /></View><Pressable onPress={() => setDelivery((d) => !d)} className="flex items-center gap-2"><View className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: delivery
                                ? "rgba(16,185,129,0.3)"
                                : "rgba(255,255,255,0.1)", borderColor: "#10b981", borderStyle: "solid" }}>{delivery && <Check size={12} className="text-emerald-400" />}</View><Text className="text-white/70 text-sm">Livraison disponible</Text></Pressable><Pressable onPress={() => void handleSubmit()} disabled={loading} className="w-full py-3.5 rounded-xl font-bold text-white transition-opacity disabled:opacity-50" style={{  }}>{loading ? "Publication..." : "Publier l'annonce"}</Pressable></View>
      </View>
    </View>
  );
}

// ─── Orders Sheet ─────────────────────────────────────────────────────────────
function OrdersSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");
  const orders = useQuery(api.commerce.getMyOrders, { role: tab });
  const updateStatus = useMutation(api.commerce.updateOrderStatus);

  const STATUS_COLORS: Record<string, string> = {
    pending: "#f59e0b",
    confirmed: "#6366f1",
    shipped: "#06b6d4",
    delivered: "#10b981",
    cancelled: "#ef4444",
  };
  const STATUS_LABELS: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full rounded-t-3xl max-h-[80vh] flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
        <View className="flex items-center justify-between px-5 py-4 border-b border-white/8"><Text className="text-white font-bold text-lg">Mes commandes</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}><X size={16} className="text-white" /></Pressable></View>
        <View className="flex gap-1 mx-4 mt-3 mb-0 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>{(["buyer", "seller"] as const).map((t) => (
            <Pressable key={t} onPress={() => setTab(t)} className="flex-1 py-2 rounded-lg text-xs font-bold transition-all" style={{ backgroundColor: tab === t ? "rgba(255,255,255,0.1)" : "transparent" }}>{t === "buyer" ? "Mes achats" : "Mes ventes"}</Pressable>
          ))}</View>
        <View className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{  }}>{orders === undefined ? (
            [0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : orders.length === 0 ? (
            <View className="text-center py-10"><ShoppingBag size={32} className="mx-auto mb-3 text-white/15" /><Text className="text-white/30 text-sm">Aucune commande</Text></View>
          ) : (
            orders.map((order) => (
              <View key={order._id} className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-start justify-between mb-2"><Text className="text-white font-semibold text-sm flex-1 truncate">{order.product?.title ?? "Produit"}</Text><Text className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0" style={{ backgroundColor: `${STATUS_COLORS[order.status]}20`, color: STATUS_COLORS[order.status] }}>{STATUS_LABELS[order.status] ?? order.status}</Text></View><View className="flex items-center gap-3"><Text className="text-orange-400 font-bold text-sm">{order.totalAmount.toLocaleString()}{order.currency}</Text><Text className="text-white/40 text-xs">× {order.quantity}</Text><Text className="text-white/40 text-xs">{order.counterpartName ??
                      (tab === "buyer" ? "Vendeur" : "Acheteur")}</Text></View>{tab === "seller" && order.status === "pending" && (
                  <Pressable onPress={() =>
                      void updateStatus({
                        id: order._id,
                        status: "confirmed",
                      }).then(() => toast.success("Commande confirmée"))} className="mt-2 w-full py-1.5 rounded-lg text-xs font-bold text-white" style={{ backgroundColor: "rgba(99,102,241,0.3)", borderWidth: 1, borderColor: "rgba(99,102,241,0.4)", borderStyle: "solid" }}><Text>Confirmer</Text></Pressable>
                )}</View>
            ))
          )}</View>
      </View>
    </View>
  );
}

// ─── Main Marketplace Page ────────────────────────────────────────────────────
export default function MarketplacePage({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<string>("Tout");
  const [sort, setSort] = useState<SortKey>("recent");
  const [search, setSearch] = useState("");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showOrders, setShowOrders] = useState(false);
  const { isAuthenticated } = useConvexAuth();

  const { results, status, loadMore } = usePaginatedQuery(
    api.commerce.listProducts,
    category !== "Tout" ? { category } : {},
    { initialNumItems: 12 },
  );

  const addToCart = useMutation(api.commerce.addToCart);
  const cart = useQuery(api.commerce.getMyCart, isAuthenticated ? {} : "skip");
  const cartCount = (cart ?? []).reduce((s, i) => s + i.quantity, 0);

  const handleAddToCart = async (productId: Id<"products">) => {
    try {
      await addToCart({ productId, quantity: 1 });
      toast.success("Ajouté au panier !");
      setSelectedProduct(null);
    } catch {
      toast.error("Erreur");
    }
  };

  // ✅ Définition correcte de `products` avec type explicite et fallback
  const products: Product[] = (results as Product[]) ?? [];

  const filtered = products.filter(
    (p: Product) =>
      !search || p.title.toLowerCase().includes(search.toLowerCase()),
  );
  const sorted = [...filtered].sort((a: Product, b: Product) => {
    if (sort === "prix_asc") return a.price - b.price;
    if (sort === "prix_desc") return b.price - a.price;
    return 0;
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  const activeCount = products.filter(
    (p: Product) => p.status === "active",
  ).length;
  const categoryCount = new Set(products.map((p: Product) => p.category)).size;

  return (
    <View className="flex flex-col h-full overflow-hidden" style={{  }}>{}<View className="flex-shrink-0 px-5 pt-12 pb-4"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex-1"><Text className="text-white font-black text-xl">Boutique</Text><Text className="text-white/40 text-xs">Achetez et vendez dans votre communauté
            </Text></View><View className="flex items-center gap-2"><Authenticated><Pressable onPress={() => setShowOrders(true)} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ShoppingBag size={18} className="text-white" /></Pressable><Pressable onPress={() => setShowCart(true)} className="relative w-10 h-10 rounded-2xl flex items-center justify-center" style={{  }}><ShoppingCart size={18} className="text-white" />{cartCount > 0 && (
                  <Text className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white">{cartCount}</Text>
                )}</Pressable></Authenticated><Pressable onPress={() => setShowSellForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm active:scale-95" style={{  }}><Plus size={15} /><Text>Vendre</Text></Pressable></View></View>{}<View className="flex gap-3 mb-4">{[
            {
              icon: <Store size={13} />,
              label: `${activeCount}+ articles`,
              color: "#8B5CF6",
            },
            {
              icon: <Tag size={13} />,
              label: `${categoryCount} catégories`,
              color: "#F97316",
            },
            {
              icon: <Zap size={13} />,
              label: "Livraison dispo",
              color: "#10B981",
            },
          ].map((s, i) => (
            <View key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium flex-1 justify-center" style={{ backgroundColor: `${s.color}18`, borderStyle: "solid" }}>{s.icon}{s.label}</View>
          ))}</View>{}<View className="flex items-center gap-2 rounded-2xl px-4 py-3 mb-4" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Search size={16} className="text-white/40 flex-shrink-0" /><TextInput value={search} onChangeText={(value) => setSearch(value)} placeholder="Rechercher..." className="bg-transparent flex-1 text-sm text-white placeholder-white/30 outline-none" />{search && (
            <Pressable onPress={() => setSearch("")} className=""><X size={14} className="text-white/40" /></Pressable>
          )}</View>{}<View className="flex gap-2 overflow-x-auto pb-1" style={{  }}>{CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0" style={{ backgroundColor: category === c
                                ? "rgba(249,115,22,0.25)"
                                : "rgba(255,255,255,0.07)", borderColor: "#F97316", borderStyle: "solid" }}>{CATEGORY_ICONS[c]}{c}</Pressable>
          ))}</View></View>{}<View className="flex-shrink-0 flex items-center justify-between px-5 py-2"><Text className="text-white/40 text-xs">{sorted.length}résultat{sorted.length > 1 ? "s" : ""}</Text><View className="relative"><Pressable onPress={() => setShowSortMenu(!showSortMenu)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><Filter size={13} />{SORT_LABELS[sort]}<ChevronDown size={12} /></Pressable><View>{showSortMenu && (
              <View initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute right-0 top-full mt-1 z-20 rounded-xl overflow-hidden py-1 w-40" style={{ backgroundColor: "#0f1729", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(
                  ([k, l]) => (
                    <Pressable key={k} onPress={() => {
                        setSort(k);
                        setShowSortMenu(false);
                      }} className="w-full flex items-center justify-between px-3 py-2 text-xs" style={{  }}>{l}{sort === k && <Check size={12} />}</Pressable>
                  ),
                )}
              </View>
            )}</View></View></View>{}<View className="flex-1 overflow-y-auto px-4 pb-8" style={{  }}>{status === "LoadingFirstPage" ? (
          <View className="gap-3">{[0, 1, 2, 3, 5, 6].map((i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}</View>
        ) : sorted.length === 0 ? (
          <View className="flex flex-col items-center justify-center h-48 text-center"><Package size={40} className="text-white/20 mb-3" /><Text className="text-white/50 text-sm">Aucun article trouvé</Text><Text className="text-white/30 text-xs mt-1">Soyez le premier à vendre !
            </Text></View>
        ) : (
          <>
            <View className="gap-3">{sorted.map((product: Product, i: number) => (
                <View key={product._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04, duration: 0.3 }} onPress={() => setSelectedProduct(product)} className="rounded-2xl overflow-hidden active:scale-95 transition-transform" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <View className="relative h-36">{product.images[0] ? (
                      <Image className="w-full h-full object-cover" source={{ uri: product.images[0] }} accessibilityLabel={product.title} />
                    ) : (
                      <View className="w-full h-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}><Package size={28} className="text-white/20" /></View>
                    )}<View className="absolute inset-0" style={{  }} />{product.deliveryAvailable && (
                      <Text className="absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded-lg" style={{ backgroundColor: "rgba(16,185,129,0.8)", color: "white" }}>⚡ Livré
                      </Text>
                    )}</View>
                  <View className="p-2.5"><Text className="text-white text-xs font-semibold leading-tight mb-1.5">{product.title}</Text><View className="flex items-center justify-between"><Text className="text-sm font-black" style={{ color: "#FB923C" }}>{product.price.toLocaleString()}{" "}<Text className="text-[9px] text-white/40">FCFA</Text></Text>{product.stock <= 3 && product.stock > 0 && (
                        <Text className="text-amber-400 text-[10px] font-semibold">Stock: {product.stock}</Text>
                      )}{product.stock === 0 && (
                        <Text className="text-red-400 text-[10px] font-semibold">Épuisé
                        </Text>
                      )}</View><View className="flex items-center gap-1 mt-1"><SellerAvatar name={product.sellerName} avatar={product.sellerAvatar} size={16} /><Text className="text-white/40 text-[10px] truncate">{product.sellerName ?? "Vendeur"}</Text></View></View>
                </View>
              ))}</View>
            {status === "CanLoadMore" && (
              <View className="flex justify-center mt-4">
                <Pressable onPress={() => loadMore(8)} className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  Charger plus
                </Pressable>
              </View>
            )}
          </>
        )}</View>{}<View>{selectedProduct && (
          <ProductDetail
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
          />
        )}</View>{}<View>{showSellForm && (
          <Authenticated>
            <SellForm onClose={() => setShowSellForm(false)} />
          </Authenticated>
        )}{showSellForm && (
          <Unauthenticated>
            <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-8" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setShowSellForm(false)}>
              <View className="rounded-2xl p-8 text-center" style={{ backgroundColor: "#0f1729" }} onPress={(e) => e.stopPropagation()}>
                <Text className="text-white font-bold mb-4">
                  Connectez-vous pour vendre
                </Text>
                <SignInButton />
              </View>
            </View>
          </Unauthenticated>
        )}</View>{}<View>{showCart && (
          <CartSheet
            onClose={() => setShowCart(false)}
            onCheckout={() => {
              setShowCart(false);
              setShowCheckout(true);
            }}
          />
        )}</View>{}<View>{showCheckout && (
          <CheckoutSheet
            cart={cart}
            onClose={(ordered) => {
              setShowCheckout(false);
              if (ordered) toast.success("Merci pour votre commande !");
            }}
          />
        )}</View>{}<View>{showOrders && <OrdersSheet onClose={() => setShowOrders(false)} />}</View></View>
  );
}
