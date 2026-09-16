// src/pages/modules/MarketplaceProPage.tsx

import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePaginatedQuery, useMutation, useQuery } from "convex/react";
import { ConvexError } from "convex/values";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Flame,
  Image as ImageIcon,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  TrendingUp,
  Truck,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

type TabId = "dashboard" | "produits" | "commandes";

type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

type ProductStatus = "active" | "out_of_stock" | "archived";

type Product = {
  _id: Id<"products">;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  images: string[];
  stock: number;
  unit?: string;
  tags: string[];
  isDigital: boolean;
  deliveryAvailable: boolean;
  location?: string;
  sellerId: Id<"users">;
  status: ProductStatus;
};

type SellerOrder = {
  _id: Id<"orders">;
  productId: Id<"products">;
  quantity: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  deliveryAddress?: string;
  note?: string;
  product?: Product | null;
  counterpartName?: string;
  _creationTime: number;
};

type NewProductForm = {
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
};

type EditProductForm = {
  title: string;
  description: string;
  price: string;
  stock: string;
  status: ProductStatus;
  images: string;
};

const COLORS = {
  background: "#050812",
  surface: "#0c1022",
  card: "rgba(255,255,255,0.055)",
  cardStrong: "rgba(255,255,255,0.08)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.07)",
  text: "#FFFFFF",
  muted: "#94A3B8",
  dim: "#64748B",
  primary: "#2563EB",
  indigo: "#4F46E5",
  green: "#10B981",
  orange: "#F59E0B",
  red: "#EF4444",
  purple: "#8B5CF6",
};

const ORDER_STATUS: Record<OrderStatus, { label: string; color: string }> = {
  pending: {
    label: "En attente",
    color: COLORS.orange,
  },
  confirmed: {
    label: "Confirmée",
    color: COLORS.primary,
  },
  shipped: {
    label: "Expédiée",
    color: COLORS.indigo,
  },
  delivered: {
    label: "Livrée",
    color: COLORS.green,
  },
  cancelled: {
    label: "Annulée",
    color: COLORS.red,
  },
  refunded: {
    label: "Remboursée",
    color: COLORS.dim,
  },
};

