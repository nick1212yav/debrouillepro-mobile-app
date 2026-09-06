import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/pages/modules/MarketplaceProPage.tsx
// ✅ Version corrigée – toutes les erreurs TS7006 résolues

import { useState, useMemo } from "react";
import { useQuery, useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Id } from "@/convex/_generated/dataModel.d";
import {
  ArrowLeft,
  TrendingUp,
  ShoppingBag,
  Package,
  Star,
  DollarSign,
  BarChart2,
  ChevronRight,
  Zap,
  Flame,
  CheckCircle,
  Clock,
  X,
  Download,
  Eye,
  Tag,
  Megaphone,
  Plus,
  Search,
  Edit,
} from "lucide-react-native";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// ── Type Product ─────────────────────────────────────────────────────────────
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
  status: string;
};

// ── Types ─────────────────────────────────────────────────────────────────────
type OrderStatusDisplay =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
type TabId = "dashboard" | "produits" | "commandes" | "boosts";

interface NewProductForm {
  title: string;
  description: string;
  price: string;
  currency: string;
  category: string;
  images: string;
  stock: string;
  unit: string;
  tags: string;
  isDigital: boolean;
  deliveryAvailable: boolean;
  location: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return Math.abs(n).toLocaleString("fr-FR");
}

const ORDER_STATUS_CFG: Record<
  OrderStatusDisplay,
  { color: string; bg: string; label: string }
> = {
  pending: { color: "#F59E0B", bg: "#F59E0B20", label: "En attente" },
  confirmed: { color: "#3B82F6", bg: "#3B82F620", label: "Confirmé" },
  shipped: { color: "#6366F1", bg: "#6366F120", label: "Expédié" },
  delivered: { color: "#10B981", bg: "#10B98120", label: "Livré" },
  cancelled: { color: "#EF4444", bg: "#EF444420", label: "Annulé" },
  refunded: { color: "#9CA3AF", bg: "#9CA3AF20", label: "Remboursé" },
};

// ── Create Product Sheet ──────────────────────────────────────────────────────
function CreateProductSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const createMutation = useMutation(api.commerce.createProduct);
  const [form, setForm] = useState<NewProductForm>({
    title: "",
    description: "",
    price: "",
    currency: "XAF",
    category: "Mode",
    images: "",
    stock: "",
    unit: "pièce",
    tags: "",
    isDigital: false,
    deliveryAvailable: true,
    location: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof NewProductForm, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.price || !form.stock) {
      UIService.openToast("Titre, prix et stock sont requis", "error");
      return;
    }
    setSubmitting(true);
    try {
      await createMutation({
        title: form.title,
        description: form.description || "Aucune description",
        price: parseFloat(form.price),
        currency: form.currency,
        category: form.category,
        images: form.images
          ? form.images
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        stock: parseInt(form.stock),
        unit: form.unit || undefined,
        tags: form.tags
          ? form.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        isDigital: form.isDigital,
        deliveryAvailable: form.deliveryAvailable,
        location: form.location || undefined,
      });
      UIService.openToast("Produit créé !", "success");
      onCreated();
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur lors de la création", "error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={onClose}
        className="absolute inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      />
      <View
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-5 max-h-[85%] overflow-y-auto"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
      >
        <View className="w-12 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <View className="flex items-center justify-between mb-4">
          <Text className="text-white font-black text-lg">Nouveau produit</Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <X size={15} className="text-white" />
          </Pressable>
        </View>

        <View className="space-y-3">
          {[
            {
              label: "Titre *",
              key: "title" as const,
              placeholder: "Nom du produit",
            },
            {
              label: "Description",
              key: "description" as const,
              placeholder: "Décrivez votre produit",
            },
            {
              label: "Prix *",
              key: "price" as const,
              placeholder: "Ex: 15000",
            },
            { label: "Stock *", key: "stock" as const, placeholder: "Ex: 50" },
            {
              label: "Catégorie",
              key: "category" as const,
              placeholder: "Ex: Mode, Beauté, Alimentation",
            },
            {
              label: "Images (URLs séparées par des virgules)",
              key: "images" as const,
              placeholder: "https://...",
            },
            {
              label: "Tags (séparés par virgules)",
              key: "tags" as const,
              placeholder: "handmade, premium",
            },
            {
              label: "Localisation",
              key: "location" as const,
              placeholder: "Kinshasa, RDC",
            },
          ].map(({ label, key, placeholder }) => (
            <View key={key}>
              <Text className="text-white/50 text-xs mb-1">{label}</Text>
              <TextInput
                value={form[key] as string}
                onChangeText={(text) => update(key, text)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/25"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              />
            </View>
          ))}

          <View className="flex gap-3">
            <View className="flex-1">
              <Text className="text-white/50 text-xs mb-1">Devise</Text>
              <Picker
               
                onValueChange={(val) => update("currency", val)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               selectedValue={form.currency}>
                <Picker.Item label="FCFA (XAF)" value="XAF" />
                <Picker.Item label="USD" value="USD" />
                <Picker.Item label="EUR" value="EUR" />
              </Picker>
            </View>
            <View className="flex-1">
              <Text className="text-white/50 text-xs mb-1">Unité</Text>
              <Picker
               
                onValueChange={(val) => update("unit", val)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none"
                style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
               selectedValue={form.unit}>
                <Picker.Item label="Pièce" value="pièce" />
                <Picker.Item label="Kg" value="kg" />
                <Picker.Item label="Lot" value="lot" />
              </Picker>
            </View>
          </View>

          <View className="flex gap-4">
            <Text className="flex items-center gap-2">
              <Pressable
               
                checked={form.deliveryAvailable}
                onPress={(e) => update("deliveryAvailable", e.target.checked)}
                className="rounded"
               accessibilityRole="checkbox" accessibilityState={{ checked: form.deliveryAvailable }}/>
              <Text className="text-white/60 text-xs">Livraison</Text>
            </Text>
            <Text className="flex items-center gap-2">
              <Pressable
               
                checked={form.isDigital}
                onPress={(e) => update("isDigital", e.target.checked)}
                className="rounded"
               accessibilityRole="checkbox" accessibilityState={{ checked: form.isDigital }}/>
              <Text className="text-white/60 text-xs">Digital</Text>
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 mt-4"
          style={{  }}
        >
          <Plus size={16} className="text-white" />
          <Text className="text-white font-black">
            {submitting ? "Création..." : "Créer le produit"}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

// ── Inner (authenticated) ─────────────────────────────────────────────────────
function MarketplaceProInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [orderFilter, setOrderFilter] = useState<"tous" | OrderStatusDisplay>(
    "tous",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Id<"products"> | null>(
    null,
  );

  // ✅ Récupérer l'email Firebase
  const { user } = useFirebaseAuth();
  const email = user?.email;

  // ✅ Utiliser l'email pour récupérer l'utilisateur Convex
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Fetch my products (filtered by seller)
  const productsResult = useQuery(
    api.commerce.listProducts,
    currentUser?._id
      ? {
          sellerId: currentUser._id,
          paginationOpts: { numItems: 50, cursor: null },
        }
      : "skip",
  );
  // ✅ Correction : typer explicitement `products` comme un tableau de `Product`
  const products: Product[] = (productsResult?.page ?? []) as Product[];
  const productsStatus =
    productsResult === undefined ? "LoadingFirstPage" : "Exhausted";
  const loadMore = () => {
    /* noop */
  };

  // Fetch my orders as seller
  const orders = useQuery(api.commerce.getMyOrders, { role: "seller" });

  // Mutations
  const updateProductMutation = useMutation(api.commerce.updateProduct);
  const updateOrderStatusMutation = useMutation(api.commerce.updateOrderStatus);

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalCA = useMemo(() => {
    if (!orders) return 0;
    return orders
      .filter((o) => o.status === "delivered")
      .reduce((a, o) => a + o.totalAmount, 0);
  }, [orders]);

  const totalOrders =
    orders?.filter((o) => o.status === "delivered").length ?? 0;
  const pendingOrders =
    orders?.filter(
      (o) =>
        o.status === "pending" ||
        o.status === "confirmed" ||
        o.status === "shipped",
    ).length ?? 0;

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const byStatus =
      orderFilter === "tous"
        ? orders
        : orders.filter((o) => o.status === orderFilter);
    if (!searchQuery) return byStatus;
    return byStatus.filter(
      (o) =>
        (o.product?.title ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (o.counterpartName ?? "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [orders, orderFilter, searchQuery]);

  const handleUpdateOrderStatus = async (
    orderId: Id<"orders">,
    status: "confirmed" | "shipped" | "delivered" | "cancelled",
  ) => {
    try {
      await updateOrderStatusMutation({ id: orderId, status });
      UIService.openToast(`Commande mise à jour: ${ORDER_STATUS_CFG[status].label}`, "success");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur de mise à jour", "error");
      }
    }
  };

  const handleArchiveProduct = async (productId: Id<"products">) => {
    try {
      await updateProductMutation({ id: productId, status: "archived" });
      UIService.openToast("Produit archivé", "success");
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Erreur", "error");
      }
    }
  };

  // Sparkline data (synthetic based on real order count)
  const sparkData = [
    30,
    45,
    55,
    40,
    65,
    75,
    Math.min(100, totalOrders * 10 + 20),
  ];
  const sparkMax = Math.max(...sparkData, 1);

  return (
    <View
      className="h-full flex flex-col relative"
      style={{  }}
    >
      {/* Ambient glows */}
      <View
        className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-48"
        style={{  }}
      />
      <View
        className="absolute bottom-32 right-0 w-48 h-48"
        style={{  }}
      />

      {/* Header */}
      <View
        className="flex-shrink-0 pt-safe px-4 py-3 flex items-center gap-3"
        style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", }}
      >
        <Pressable
          onPress={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-black text-lg">Marketplace Pro</Text>
          <Text className="text-white/40 text-xs">Dashboard vendeur</Text>
        </View>
        <Pressable
          onPress={() => setShowCreateSheet(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{  }}
        >
          <Plus size={13} className="text-white" />
          <Text className="text-white font-semibold text-xs">Produit</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View className="flex-shrink-0 flex gap-1 px-4 py-3">
        {[
          { id: "dashboard" as TabId, label: "Dashboard", icon: BarChart2 },
          { id: "produits" as TabId, label: "Produits", icon: Package },
          { id: "commandes" as TabId, label: "Commandes", icon: ShoppingBag },
          { id: "boosts" as TabId, label: "Boosts", icon: Megaphone },
        ].map(({ id, label, icon: Icon }) => (
          <Pressable
            key={id}
            onPress={() => setTab(id)}
            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[11px] font-semibold"
            style={
              tab === id
                ? {  }
                : { backgroundColor: "rgba(255,255,255,0.06)" }
            }
          >
            <Icon size={11} />
            {label}
          </Pressable>
        ))}
      </View>

      <View
        className="flex-1 overflow-y-auto"
        style={{  }}
      >
        {/* ── Dashboard tab ─────────────────────────────────────────── */}
        {tab === "dashboard" && (
          <View className="px-4 pb-8">
            {/* Revenue card */}
            <View
              className="rounded-2xl overflow-hidden mb-5"
            >
              <View
                className="h-1.5"
                style={{  }}
              />
              <View
                className="p-5"
                style={{ borderWidth: 1, borderColor: "rgba(249,115,22,0.2)", borderStyle: "solid" }}
              >
                <Text className="text-white/50 text-sm mb-1">
                  Chiffre d'affaires (livrés)
                </Text>
                <Text className="text-white font-black text-4xl mb-0.5">
                  {fmt(totalCA)}
                  <Text className="text-white/40 text-lg font-normal">
                    {" "}
                    FCFA
                  </Text>
                </Text>
                <Text className="text-green-400 text-xs font-semibold flex items-center gap-1 mb-4">
                  <TrendingUp size={11} /> {totalOrders} commande
                  {totalOrders > 1 ? "s" : ""} livrée
                  {totalOrders > 1 ? "s" : ""}
                </Text>

                {/* Sparkline */}
                <View className="flex items-end gap-1 h-14">
                  {sparkData.map((v, i) => (
                    <View
                      key={i}
                      className="flex-1 rounded-sm"
                      style={{  }}
                    />
                  ))}
                </View>
              </View>
            </View>

            {/* KPI grid */}
            <View className="gap-3 mb-5">
              {[
                {
                  icon: DollarSign,
                  label: "Revenu total",
                  value: `${fmt(totalCA)} FCFA`,
                  color: "#10B981",
                },
                {
                  icon: ShoppingBag,
                  label: "Commandes livrées",
                  value: `${totalOrders}`,
                  color: "#8B5CF6",
                },
                {
                  icon: Package,
                  label: "Produits actifs",
                  // ✅ Correction : ajout du type explicite pour `p`
                  value: `${products.filter((p: Product) => p.status === "active").length ?? 0}`,
                  color: "#3B82F6",
                },
                {
                  icon: Clock,
                  label: "En attente",
                  value: `${pendingOrders}`,
                  color: "#F59E0B",
                },
              ].map(({ icon: Icon, label, value, color }) => (
                <View
                  key={label}
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                >
                  <View
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
                    style={{ backgroundColor: `${color}22` }}
                  >
                    <Icon size={16} style={{ color }} />
                  </View>
                  <Text className="text-white font-black text-lg">{value}</Text>
                  <Text className="text-white/50 text-xs">{label}</Text>
                </View>
              ))}
            </View>

            {/* Recent orders preview */}
            {orders && orders.length > 0 && (
              <View
                className="rounded-2xl p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
              >
                <Text className="text-white font-bold text-sm mb-3">
                  Dernières commandes
                </Text>
                {orders.slice(0, 3).map((o) => {
                  const cfg =
                    ORDER_STATUS_CFG[o.status as OrderStatusDisplay] ??
                    ORDER_STATUS_CFG.pending;
                  return (
                    <View
                      key={o._id}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <View className="flex-1 min-w-0">
                        <Text className="text-white/80 text-xs font-semibold">
                          {o.product?.title ?? "Produit"}
                        </Text>
                        <Text className="text-white/40 text-[10px]">
                          {o.counterpartName ?? "Acheteur"}
                        </Text>
                      </View>
                      <Text
                        className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                      >
                        {cfg.label}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Produits tab ──────────────────────────────────────────── */}
        {tab === "produits" && (
          <View className="px-4 pb-8">
            <View
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <Search size={14} className="text-white/40" />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                placeholder="Rechercher un produit…"
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
            </View>

            {!products ? (
              <View className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </View>
            ) : products.length === 0 ? (
              <View className="text-center py-16">
                <Package size={40} className="text-white/20 mx-auto mb-3" />
                <Text className="text-white/40 text-sm">Aucun produit</Text>
                <Text className="text-white/25 text-xs mt-1">
                  Créez votre premier produit pour commencer à vendre
                </Text>
                <Pressable
                  onPress={() => setShowCreateSheet(true)}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{  }}
                >
                  <Plus size={14} className="inline mr-1" />
                  <Text>Créer un produit</Text></Pressable>
              </View>
            ) : (
              <>
                {products
                  // ✅ Correction : type explicite pour `p`
                  .filter(
                    (p: Product) =>
                      !searchQuery ||
                      p.title.toLowerCase().includes(searchQuery.toLowerCase()),
                  )
                  // ✅ Correction : types explicites pour `p` et `idx`
                  .map((p: Product, idx: number) => {
                    const statusColor =
                      p.status === "active"
                        ? "#10B981"
                        : p.status === "out_of_stock"
                          ? "#EF4444"
                          : "#9CA3AF";
                    const statusLabel =
                      p.status === "active"
                        ? "Actif"
                        : p.status === "out_of_stock"
                          ? "Rupture"
                          : "Archivé";
                    return (
                      <View
                        key={p._id}
                        className="rounded-2xl overflow-hidden mb-4"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                      >
                        <View className="p-4">
                          <View className="flex items-start gap-3 mb-3">
                            <View
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
                              style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                            >
                              {p.images.length > 0 ? (
                                <Image
                                 
                                 
                                  className="w-full h-full object-cover rounded-xl"
                                 source={{ uri: p.images[0] }} accessibilityLabel={p.title}/>
                              ) : (
                                <Package size={20} className="text-white/30" />
                              )}
                            </View>
                            <View className="flex-1 min-w-0">
                              <Text className="text-white font-bold text-sm leading-tight">
                                {p.title}
                              </Text>
                              <Text className="text-white/40 text-xs">
                                {p.category} · {p.currency}
                              </Text>
                            </View>
                            <View className="flex flex-col items-end flex-shrink-0 gap-1">
                              <Text className="text-white font-bold text-sm">
                                {fmt(p.price)} {p.currency}
                              </Text>
                              <Text
                                className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                                style={{ color: statusColor, backgroundColor: `${statusColor}20` }}
                              >
                                {statusLabel}
                              </Text>
                            </View>
                          </View>

                          <View className="gap-2 mb-3">
                            {[
                              {
                                icon: Package,
                                val: p.stock,
                                label: "stock",
                                color: "#10B981",
                              },
                              {
                                icon: Tag,
                                val: p.category,
                                label: "catégorie",
                                color: "#8B5CF6",
                              },
                              {
                                icon: Zap,
                                val: p.deliveryAvailable ? "Oui" : "Non",
                                label: "livraison",
                                color: "#3B82F6",
                              },
                            ].map(({ icon: Icon, val, label, color }) => (
                              <View
                                key={label}
                                className="flex flex-col items-center gap-0.5 p-2 rounded-xl"
                                style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                              >
                                <Icon size={11} style={{ color }} />
                                <Text className="text-white font-bold text-xs">
                                  {val}
                                </Text>
                                <Text className="text-white/30 text-[9px]">
                                  {label}
                                </Text>
                              </View>
                            ))}
                          </View>

                          <View className="flex items-center gap-2">
                            {p.status === "active" && (
                              <Pressable
                                onPress={() => handleArchiveProduct(p._id)}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white/60"
                                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                              >
                                <Text>Archiver</Text></Pressable>
                            )}
                            {p.status === "archived" && (
                              <Pressable
                                onPress={async () => {
                                  await updateProductMutation({
                                    id: p._id,
                                    status: "active",
                                  });
                                  UIService.openToast("Produit réactivé", "success");
                                }}
                                className="flex-1 py-2 rounded-xl text-xs font-semibold text-green-400"
                                style={{ backgroundColor: "rgba(16,185,129,0.1)" }}
                              >
                                <Text>Réactiver</Text></Pressable>
                            )}
                          </View>
                        </View>
                      </View>
                    );
                  })}
                {productsStatus === "Exhausted" && products.length >= 50 && (
                  <Pressable
                    onPress={() => loadMore()}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white/50"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                  >
                    <Text>Charger plus</Text></Pressable>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Commandes tab ──────────────────────────────────────────── */}
        {tab === "commandes" && (
          <View className="px-4 pb-8">
            {/* Filter chips */}
            <View
              className="flex gap-2 overflow-x-auto pb-1 mb-3"
              style={{  }}
            >
              {(
                [
                  "tous",
                  "pending",
                  "confirmed",
                  "shipped",
                  "delivered",
                  "cancelled",
                  "refunded",
                ] as const
              ).map((f) => {
                const count =
                  f === "tous"
                    ? (orders?.length ?? 0)
                    : (orders?.filter((o) => o.status === f).length ?? 0);
                return (
                  <Pressable
                    key={f}
                    onPress={() => setOrderFilter(f)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={
                      orderFilter === f
                        ? {  }
                        : { backgroundColor: "rgba(255,255,255,0.06)" }
                    }
                  >
                    {f === "tous" ? "Tous" : ORDER_STATUS_CFG[f].label} <Text>(</Text>{count}
                    <Text>)</Text></Pressable>
                );
              })}
            </View>

            {/* Search */}
            <View
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              <Search size={14} className="text-white/40" />
              <TextInput
                value={searchQuery}
                onChangeText={(text) => setSearchQuery(text)}
                placeholder="Rechercher une commande…"
                className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
              />
            </View>

            {!orders ? (
              <View className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </View>
            ) : filteredOrders.length === 0 ? (
              <View className="text-center py-10 text-white/30 text-sm">
                <Text>Aucune commande trouvée</Text></View>
            ) : (
              <View className="flex flex-col gap-2">
                {filteredOrders.map((o, idx) => {
                  const cfg =
                    ORDER_STATUS_CFG[o.status as OrderStatusDisplay] ??
                    ORDER_STATUS_CFG.pending;
                  return (
                    <View
                      key={o._id}
                      className="rounded-2xl p-4"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                    >
                      <View className="flex items-start justify-between mb-2">
                        <View className="flex-1 min-w-0 pr-2">
                          <Text className="text-white font-semibold text-sm">
                            {o.product?.title ?? "Produit supprimé"}
                          </Text>
                          <Text className="text-white/40 text-xs">
                            {o.counterpartName ?? "Acheteur"} · {o.quantity}x
                          </Text>
                        </View>
                        <Text
                          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                          style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        >
                          {cfg.label}
                        </Text>
                      </View>
                      <View className="gap-2 mb-3">
                        <View
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                        >
                          <Text className="text-white/30 text-[10px]">Montant</Text>
                          <Text className="font-bold text-xs text-white">
                            {fmt(o.totalAmount)} {o.currency}
                          </Text>
                        </View>
                        <View
                          className="p-2 rounded-xl"
                          style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                        >
                          <Text className="text-white/30 text-[10px]">Quantité</Text>
                          <Text className="font-bold text-xs text-white">
                            {o.quantity} {o.product?.unit ?? "pcs"}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      {o.status === "pending" && (
                        <View className="flex gap-2">
                          <Pressable
                            onPress={() =>
                              handleUpdateOrderStatus(o._id, "confirmed")
                            }
                            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
                            style={{  }}
                          >
                            <Text>Confirmer</Text></Pressable>
                          <Pressable
                            onPress={() =>
                              handleUpdateOrderStatus(o._id, "cancelled")
                            }
                            className="py-2 px-3 rounded-xl text-xs font-bold text-red-400"
                            style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
                          >
                            <Text>Annuler</Text></Pressable>
                        </View>
                      )}
                      {o.status === "confirmed" && (
                        <Pressable
                          onPress={() =>
                            handleUpdateOrderStatus(o._id, "shipped")
                          }
                          className="w-full py-2 rounded-xl text-xs font-bold text-white"
                          style={{  }}
                        >
                          <Text>Marquer expédié</Text></Pressable>
                      )}
                      {o.status === "shipped" && (
                        <Pressable
                          onPress={() =>
                            handleUpdateOrderStatus(o._id, "delivered")
                          }
                          className="w-full py-2 rounded-xl text-xs font-bold text-white"
                          style={{  }}
                        >
                          <Text>Marquer livré</Text></Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ── Boosts tab ─────────────────────────────────────────────── */}
        {tab === "boosts" && (
          <View className="px-4 pb-8">
            {/* Info banner */}
            <View
              className="rounded-xl p-3 mb-4 flex items-start gap-2"
              style={{ backgroundColor: "rgba(249,115,22,0.08)", borderWidth: 1, borderColor: "rgba(249,115,22,0.15)", borderStyle: "solid" }}
            >
              <Megaphone
                size={14}
                className="text-orange-400 mt-0.5 flex-shrink-0"
              />
              <Text className="text-orange-300/80 text-xs leading-relaxed">
                Le système de boost sera bientôt disponible. Boostez vos
                produits pour les afficher en tête des résultats et augmenter
                votre visibilité x3.
              </Text>
            </View>

            <View className="text-center py-12">
              <Flame size={40} className="text-white/15 mx-auto mb-3" />
              <Text className="text-white/40 text-sm font-semibold">
                Fonctionnalité à venir
              </Text>
              <Text className="text-white/25 text-xs mt-1">
                Les boosts seront disponibles prochainement
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Create product sheet ────────────────────────────────────── */}
      <>
        {showCreateSheet && (
          <CreateProductSheet
            onClose={() => setShowCreateSheet(false)}
            onCreated={() => {
              /* products auto-refresh via reactive query */
            }}
          />
        )}
      </>
    </View>
  );
}

// ── Main page with auth ───────────────────────────────────────────────────────
interface MarketplaceProPageProps {
  onBack: () => void;
}

export default function MarketplaceProPage({
  onBack,
}: MarketplaceProPageProps) {
  const { isAuthenticated, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <View
        className="h-full w-full flex flex-col items-center justify-center gap-3 px-4"
        style={{  }}
      >
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <View className="space-y-3 w-full mt-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View
        className="h-full w-full flex flex-col items-center justify-center gap-4 px-6 text-center"
        style={{  }}
      >
        <ShoppingBag size={48} className="text-white/20" />
        <Text className="text-white font-bold text-lg">Espace Vendeur</Text>
        <Text className="text-white/50 text-sm">
          Connectez-vous pour gérer votre boutique
        </Text>
        <SignInButton />
        <Pressable
          onPress={onBack}
          className="text-white/40 text-xs mt-4"
        >
          ← Retour
        </Pressable>
      </View>
    );
  }

  return <MarketplaceProInner onBack={onBack} />;
}