function formatAmount(value: number, currency: string) {
  return `${Math.abs(value).toLocaleString("fr-FR")} ${currency}`;
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | undefined;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (
      data &&
      typeof data === "object" &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={styles.toggleRow}
    >
      <View style={[styles.checkbox, value && styles.checkboxActive]}>
        {value ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>

      <Text style={styles.toggleLabel}>{label}</Text>
    </Pressable>
  );
}

function ModalShell({
  visible,
  title,
  subtitle,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          style={styles.modalKeyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle}>{title}</Text>

                {subtitle ? (
                  <Text style={styles.modalSubtitle}>{subtitle}</Text>
                ) : null}
              </View>

              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                accessibilityLabel="Fermer"
              >
                <X size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ProductFormModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createProduct = useMutation(api.commerce.createProduct);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<NewProductForm>({
    title: "",
    description: "",
    price: "",
    currency: "XAF",
    category: "",
    images: "",
    stock: "",
    unit: "pièce",
    tags: "",
    isDigital: false,
    deliveryAvailable: true,
    location: "",
  });

  const update = <K extends keyof NewProductForm>(
    key: K,
    value: NewProductForm[K],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async () => {
    const title = form.title.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price.replace(",", "."));
    const stock = Number(form.stock);
    const images = form.images
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const tags = form.tags
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!title) {
      Alert.alert("Produit", "Le titre est obligatoire.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      Alert.alert("Produit", "Le prix doit être valide.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      Alert.alert(
        "Produit",
        "Le stock doit être un nombre entier positif ou nul.",
      );
      return;
    }

    if (!category) {
      Alert.alert("Produit", "La catégorie est obligatoire.");
      return;
    }

    setSubmitting(true);

    try {
      await createProduct({
        title,
        description,
        price,
        currency: form.currency.trim() || "XAF",
        category,
        images,
        stock,
        unit: form.unit.trim() || undefined,
        tags,
        isDigital: form.isDigital,
        deliveryAvailable: form.deliveryAvailable,
        location: form.location.trim() || undefined,
      });

      Alert.alert(
        "Produit créé",
        "Votre produit a été enregistré dans le Marketplace.",
      );

      setForm({
        title: "",
        description: "",
        price: "",
        currency: "XAF",
        category: "",
        images: "",
        stock: "",
        unit: "pièce",
        tags: "",
        isDigital: false,
        deliveryAvailable: true,
        location: "",
      });

      onCreated();
      onClose();
    } catch (error) {
      Alert.alert(
        "Création impossible",
        errorMessage(error, "Une erreur est survenue."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      visible={visible}
      title="Nouveau produit"
      subtitle="Publiez uniquement des informations réelles."
      onClose={onClose}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.modalScroll}
        showsVerticalScrollIndicator={false}
      >
        <Field
          label="Titre *"
          value={form.title}
          onChangeText={(value) => update("title", value)}
          placeholder="Nom du produit"
        />

        <Field
          label="Description"
          value={form.description}
          onChangeText={(value) => update("description", value)}
          placeholder="Décrivez précisément le produit"
          multiline
        />

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Field
              label="Prix *"
              value={form.price}
              onChangeText={(value) => update("price", value)}
              placeholder="15000"
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.column}>
            <Field
              label="Devise"
              value={form.currency}
              onChangeText={(value) => update("currency", value)}
              placeholder="XAF / USD / EUR..."
            />
          </View>
        </View>

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Field
              label="Stock *"
              value={form.stock}
              onChangeText={(value) => update("stock", value)}
              placeholder="50"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.column}>
            <Field
              label="Unité"
              value={form.unit}
              onChangeText={(value) => update("unit", value)}
              placeholder="pièce"
            />
          </View>
        </View>

        <Field
          label="Catégorie *"
          value={form.category}
          onChangeText={(value) => update("category", value)}
          placeholder="Mode, Tech, Alimentation..."
        />

        <Field
          label="Images"
          value={form.images}
          onChangeText={(value) => update("images", value)}
          placeholder="URL 1, URL 2, URL 3..."
          multiline
        />

        <Field
          label="Tags"
          value={form.tags}
          onChangeText={(value) => update("tags", value)}
          placeholder="premium, local, handmade..."
        />

        <Field
          label="Localisation"
          value={form.location}
          onChangeText={(value) => update("location", value)}
          placeholder="Ville / région / pays"
        />

        <View style={styles.toggleGroup}>
          <Toggle
            label="Livraison disponible"
            value={form.deliveryAvailable}
            onChange={(value) => update("deliveryAvailable", value)}
          />

          <Toggle
            label="Produit numérique"
            value={form.isDigital}
            onChange={(value) => update("isDigital", value)}
          />
        </View>

        <Pressable
          onPress={submit}
          disabled={submitting}
          style={[styles.primaryButton, submitting && styles.buttonDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Plus size={18} color="#FFFFFF" />
          )}

          <Text style={styles.primaryButtonText}>
            {submitting ? "Création..." : "Créer le produit"}
          </Text>
        </Pressable>
      </ScrollView>
    </ModalShell>
  );
}

function ProductEditModal({
  product,
  visible,
  onClose,
}: {
  product: Product | null;
  visible: boolean;
  onClose: () => void;
}) {
  const updateProduct = useMutation(api.commerce.updateProduct);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<EditProductForm>({
    title: product?.title ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    stock: product ? String(product.stock) : "",
    status: product?.status ?? "active",
    images: product?.images.join(", ") ?? "",
  });

  const syncFromProduct = () => {
    if (!product) return;

    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status,
      images: product.images.join(", "),
    });
  };

  const submit = async () => {
    if (!product) return;

    const title = form.title.trim();
    const description = form.description.trim();
    const price = Number(form.price.replace(",", "."));
    const stock = Number(form.stock);

    if (!title) {
      Alert.alert("Produit", "Le titre est obligatoire.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      Alert.alert("Produit", "Prix invalide.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      Alert.alert("Produit", "Stock invalide.");
      return;
    }

    setSubmitting(true);

    try {
      await updateProduct({
        id: product._id,
        title,
        description,
        price,
        stock,
        status: form.status,
        images: form.images
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      });

      Alert.alert(
        "Produit mis à jour",
        "Les modifications ont été enregistrées.",
      );

      onClose();
    } catch (error) {
      Alert.alert(
        "Modification impossible",
        errorMessage(error, "Une erreur est survenue."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      visible={visible}
      title="Modifier le produit"
      subtitle={product?.title ? product.title : "Modification"}
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={styles.modalScroll}
        showsVerticalScrollIndicator={false}
      >
        <Field
          label="Titre"
          value={form.title}
          onChangeText={(value) =>
            setForm((current) => ({
              ...current,
              title: value,
            }))
          }
        />

        <Field
          label="Description"
          value={form.description}
          onChangeText={(value) =>
            setForm((current) => ({
              ...current,
              description: value,
            }))
          }
          multiline
        />

        <View style={styles.twoColumns}>
          <View style={styles.column}>
            <Field
              label="Prix"
              value={form.price}
              onChangeText={(value) =>
                setForm((current) => ({
                  ...current,
                  price: value,
                }))
              }
              keyboardType="decimal-pad"
            />
          </View>

          <View style={styles.column}>
            <Field
              label="Stock"
              value={form.stock}
              onChangeText={(value) =>
                setForm((current) => ({
                  ...current,
                  stock: value,
                }))
              }
              keyboardType="numeric"
            />
          </View>
        </View>

        <Field
          label="Images"
          value={form.images}
          onChangeText={(value) =>
            setForm((current) => ({
              ...current,
              images: value,
            }))
          }
          multiline
        />

        <Text style={styles.fieldLabel}>Statut</Text>

        <View style={styles.statusSelector}>
          {(
            [
              ["active", "Actif"],
              ["out_of_stock", "Rupture"],
              ["archived", "Archivé"],
            ] as const
          ).map(([value, label]) => {
            const selected = form.status === value;

            return (
              <Pressable
                key={value}
                onPress={() =>
                  setForm((current) => ({
                    ...current,
                    status: value,
                  }))
                }
                style={[
                  styles.statusOption,
                  selected && styles.statusOptionActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    selected && styles.statusOptionTextActive,
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.editActions}>
          <Pressable
            onPress={() => {
              syncFromProduct();
              onClose();
            }}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>Annuler</Text>
          </Pressable>

          <Pressable
            onPress={submit}
            disabled={submitting}
            style={[
              styles.primaryButton,
              styles.flexButton,
              submitting && styles.buttonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Check size={17} color="#FFFFFF" />
            )}

            <Text style={styles.primaryButtonText}>Enregistrer</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ModalShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>

      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ProductCard({
  product,
  onEdit,
  onArchive,
  onReactivate,
}: {
  product: Product;
  onEdit: () => void;
  onArchive: () => void;
  onReactivate: () => void;
}) {
  const image = product.images[0];

  const statusColor =
    product.status === "active"
      ? COLORS.green
      : product.status === "out_of_stock"
        ? COLORS.red
        : COLORS.dim;

  const statusLabel =
    product.status === "active"
      ? "Actif"
      : product.status === "out_of_stock"
        ? "Rupture"
        : "Archivé";

  return (
    <View style={styles.productCard}>
      <View style={styles.productTop}>
        <View style={styles.productImage}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.productImageFill}
              resizeMode="cover"
              accessibilityLabel={product.title}
            />
          ) : (
            <ImageIcon size={24} color={COLORS.dim} />
          )}
        </View>

        <View style={styles.productIdentity}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <Text style={styles.productCategory}>{product.category}</Text>

          <Text style={styles.productPrice}>
            {formatAmount(product.price, product.currency)}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: `${statusColor}20`,
            },
          ]}
        >
          <Text style={[styles.statusBadgeText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.productMetrics}>
        <View style={styles.metric}>
          <Package size={14} color={COLORS.green} />
          <Text style={styles.metricValue}>{product.stock}</Text>
          <Text style={styles.metricLabel}>stock</Text>
        </View>

        <View style={styles.metric}>
          <Tag size={14} color={COLORS.purple} />
          <Text style={styles.metricValue} numberOfLines={1}>
            {product.category}
          </Text>
          <Text style={styles.metricLabel}>catégorie</Text>
        </View>

        <View style={styles.metric}>
          <Truck size={14} color={COLORS.primary} />
          <Text style={styles.metricValue}>
            {product.deliveryAvailable ? "Oui" : "Non"}
          </Text>
          <Text style={styles.metricLabel}>livraison</Text>
        </View>
      </View>

      <View style={styles.productActions}>
        <Pressable onPress={onEdit} style={styles.actionButton}>
          <Edit3 size={15} color="#CBD5E1" />
          <Text style={styles.actionText}>Modifier</Text>
        </Pressable>

        {product.status === "active" ? (
          <Pressable onPress={onArchive} style={styles.actionButton}>
            <Text style={styles.actionText}>Archiver</Text>
          </Pressable>
        ) : product.status === "archived" ? (
          <Pressable
            onPress={onReactivate}
            style={[styles.actionButton, styles.reactivateButton]}
          >
            <RefreshCw size={14} color={COLORS.green} />
            <Text style={[styles.actionText, { color: COLORS.green }]}>
              Réactiver
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function OrderCard({
  order,
  onUpdateStatus,
}: {
  order: SellerOrder;
  onUpdateStatus: (
    status: "confirmed" | "shipped" | "delivered" | "cancelled",
  ) => void;
}) {
  const config = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderProduct} numberOfLines={2}>
            {order.product?.title ?? "Produit indisponible"}
          </Text>

          <Text style={styles.orderBuyer}>
            {order.counterpartName ?? "Acheteur"}
          </Text>
        </View>

        <View
          style={[
            styles.orderStatus,
            {
              backgroundColor: `${config.color}20`,
            },
          ]}
        >
          <Text style={[styles.orderStatusText, { color: config.color }]}>
            {config.label}
          </Text>
        </View>
      </View>

      <View style={styles.orderGrid}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoLabel}>Montant</Text>

          <Text style={styles.orderInfoValue}>
            {formatAmount(order.totalAmount, order.currency)}
          </Text>
        </View>

        <View style={styles.orderInfo}>
          <Text style={styles.orderInfoLabel}>Quantité</Text>

          <Text style={styles.orderInfoValue}>
            {order.quantity} {order.product?.unit ?? "unité(s)"}
          </Text>
        </View>
      </View>

      {order.deliveryAddress ? (
        <View style={styles.addressBox}>
          <Truck size={15} color={COLORS.primary} />

          <Text style={styles.addressText}>{order.deliveryAddress}</Text>
        </View>
      ) : null}

      {order.note ? (
        <Text style={styles.orderNote}>Note : {order.note}</Text>
      ) : null}

      {order.status === "pending" ? (
        <View style={styles.orderActions}>
          <Pressable
            onPress={() => onUpdateStatus("confirmed")}
            style={styles.primarySmallButton}
          >
            <Check size={15} color="#FFFFFF" />
            <Text style={styles.smallButtonText}>Confirmer</Text>
          </Pressable>

          <Pressable
            onPress={() => onUpdateStatus("cancelled")}
            style={styles.dangerSmallButton}
          >
            <Text style={[styles.smallButtonText, { color: COLORS.red }]}>
              Annuler
            </Text>
          </Pressable>
        </View>
      ) : null}

      {order.status === "confirmed" ? (
        <Pressable
          onPress={() => onUpdateStatus("shipped")}
          style={styles.primaryFullButton}
        >
          <Truck size={16} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Marquer comme expédiée</Text>
        </Pressable>
      ) : null}

      {order.status === "shipped" ? (
        <Pressable
          onPress={() => onUpdateStatus("delivered")}
          style={styles.primaryFullButton}
        >
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.smallButtonText}>Marquer comme livrée</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>{icon}</View>

      <Text style={styles.emptyTitle}>{title}</Text>

      <Text style={styles.emptyDescription}>{description}</Text>

      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyAction}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function MarketplaceProInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>("dashboard");

  const [showCreate, setShowCreate] = useState(false);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [productSearch, setProductSearch] = useState("");

  const [orderSearch, setOrderSearch] = useState("");

  const [orderFilter, setOrderFilter] = useState<"all" | OrderStatus>("all");

  const [mutationId, setMutationId] = useState<string | null>(null);

  const currentUser = useQuery(api.users.getCurrentUser, {});

  const productsQuery = usePaginatedQuery(
    api.commerce.listProducts,
    currentUser?._id
      ? {
          sellerId: currentUser._id,
        }
      : "skip",
    {
      initialNumItems: 50,
    },
  );

  const orders = useQuery(api.commerce.getMyOrders, {
    role: "seller",
  }) as SellerOrder[] | undefined;

  const updateProduct = useMutation(api.commerce.updateProduct);

  const updateOrderStatus = useMutation(api.commerce.updateOrderStatus);

  const products = (productsQuery.results ?? []) as Product[];

  const isProductsLoading = productsQuery.isLoading;

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();

    if (!query) return products;

    return products.filter((product) => {
      return (
        product.title.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const query = orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const statusMatch = orderFilter === "all" || order.status === orderFilter;

      const searchMatch =
        !query ||
        (order.product?.title ?? "").toLowerCase().includes(query) ||
        (order.counterpartName ?? "").toLowerCase().includes(query);

      return statusMatch && searchMatch;
    });
  }, [orders, orderFilter, orderSearch]);

  const deliveredOrders =
    orders?.filter((order) => order.status === "delivered") ?? [];

  const pendingOrders =
    orders?.filter(
      (order) =>
        order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "shipped",
    ) ?? [];

  const activeProducts = products.filter(
    (product) => product.status === "active",
  );

  const totalRevenueByCurrency = useMemo(() => {
    const map = new Map<string, number>();

    for (const order of deliveredOrders) {
      map.set(
        order.currency,
        (map.get(order.currency) ?? 0) + order.totalAmount,
      );
    }

    return Array.from(map.entries()).map(([currency, amount]) => ({
      currency,
      amount,
    }));
  }, [deliveredOrders]);

  const primaryRevenue = totalRevenueByCurrency[0];

  const updateOrder = async (
    orderId: Id<"orders">,
    status: "confirmed" | "shipped" | "delivered" | "cancelled",
  ) => {
    const operationId = `order:${String(orderId)}`;

    setMutationId(operationId);

    try {
      await updateOrderStatus({
        id: orderId,
        status,
      });
    } catch (error) {
      Alert.alert(
        "Commande",
        errorMessage(error, "Impossible de mettre à jour la commande."),
      );
    } finally {
      setMutationId(null);
    }
  };

  const archiveProduct = (product: Product) => {
    Alert.alert(
      "Archiver le produit",
      `Voulez-vous archiver « ${product.title} » ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Archiver",
          style: "destructive",
          onPress: async () => {
            const operationId = `product:${String(product._id)}`;

            setMutationId(operationId);

            try {
              await updateProduct({
                id: product._id,
                status: "archived",
              });
            } catch (error) {
              Alert.alert(
                "Produit",
                errorMessage(error, "Impossible d'archiver le produit."),
              );
            } finally {
              setMutationId(null);
            }
          },
        },
      ],
    );
  };

  const reactivateProduct = async (product: Product) => {
    const operationId = `product:${String(product._id)}`;

    setMutationId(operationId);

    try {
      await updateProduct({
        id: product._id,
        status: "active",
      });
    } catch (error) {
      Alert.alert(
        "Produit",
        errorMessage(error, "Impossible de réactiver le produit."),
      );
    } finally {
      setMutationId(null);
    }
  };

  const renderDashboard = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroAccent} />

          <View style={styles.heroContent}>
            <Text style={styles.eyebrow}>PERFORMANCE VENDEUR</Text>

            <Text style={styles.heroTitle}>
              Votre boutique,
              {"\n"}
              vos performances.
            </Text>

            <Text style={styles.heroDescription}>
              Les chiffres affichés ici proviennent directement des produits et
              commandes associés à votre compte.
            </Text>

            <View style={styles.heroMetrics}>
              <View>
                <Text style={styles.heroMetricLabel}>Commandes livrées</Text>

                <Text style={styles.heroMetricValue}>
                  {deliveredOrders.length}
                </Text>
              </View>

              <View>
                <Text style={styles.heroMetricLabel}>Commandes en cours</Text>

                <Text style={styles.heroMetricValue}>
                  {pendingOrders.length}
                </Text>
              </View>
            </View>

            {primaryRevenue ? (
              <View style={styles.revenueBlock}>
                <Text style={styles.heroMetricLabel}>
                  Chiffre d'affaires livré
                </Text>

                <Text style={styles.revenueValue}>
                  {formatAmount(primaryRevenue.amount, primaryRevenue.currency)}
                </Text>

                {totalRevenueByCurrency.length > 1 ? (
                  <Text style={styles.multiCurrencyNotice}>
                    Plusieurs devises sont présentes dans vos commandes. Elles
                    ne sont pas converties artificiellement.
                  </Text>
                ) : null}
              </View>
            ) : (
              <Text style={styles.noRevenue}>
                Aucun chiffre d'affaires livré enregistré pour le moment.
              </Text>
            )}
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon={<Package size={18} color={COLORS.primary} />}
            label="Produits"
            value={String(products.length)}
            color={COLORS.primary}
          />

          <StatCard
            icon={<Check size={18} color={COLORS.green} />}
            label="Produits actifs"
            value={String(activeProducts.length)}
            color={COLORS.green}
          />

          <StatCard
            icon={<ShoppingBag size={18} color={COLORS.purple} />}
            label="Commandes"
            value={String(orders?.length ?? 0)}
            color={COLORS.purple}
          />

          <StatCard
            icon={<Clock3 size={18} color={COLORS.orange} />}
            label="À traiter"
            value={String(pendingOrders.length)}
            color={COLORS.orange}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Activité récente</Text>

            <Text style={styles.sectionSubtitle}>
              Vos dernières commandes vendeur
            </Text>
          </View>

          <Pressable
            onPress={() => setTab("commandes")}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>Voir tout</Text>

            <ChevronRight size={15} color={COLORS.primary} />
          </Pressable>
        </View>

        {orders === undefined ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des commandes...</Text>
          </View>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={26} color={COLORS.dim} />}
            title="Aucune commande"
            description="Les commandes de vos clients apparaîtront ici."
          />
        ) : (
          <View style={styles.recentOrders}>
            {orders.slice(0, 4).map((order) => {
              const config = ORDER_STATUS[order.status];

              return (
                <View key={String(order._id)} style={styles.recentOrderRow}>
                  <View style={styles.recentOrderIcon}>
                    <ShoppingBag size={15} color={COLORS.primary} />
                  </View>

                  <View style={styles.recentOrderIdentity}>
                    <Text style={styles.recentOrderTitle} numberOfLines={1}>
                      {order.product?.title ?? "Produit indisponible"}
                    </Text>

                    <Text style={styles.recentOrderSubtitle}>
                      {order.counterpartName ?? "Acheteur"}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.recentOrderStatus,
                      {
                        color: config.color,
                      },
                    ]}
                  >
                    {config.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.trustCard}>
          <TrendingUp size={18} color={COLORS.green} />

          <View style={styles.trustTextBlock}>
            <Text style={styles.trustTitle}>Données réelles</Text>

            <Text style={styles.trustDescription}>
              Aucun graphique synthétique ni pourcentage inventé n'est utilisé
              dans ce tableau de bord.
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderProducts = () => {
    return (
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Mes produits</Text>

            <Text style={styles.sectionSubtitle}>
              Catalogue vendeur connecté à Convex
            </Text>
          </View>

          <Pressable
            onPress={() => setShowCreate(true)}
            style={styles.roundPrimaryButton}
          >
            <Plus size={18} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <Search size={17} color={COLORS.dim} />

          <TextInput
            value={productSearch}
            onChangeText={setProductSearch}
            placeholder="Rechercher un produit..."
            placeholderTextColor="#64748B"
            style={styles.searchInput}
          />
        </View>

        {isProductsLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des produits...</Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package size={28} color={COLORS.dim} />}
            title={productSearch ? "Aucun résultat" : "Aucun produit"}
            description={
              productSearch
                ? "Aucun produit ne correspond à votre recherche."
                : "Créez votre premier produit pour commencer à vendre."
            }
            actionLabel={productSearch ? undefined : "Créer un produit"}
            onAction={productSearch ? undefined : () => setShowCreate(true)}
          />
        ) : (
          <>
            {filteredProducts.map((product) => {
              const busy = mutationId === `product:${String(product._id)}`;

              return (
                <View
                  key={String(product._id)}
                  style={busy ? styles.busyProduct : undefined}
                >
                  <ProductCard
                    product={product}
                    onEdit={() => setEditingProduct(product)}
                    onArchive={() => archiveProduct(product)}
                    onReactivate={() => reactivateProduct(product)}
                  />

                  {busy ? (
                    <View style={styles.busyOverlay}>
                      <ActivityIndicator color="#FFFFFF" />
                    </View>
                  ) : null}
                </View>
              );
            })}

            {productsQuery.status === "CanLoadMore" ? (
              <Pressable
                onPress={() => productsQuery.loadMore(50)}
                style={styles.secondaryButton}
              >
                <Text style={styles.secondaryButtonText}>Charger plus</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    );
  };

  const renderOrders = () => {
    const filters: Array<"all" | OrderStatus> = [
      "all",
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ];

    return (
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Commandes</Text>

            <Text style={styles.sectionSubtitle}>
              Gérez les commandes reçues
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {filters.map((filter) => {
            const selected = orderFilter === filter;

            const count =
              filter === "all"
                ? (orders?.length ?? 0)
                : (orders?.filter((order) => order.status === filter).length ??
                  0);

            return (
              <Pressable
                key={filter}
                onPress={() => setOrderFilter(filter)}
                style={[styles.filterChip, selected && styles.filterChipActive]}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter === "all" ? "Toutes" : ORDER_STATUS[filter].label}
                </Text>

                <Text
                  style={[
                    styles.filterCount,
                    selected && styles.filterCountActive,
                  ]}
                >
                  {count}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.searchBox}>
          <Search size={17} color={COLORS.dim} />

          <TextInput
            value={orderSearch}
            onChangeText={setOrderSearch}
            placeholder="Rechercher une commande..."
            placeholderTextColor="#64748B"
            style={styles.searchInput}
          />
        </View>

        {orders === undefined ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Chargement des commandes...</Text>
          </View>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} color={COLORS.dim} />}
            title="Aucune commande trouvée"
            description="Aucune commande ne correspond aux critères sélectionnés."
          />
        ) : (
          filteredOrders.map((order) => {
            const busy = mutationId === `order:${String(order._id)}`;

            return (
              <View
                key={String(order._id)}
                style={busy ? styles.busyProduct : undefined}
              >
                <OrderCard
                  order={order}
                  onUpdateStatus={(status) => updateOrder(order._id, status)}
                />

                {busy ? (
                  <View style={styles.busyOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerIdentity}>
          <Text style={styles.headerTitle}>Marketplace Pro</Text>

          <Text style={styles.headerSubtitle}>Espace vendeur</Text>
        </View>

        <Pressable
          onPress={() => setShowCreate(true)}
          style={styles.headerProductButton}
        >
          <Plus size={15} color="#FFFFFF" />

          <Text style={styles.headerProductText}>Produit</Text>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <TabButton
          active={tab === "dashboard"}
          icon={
            <BarChart3
              size={16}
              color={tab === "dashboard" ? "#FFFFFF" : COLORS.muted}
            />
          }
          label="Dashboard"
          onPress={() => setTab("dashboard")}
        />

        <TabButton
          active={tab === "produits"}
          icon={
            <Package
              size={16}
              color={tab === "produits" ? "#FFFFFF" : COLORS.muted}
            />
          }
          label="Produits"
          onPress={() => setTab("produits")}
        />

        <TabButton
          active={tab === "commandes"}
          icon={
            <ShoppingBag
              size={16}
              color={tab === "commandes" ? "#FFFFFF" : COLORS.muted}
            />
          }
          label="Commandes"
          onPress={() => setTab("commandes")}
        />
      </View>

      <View style={styles.content}>
        {tab === "dashboard"
          ? renderDashboard()
          : tab === "produits"
            ? renderProducts()
            : renderOrders()}
      </View>

      <ProductFormModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setTab("produits");
        }}
      />

      <ProductEditModal
        visible={editingProduct !== null}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
      />
    </View>
  );
}

function TabButton({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tabButton, active && styles.tabButtonActive]}
    >
      {icon}

      <Text
        style={[styles.tabButtonText, active && styles.tabButtonTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function MarketplaceProPage({ onBack }: { onBack: () => void }) {
  const { isAuthenticated, loading } = useFirebaseAuth();

  if (loading) {
    return (
      <View style={styles.authState}>
        <ActivityIndicator size="large" color={COLORS.primary} />

        <Text style={styles.authStateTitle}>Chargement de votre boutique</Text>

        <Text style={styles.authStateDescription}>
          Vérification de votre session...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.authState}>
        <View style={styles.authIcon}>
          <ShoppingBag size={34} color={COLORS.primary} />
        </View>

        <Text style={styles.authStateTitle}>Espace vendeur</Text>

        <Text style={styles.authStateDescription}>
          Connectez-vous pour accéder à votre catalogue et gérer vos commandes.
        </Text>

        <Pressable
          onPress={() => {
            Alert.alert(
              "Connexion requise",
              "Veuillez utiliser le parcours de connexion de votre application pour accéder à l'espace vendeur.",
            );
          }}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>Se connecter</Text>
        </Pressable>

        <Pressable onPress={onBack} style={styles.backTextButton}>
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return <MarketplaceProInner onBack={onBack} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  headerIdentity: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: COLORS.dim,
    fontSize: 11,
    marginTop: 2,
  },

  headerProductButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },

  headerProductText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  tabs: {
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },

  tabButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },

  tabButtonText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  tabButtonTextActive: {
    color: "#FFFFFF",
  },

  content: {
    flex: 1,
  },

  pageContent: {
    padding: 16,
    paddingBottom: 40,
  },

  heroCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.25)",
    marginBottom: 14,
  },

  heroAccent: {
    height: 4,
    backgroundColor: COLORS.primary,
  },

  heroContent: {
    padding: 20,
  },

  eyebrow: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 9,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    lineHeight: 33,
    fontWeight: "900",
  },

  heroDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 10,
  },

  heroMetrics: {
    flexDirection: "row",
    gap: 40,
    marginTop: 22,
  },

  heroMetricLabel: {
    color: COLORS.dim,
    fontSize: 10,
    marginBottom: 4,
  },

  heroMetricValue: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },

  revenueBlock: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSoft,
  },

  revenueValue: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "900",
  },

  multiCurrencyNotice: {
    color: COLORS.orange,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  noRevenue: {
    color: COLORS.dim,
    fontSize: 11,
    marginTop: 18,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  statCard: {
    width: "48%",
    flexGrow: 1,
    minWidth: 145,
    padding: 14,
    borderRadius: 17,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  sectionSubtitle: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 3,
  },

  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  linkText: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "800",
  },

  recentOrders: {
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    overflow: "hidden",
  },

  recentOrderRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },

  recentOrderIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,99,235,0.13)",
  },

  recentOrderIdentity: {
    flex: 1,
    marginHorizontal: 10,
  },

  recentOrderTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  recentOrderSubtitle: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 3,
  },

  recentOrderStatus: {
    fontSize: 9,
    fontWeight: "900",
  },

  trustCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: "rgba(16,185,129,0.06)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.14)",
  },

  trustTextBlock: {
    flex: 1,
  },

  trustTitle: {
    color: "#D1FAE5",
    fontSize: 12,
    fontWeight: "900",
  },

  trustDescription: {
    color: "#94A3B8",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  searchBox: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 13,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 12,
    minHeight: 42,
  },

  productCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 19,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  productTop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  productImage: {
    width: 62,
    height: 62,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  productImageFill: {
    width: "100%",
    height: "100%",
  },

  productIdentity: {
    flex: 1,
    marginLeft: 11,
    paddingRight: 8,
  },

  productTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },

  productCategory: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 3,
  },

  productPrice: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 7,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },

  statusBadgeText: {
    fontSize: 9,
    fontWeight: "900",
  },

  productMetrics: {
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
  },

  metric: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  metricValue: {
    maxWidth: "95%",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    marginTop: 4,
  },

  metricLabel: {
    color: COLORS.dim,
    fontSize: 8,
    marginTop: 2,
  },

  productActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  actionButton: {
    flex: 1,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  actionText: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
  },

  reactivateButton: {
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  busyProduct: {
    position: "relative",
  },

  busyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  filterRow: {
    gap: 7,
    paddingBottom: 11,
  },

  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  filterCount: {
    color: COLORS.dim,
    fontSize: 9,
    fontWeight: "900",
  },

  filterCountActive: {
    color: "#DBEAFE",
  },

  orderCard: {
    padding: 14,
    marginBottom: 11,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  orderHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  orderIdentity: {
    flex: 1,
    paddingRight: 10,
  },

  orderProduct: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
    lineHeight: 18,
  },

  orderBuyer: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 4,
  },

  orderStatus: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },

  orderStatusText: {
    fontSize: 9,
    fontWeight: "900",
  },

  orderGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 13,
  },

  orderInfo: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  orderInfoLabel: {
    color: COLORS.dim,
    fontSize: 9,
  },

  orderInfoValue: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    marginTop: 4,
  },

  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.06)",
  },

  addressText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 15,
  },

  orderNote: {
    color: COLORS.dim,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 9,
  },

  orderActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },

  primarySmallButton: {
    flex: 1,
    minHeight: 39,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  dangerSmallButton: {
    minHeight: 39,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(239,68,68,0.08)",
  },

  primaryFullButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 45,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    marginBottom: 13,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  emptyDescription: {
    color: COLORS.dim,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 5,
  },

  emptyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: COLORS.primary,
  },

  emptyActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  loadingCard: {
    minHeight: 150,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 18,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  loadingText: {
    color: COLORS.dim,
    fontSize: 11,
  },

  roundPrimaryButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: COLORS.primary,
  },

  primaryButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  secondaryButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 4,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  secondaryButtonText: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "800",
  },

  flexButton: {
    flex: 1,
    marginTop: 0,
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalKeyboard: {
    width: "100%",
    maxHeight: "92%",
  },

  modalCard: {
    maxHeight: "100%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#090D1C",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
  },

  modalTitleBlock: {
    flex: 1,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: COLORS.dim,
    fontSize: 10,
    marginTop: 3,
  },

  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  modalScroll: {
    padding: 18,
    paddingBottom: 34,
  },

  field: {
    marginBottom: 13,
  },

  fieldLabel: {
    color: "#CBD5E1",
    fontSize: 10,
    fontWeight: "800",
    marginBottom: 6,
  },

  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    color: "#FFFFFF",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  multilineInput: {
    minHeight: 90,
    paddingTop: 11,
  },

  twoColumns: {
    flexDirection: "row",
    gap: 10,
  },

  column: {
    flex: 1,
  },

  toggleGroup: {
    gap: 10,
    marginBottom: 18,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  checkbox: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  toggleLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    fontWeight: "700",
  },

  statusSelector: {
    flexDirection: "row",
    gap: 7,
    marginTop: 7,
    marginBottom: 20,
  },

  statusOption: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },

  statusOptionActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  statusOptionText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
  },

  statusOptionTextActive: {
    color: "#FFFFFF",
  },

  editActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 4,
  },

  authState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    backgroundColor: COLORS.background,
  },

  authIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(37,99,235,0.10)",
    marginBottom: 18,
  },

  authStateTitle: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  authStateDescription: {
    color: COLORS.dim,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },

  backTextButton: {
    padding: 12,
    marginTop: 8,
  },

  backText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
});
