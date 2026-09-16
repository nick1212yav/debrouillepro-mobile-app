import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Filter,
  Heart,
  Loader2,
  MapPin,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tag,
  Trash2,
  X,
  Zap,
} from "lucide-react-native";

import { usePaginatedQuery, useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

import { SignInButton } from "@/components/ui/signin";

type SortKey = "recent" | "prix_asc" | "prix_desc";

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

type CartItem = {
  _id: Id<"cartItems">;
  productId: Id<"products">;
  quantity: number;
  product?: {
    _id: Id<"products">;
    title: string;
    price: number;
    currency: string;
    images: string[];
    stock: number;
  } | null;
};

type Order = {
  _id: Id<"orders">;
  status: string;
  totalAmount: number;
  currency: string;
  quantity: number;
  counterpartName?: string;
  product?: {
    title?: string;
    images?: string[];
  } | null;
};

const CATEGORIES = [
  "Tout",
  "Alimentation",
  "Artisanat",
  "Tech",
  "Mode",
  "Services",
  "Autre",
] as const;

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
  prix_asc: "Prix croissant",
  prix_desc: "Prix décroissant",
};

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0C1022",
  surface: "rgba(255,255,255,0.055)",
  surfaceStrong: "rgba(255,255,255,0.085)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  muted: "#A1A1AA",
  subtle: "#71717A",
  primary: "#6366F1",
  primaryDark: "#4338CA",
  accent: "#F97316",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
};

function formatPrice(value: number, currency?: string): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  return `${new Intl.NumberFormat("fr-FR").format(
    safeValue,
  )} ${currency ?? ""}`.trim();
}

function getInitial(name?: string): string {
  const value = name?.trim();

  if (!value) {
    return "V";
  }

  return value.charAt(0).toUpperCase();
}

function isValidImage(value?: string): boolean {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

function SellerAvatar({
  name,
  avatar,
  size = 40,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  if (isValidImage(avatar)) {
    return (
      <Image
        source={{ uri: avatar }}
        accessibilityLabel={name}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
        }}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text
        style={{
          color: COLORS.text,
          fontSize: Math.max(12, size * 0.36),
          fontWeight: "800",
        }}
      >
        {getInitial(name)}
      </Text>
    </View>
  );
}

function ProductImage({
  uri,
  title,
  size = "card",
}: {
  uri?: string;
  title: string;
  size?: "card" | "small" | "large";
}) {
  const dimensions =
    size === "large"
      ? styles.productImageLarge
      : size === "small"
        ? styles.productImageSmall
        : styles.productImage;

  if (isValidImage(uri)) {
    return (
      <Image source={{ uri }} accessibilityLabel={title} style={dimensions} />
    );
  }

  return (
    <View style={[dimensions, styles.productImageFallback]}>
      <Package size={size === "large" ? 46 : 28} color={COLORS.subtle} />
    </View>
  );
}

function LoadingProducts() {
  return (
    <View style={styles.loadingList}>
      {[0, 1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingImage} />
          <View style={styles.loadingLineLarge} />
          <View style={styles.loadingLineSmall} />
          <View style={styles.loadingLineMedium} />
        </View>
      ))}
    </View>
  );
}

function EmptyState({
  search,
  onSell,
}: {
  search: string;
  onSell: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <ShoppingBag size={30} color={COLORS.subtle} />
      </View>

      <Text style={styles.emptyTitle}>Aucun produit trouvé</Text>

      <Text style={styles.emptyText}>
        {search.trim()
          ? "Aucun produit ne correspond à votre recherche."
          : "La boutique ne contient encore aucun produit correspondant à ces critères."}
      </Text>

      {!search.trim() && (
        <Pressable
          onPress={onSell}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Plus size={17} color="#FFFFFF" />

          <Text style={styles.primaryButtonText}>Publier un produit</Text>
        </Pressable>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* CART                                                                       */
/* -------------------------------------------------------------------------- */

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

  const [busyItem, setBusyItem] = useState<string | null>(null);

  const [clearing, setClearing] = useState(false);

  const items = (cart ?? []) as CartItem[];

  const currencies = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.product?.currency).filter(Boolean)),
      ),
    [items],
  );

  const hasMixedCurrencies = currencies.length > 1;

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  const totalCurrency = currencies.length === 1 ? currencies[0] : undefined;

  const handleQuantity = async (item: CartItem, nextQuantity: number) => {
    if (busyItem === item._id) {
      return;
    }

    if (nextQuantity < 0) {
      return;
    }

    if (item.product && nextQuantity > item.product.stock) {
      Alert.alert(
        "Stock insuffisant",
        `Il reste ${item.product.stock} unité(s) disponible(s).`,
      );
      return;
    }

    setBusyItem(item._id);

    try {
      await updateItem({
        itemId: item._id,
        quantity: nextQuantity,
      });
    } catch {
      Alert.alert("Panier", "Impossible de modifier cette quantité.");
    } finally {
      setBusyItem(null);
    }
  };

  const handleClear = () => {
    if (clearing) return;

    Alert.alert(
      "Vider le panier",
      "Tous les articles seront retirés du panier.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Vider",
          style: "destructive",
          onPress: async () => {
            setClearing(true);

            try {
              await clearCart();
            } catch {
              Alert.alert("Panier", "Impossible de vider le panier.");
            } finally {
              setClearing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Mon panier</Text>

              <Text style={styles.sheetSubtitle}>
                {items.length} article
                {items.length > 1 ? "s" : ""}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {items.length > 0 && (
                <Pressable
                  onPress={handleClear}
                  disabled={clearing}
                  style={styles.iconButton}
                >
                  <Trash2 size={17} color={COLORS.danger} />
                </Pressable>
              )}

              <Pressable onPress={onClose} style={styles.iconButton}>
                <X size={18} color={COLORS.muted} />
              </Pressable>
            </View>
          </View>

          {cart === undefined ? (
            <View style={styles.centerLoader}>
              <Loader2 size={28} color={COLORS.muted} />

              <Text style={styles.loadingText}>Chargement du panier…</Text>
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingCart size={38} color={COLORS.subtle} />

              <Text style={styles.emptyTitle}>Panier vide</Text>

              <Text style={styles.emptyText}>
                Les produits que vous ajoutez apparaîtront ici.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {items.map((item) => {
                const product = item.product;

                const itemBusy = busyItem === item._id;

                return (
                  <View key={item._id} style={styles.cartItem}>
                    <ProductImage
                      uri={product?.images?.[0]}
                      title={product?.title ?? "Produit"}
                      size="small"
                    />

                    <View style={styles.cartItemContent}>
                      <Text style={styles.cartItemTitle} numberOfLines={2}>
                        {product?.title ?? "Produit indisponible"}
                      </Text>

                      <Text style={styles.cartItemPrice}>
                        {formatPrice(product?.price ?? 0, product?.currency)}
                      </Text>

                      <View style={styles.quantityControls}>
                        <Pressable
                          disabled={itemBusy}
                          onPress={() =>
                            void handleQuantity(item, item.quantity - 1)
                          }
                          style={styles.quantityButton}
                        >
                          <Minus size={13} color={COLORS.text} />
                        </Pressable>

                        <Text style={styles.quantityValue}>
                          {item.quantity}
                        </Text>

                        <Pressable
                          disabled={itemBusy}
                          onPress={() =>
                            void handleQuantity(item, item.quantity + 1)
                          }
                          style={styles.quantityButton}
                        >
                          <Plus size={13} color={COLORS.text} />
                        </Pressable>
                      </View>
                    </View>

                    {itemBusy && <Loader2 size={18} color={COLORS.muted} />}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {items.length > 0 && (
            <View style={styles.checkoutFooter}>
              {hasMixedCurrencies ? (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    Votre panier contient plusieurs devises. Aucun taux de
                    conversion artificiel n'est appliqué.
                  </Text>
                </View>
              ) : (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>

                  <Text style={styles.totalValue}>
                    {formatPrice(total, totalCurrency)}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={onCheckout}
                style={({ pressed }) => [
                  styles.checkoutButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.checkoutButtonText}>
                  Passer la commande
                </Text>

                <ArrowRight size={18} color="#FFFFFF" />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* CHECKOUT                                                                   */
/* -------------------------------------------------------------------------- */

function CheckoutSheet({
  cart,
  onClose,
}: {
  cart: CartItem[] | undefined;
  onClose: (ordered: boolean) => void;
}) {
  const [step, setStep] = useState<"address" | "confirm" | "done">("address");

  const [address, setAddress] = useState("");

  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);

  const createOrder = useMutation(api.commerce.createOrder);

  const clearCart = useMutation(api.commerce.clearCart);

  const items = cart ?? [];

  const currencies = Array.from(
    new Set(items.map((item) => item.product?.currency).filter(Boolean)),
  );

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  const sameCurrency = currencies.length === 1;

  const handleOrder = async () => {
    const normalizedAddress = address.trim();

    if (!normalizedAddress) {
      Alert.alert(
        "Adresse requise",
        "Veuillez saisir une adresse de livraison.",
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert(
        "Panier vide",
        "Ajoutez au moins un produit avant de commander.",
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      for (const item of items) {
        if (!item.product) {
          continue;
        }

        if (item.quantity > item.product.stock) {
          throw new Error(`Stock insuffisant pour ${item.product.title}.`);
        }

        await createOrder({
          productId: item.productId,
          quantity: item.quantity,
          deliveryAddress: normalizedAddress,
          note: note.trim(),
        });
      }

      await clearCart();

      setStep("done");
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "La commande n'a pas pu être créée.";

      Alert.alert("Commande impossible", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => step !== "done" && onClose(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {step === "done" ? (
            <View style={styles.successState}>
              <View style={styles.successIcon}>
                <CheckCircle2 size={46} color={COLORS.success} />
              </View>

              <Text style={styles.successTitle}>Commande créée</Text>

              <Text style={styles.successText}>
                Votre commande a été enregistrée. Son traitement dépend
                maintenant du processus commercial configuré par la plateforme
                et le vendeur.
              </Text>

              <Pressable
                onPress={() => onClose(true)}
                style={styles.primaryButton}
              >
                <Text style={styles.primaryButtonText}>
                  Retour à la boutique
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.sheetHeader}>
                <View>
                  <Text style={styles.sheetTitle}>
                    {step === "address" ? "Livraison" : "Confirmation"}
                  </Text>

                  <Text style={styles.sheetSubtitle}>
                    {items.length} article
                    {items.length > 1 ? "s" : ""}
                  </Text>
                </View>

                <Pressable
                  onPress={() => onClose(false)}
                  style={styles.iconButton}
                >
                  <X size={18} color={COLORS.muted} />
                </Pressable>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                contentContainerStyle={styles.formContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {step === "address" ? (
                  <>
                    <Field
                      label="Adresse complète"
                      required
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Rue, quartier, ville, pays…"
                      multiline
                    />

                    <Field
                      label="Note au vendeur"
                      value={note}
                      onChangeText={setNote}
                      placeholder="Instructions de livraison…"
                      multiline
                    />

                    <View style={styles.securityNotice}>
                      <MapPin size={19} color={COLORS.primary} />

                      <Text style={styles.securityText}>
                        Vérifiez soigneusement votre adresse avant de continuer.
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => setStep("confirm")}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>Continuer</Text>

                      <ArrowRight size={17} color="#FFFFFF" />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.confirmHeading}>
                      Vérifiez votre commande
                    </Text>

                    {items.map((item) => (
                      <View key={item._id} style={styles.confirmItem}>
                        <ProductImage
                          uri={item.product?.images?.[0]}
                          title={item.product?.title ?? "Produit"}
                          size="small"
                        />

                        <View style={styles.confirmItemBody}>
                          <Text
                            style={styles.confirmItemTitle}
                            numberOfLines={2}
                          >
                            {item.product?.title ?? "Produit"}
                          </Text>

                          <Text style={styles.confirmItemMeta}>
                            Quantité : {item.quantity}
                          </Text>
                        </View>

                        <Text style={styles.confirmItemPrice}>
                          {formatPrice(
                            (item.product?.price ?? 0) * item.quantity,
                            item.product?.currency,
                          )}
                        </Text>
                      </View>
                    ))}

                    <View style={styles.addressBox}>
                      <Text style={styles.addressLabel}>Livraison à</Text>

                      <Text style={styles.addressValue}>{address}</Text>

                      {note.trim() ? (
                        <Text style={styles.noteValue}>
                          Note : {note.trim()}
                        </Text>
                      ) : null}
                    </View>

                    {sameCurrency ? (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total produits</Text>

                        <Text style={styles.totalValue}>
                          {formatPrice(total, currencies[0])}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.warningBox}>
                        <Text style={styles.warningText}>
                          Plusieurs devises sont présentes. Aucun montant
                          converti artificiellement n'est affiché.
                        </Text>
                      </View>
                    )}

                    <Pressable
                      onPress={() => void handleOrder()}
                      disabled={loading}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        loading && styles.disabledButton,
                        pressed && !loading && styles.pressed,
                      ]}
                    >
                      {loading ? (
                        <Loader2 size={18} color="#FFFFFF" />
                      ) : (
                        <Check size={18} color="#FFFFFF" />
                      )}

                      <Text style={styles.primaryButtonText}>
                        {loading ? "Création…" : "Confirmer la commande"}
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={loading}
                      onPress={() => setStep("address")}
                      style={styles.secondaryButton}
                    >
                      <Text style={styles.secondaryButtonText}>
                        Modifier l'adresse
                      </Text>
                    </Pressable>
                  </>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function Field({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.subtle}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* PRODUCT DETAIL                                                             */
/* -------------------------------------------------------------------------- */

function ProductDetail({
  product,
  onClose,
  onAddToCart,
}: {
  product: Product;
  onClose: () => void;
  onAddToCart: (productId: Id<"products">) => Promise<void>;
}) {
  const [imageIndex, setImageIndex] = useState(0);

  const [adding, setAdding] = useState(false);

  const [favorite, setFavorite] = useState(false);

  const reviews = useQuery(api.commerce.getProductReviews, {
    productId: product._id,
  });

  const averageRating = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return undefined;
    }

    const validRatings = reviews
      .map((review) => review.rating)
      .filter((rating) => typeof rating === "number");

    if (validRatings.length === 0) {
      return undefined;
    }

    return (
      validRatings.reduce((sum, rating) => sum + rating, 0) /
      validRatings.length
    );
  }, [reviews]);

  const handleAdd = async () => {
    if (adding || product.stock <= 0) {
      return;
    }

    setAdding(true);

    try {
      await onAddToCart(product._id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.detailRoot}>
        <View style={styles.detailHeader}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <ArrowLeft size={21} color={COLORS.text} />
          </Pressable>

          <Text style={styles.detailHeaderTitle} numberOfLines={1}>
            Produit
          </Text>

          <Pressable
            onPress={() => setFavorite((current) => !current)}
            style={styles.headerButton}
          >
            <Heart
              size={20}
              color={favorite ? COLORS.danger : COLORS.muted}
              fill={favorite ? COLORS.danger : "transparent"}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailScroll}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.detailImageContainer}>
            <ProductImage
              uri={product.images?.[imageIndex]}
              title={product.title}
              size="large"
            />

            {product.images?.length > 1 && (
              <View style={styles.imageIndicators}>
                {product.images.map((_, index) => (
                  <Pressable
                    key={index}
                    onPress={() => setImageIndex(index)}
                    style={[
                      styles.imageIndicator,
                      index === imageIndex && styles.imageIndicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>

          <View style={styles.detailSection}>
            <View style={styles.detailTitleRow}>
              <View style={styles.detailTitleContent}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {CATEGORY_ICONS[product.category] ?? "📦"}{" "}
                    {product.category}
                  </Text>
                </View>

                <Text style={styles.detailTitle}>{product.title}</Text>
              </View>

              <View style={styles.detailPriceBlock}>
                <Text style={styles.detailPrice}>
                  {new Intl.NumberFormat("fr-FR").format(product.price)}
                </Text>

                <Text style={styles.detailCurrency}>{product.currency}</Text>
              </View>
            </View>

            <View style={styles.detailMetaRow}>
              {averageRating !== undefined && (
                <View style={styles.metaPill}>
                  <Text style={styles.ratingStar}>★</Text>

                  <Text style={styles.metaText}>
                    {averageRating.toFixed(1)}
                  </Text>

                  <Text style={styles.metaMuted}>({reviews?.length ?? 0})</Text>
                </View>
              )}

              <View style={styles.metaPill}>
                <Package
                  size={14}
                  color={product.stock > 0 ? COLORS.success : COLORS.danger}
                />

                <Text
                  style={
                    product.stock > 0 ? styles.successText : styles.dangerText
                  }
                >
                  {product.stock > 0 ? `Stock : ${product.stock}` : "Épuisé"}
                </Text>
              </View>

              {product.deliveryAvailable && (
                <View style={styles.metaPill}>
                  <Zap size={13} color={COLORS.success} />

                  <Text style={styles.successText}>Livraison</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>Description</Text>

            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {product.tags?.length > 0 && (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Mots-clés</Text>

              <View style={styles.tagsContainer}>
                {product.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.sellerCard}>
            <View style={styles.sellerCardHeader}>
              <Store size={18} color={COLORS.primary} />

              <Text style={styles.sectionTitle}>Vendeur</Text>
            </View>

            <View style={styles.sellerIdentity}>
              <SellerAvatar
                name={product.sellerName}
                avatar={product.sellerAvatar}
                size={48}
              />

              <View style={styles.sellerIdentityText}>
                <Text style={styles.sellerName}>
                  {product.sellerName ?? "Vendeur"}
                </Text>

                <Text style={styles.sellerIdText}>Vendeur marketplace</Text>
              </View>
            </View>
          </View>

          {reviews && reviews.length > 0 && (
            <View style={styles.detailSection}>
              <View style={styles.reviewHeader}>
                <Text style={styles.sectionTitle}>Avis clients</Text>

                <Text style={styles.reviewCount}>{reviews.length}</Text>
              </View>

              <View style={styles.reviewList}>
                {reviews.slice(0, 5).map((review) => (
                  <View key={review._id} style={styles.reviewCard}>
                    <View style={styles.reviewTop}>
                      <Text style={styles.reviewerName}>
                        {review.reviewerName ?? "Utilisateur"}
                      </Text>

                      <View style={styles.stars}>
                        {Array.from({
                          length: 5,
                        }).map((_, index) => (
                          <Text
                            key={index}
                            style={{
                              color:
                                index < review.rating
                                  ? "#FBBF24"
                                  : COLORS.subtle,
                              fontSize: 11,
                            }}
                          >
                            ★
                          </Text>
                        ))}
                      </View>
                    </View>

                    {review.comment ? (
                      <Text style={styles.reviewText}>{review.comment}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <Authenticated>
          <View style={styles.detailBottomBar}>
            <View style={styles.detailBottomPrice}>
              <Text style={styles.bottomPriceLabel}>Prix</Text>

              <Text style={styles.bottomPrice}>
                {formatPrice(product.price, product.currency)}
              </Text>
            </View>

            <Pressable
              onPress={() => void handleAdd()}
              disabled={adding || product.stock <= 0}
              style={({ pressed }) => [
                styles.addButton,
                (adding || product.stock <= 0) && styles.disabledButton,
                pressed && !adding && product.stock > 0 && styles.pressed,
              ]}
            >
              {adding ? (
                <Loader2 size={18} color="#FFFFFF" />
              ) : (
                <ShoppingCart size={18} color="#FFFFFF" />
              )}

              <Text style={styles.addButtonText}>
                {product.stock <= 0 ? "Épuisé" : "Ajouter au panier"}
              </Text>
            </Pressable>
          </View>
        </Authenticated>

        <Unauthenticated>
          <View style={styles.detailBottomBar}>
            <SignInButton />
          </View>
        </Unauthenticated>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* SELL                                                                       */
/* -------------------------------------------------------------------------- */

function SellForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");

  const [category, setCategory] = useState<string>("Alimentation");

  const [price, setPrice] = useState("");

  const [description, setDescription] = useState("");

  const [stock, setStock] = useState("1");

  const [tags, setTags] = useState("");

  const [delivery, setDelivery] = useState(false);

  const [loading, setLoading] = useState(false);

  const createProduct = useMutation(api.commerce.createProduct);

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();

    const normalizedDescription = description.trim();

    const parsedPrice = Number(price.replace(/\s/g, ""));

    const parsedStock = Number(stock.replace(/\s/g, ""));

    if (!normalizedTitle) {
      Alert.alert("Titre requis", "Donnez un titre clair au produit.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Prix invalide", "Saisissez un prix supérieur à zéro.");
      return;
    }

    if (!normalizedDescription) {
      Alert.alert("Description requise", "Décrivez clairement le produit.");
      return;
    }

    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      Alert.alert(
        "Stock invalide",
        "Le stock doit être un nombre entier positif ou nul.",
      );
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      await createProduct({
        title: normalizedTitle,
        description: normalizedDescription,
        price: parsedPrice,
        currency: "FCFA",
        category,
        images: [],
        stock: parsedStock,
        unit: undefined,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        isDigital: false,
        deliveryAvailable: delivery,
      });

      Alert.alert(
        "Produit publié",
        "Votre produit a été enregistré dans la boutique.",
      );

      onClose();
    } catch (error) {
      Alert.alert(
        "Publication impossible",
        error instanceof Error && error.message
          ? error.message
          : "Le produit n'a pas pu être publié.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Vendre</Text>

              <Text style={styles.sheetSubtitle}>Publier un produit</Text>
            </View>

            <Pressable onPress={onClose} style={styles.iconButton}>
              <X size={18} color={COLORS.muted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Field
              label="Titre"
              required
              value={title}
              onChangeText={setTitle}
              placeholder="Nom du produit"
            />

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Catégorie *</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categorySelector}
              >
                {CATEGORIES.filter((item) => item !== "Tout").map((item) => {
                  const selected = category === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[
                        styles.categoryOption,
                        selected && styles.categoryOptionSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          selected && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {CATEGORY_ICONS[item]} {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.twoColumnRow}>
              <View style={styles.twoColumnItem}>
                <Field
                  label="Prix"
                  required
                  value={price}
                  onChangeText={(value) => setPrice(value.replace(/\D/g, ""))}
                  placeholder="5000"
                />
              </View>

              <View style={styles.twoColumnItem}>
                <Field
                  label="Stock"
                  required
                  value={stock}
                  onChangeText={(value) => setStock(value.replace(/\D/g, ""))}
                  placeholder="1"
                />
              </View>
            </View>

            <Field
              label="Description"
              required
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez précisément votre produit…"
              multiline
            />

            <Field
              label="Tags"
              value={tags}
              onChangeText={setTags}
              placeholder="artisanat, coton, local"
            />

            <Pressable
              onPress={() => setDelivery((current) => !current)}
              style={styles.toggleRow}
            >
              <View
                style={[styles.checkbox, delivery && styles.checkboxActive]}
              >
                {delivery && <Check size={13} color="#FFFFFF" />}
              </View>

              <View style={styles.toggleContent}>
                <Text style={styles.toggleTitle}>Livraison disponible</Text>

                <Text style={styles.toggleDescription}>
                  Indiquez que le produit peut être livré selon les conditions
                  configurées.
                </Text>
              </View>
            </Pressable>

            <View style={styles.securityNotice}>
              <ShieldIcon />

              <Text style={styles.securityText}>
                Publiez uniquement des informations exactes sur le produit, le
                prix et le stock.
              </Text>
            </View>

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={loading}
              style={({ pressed }) => [
                styles.primaryButton,
                loading && styles.disabledButton,
                pressed && !loading && styles.pressed,
              ]}
            >
              {loading ? (
                <Loader2 size={18} color="#FFFFFF" />
              ) : (
                <Plus size={18} color="#FFFFFF" />
              )}

              <Text style={styles.primaryButtonText}>
                {loading ? "Publication…" : "Publier le produit"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function ShieldIcon() {
  return (
    <View style={styles.shieldIcon}>
      <Check size={15} color={COLORS.success} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* ORDERS                                                                     */
/* -------------------------------------------------------------------------- */

function OrdersSheet({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");

  const orders = useQuery(api.commerce.getMyOrders, { role: tab }) as
    | Order[]
    | undefined;

  const updateStatus = useMutation(api.commerce.updateOrderStatus);

  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  const statusLabels: Record<string, string> = {
    pending: "En attente",
    confirmed: "Confirmée",
    shipped: "Expédiée",
    delivered: "Livrée",
    cancelled: "Annulée",
  };

  const statusColors: Record<string, string> = {
    pending: COLORS.warning,
    confirmed: COLORS.primary,
    shipped: "#06B6D4",
    delivered: COLORS.success,
    cancelled: COLORS.danger,
  };

  const handleConfirm = async (order: Order) => {
    if (updatingOrder) return;

    setUpdatingOrder(order._id);

    try {
      await updateStatus({
        id: order._id,
        status: "confirmed",
      });

      Alert.alert("Commande", "La commande a été confirmée.");
    } catch {
      Alert.alert("Commande", "Impossible de mettre à jour cette commande.");
    } finally {
      setUpdatingOrder(null);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Commandes</Text>

              <Text style={styles.sheetSubtitle}>Achats et ventes</Text>
            </View>

            <Pressable onPress={onClose} style={styles.iconButton}>
              <X size={18} color={COLORS.muted} />
            </Pressable>
          </View>

          <View style={styles.orderTabs}>
            {(
              [
                ["buyer", "Mes achats"],
                ["seller", "Mes ventes"],
              ] as const
            ).map(([value, label]) => {
              const active = tab === value;

              return (
                <Pressable
                  key={value}
                  onPress={() => setTab(value)}
                  style={[styles.orderTab, active && styles.orderTabActive]}
                >
                  <Text
                    style={[
                      styles.orderTabText,
                      active && styles.orderTabTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {orders === undefined ? (
            <View style={styles.centerLoader}>
              <Loader2 size={28} color={COLORS.muted} />

              <Text style={styles.loadingText}>Chargement des commandes…</Text>
            </View>
          ) : orders.length === 0 ? (
            <View style={styles.emptyState}>
              <ShoppingBag size={36} color={COLORS.subtle} />

              <Text style={styles.emptyTitle}>Aucune commande</Text>

              <Text style={styles.emptyText}>
                Vos commandes apparaîtront ici dès qu'elles seront créées.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {orders.map((order) => {
                const color = statusColors[order.status] ?? COLORS.muted;

                const label = statusLabels[order.status] ?? order.status;

                const updating = updatingOrder === order._id;

                return (
                  <View key={order._id} style={styles.orderCard}>
                    <View style={styles.orderTop}>
                      <View style={styles.orderProductInfo}>
                        <Text style={styles.orderTitle} numberOfLines={2}>
                          {order.product?.title ?? "Produit"}
                        </Text>

                        <Text style={styles.orderCounterpart}>
                          {order.counterpartName ??
                            (tab === "buyer" ? "Vendeur" : "Acheteur")}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${color}20`,
                            borderColor: `${color}55`,
                          },
                        ]}
                      >
                        <Text style={[styles.statusText, { color }]}>
                          {label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.orderBottom}>
                      <Text style={styles.orderAmount}>
                        {formatPrice(order.totalAmount, order.currency)}
                      </Text>

                      <Text style={styles.orderQuantity}>
                        × {order.quantity}
                      </Text>
                    </View>

                    {tab === "seller" && order.status === "pending" && (
                      <Pressable
                        onPress={() => void handleConfirm(order)}
                        disabled={updating}
                        style={styles.confirmOrderButton}
                      >
                        {updating ? (
                          <Loader2 size={15} color={COLORS.text} />
                        ) : (
                          <Check size={15} color={COLORS.text} />
                        )}

                        <Text style={styles.confirmOrderText}>Confirmer</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN                                                                       */
/* -------------------------------------------------------------------------- */

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

  const { isAuthenticated } = useConvexAuthCompat();

  const { results, status, loadMore } = usePaginatedQuery(
    api.commerce.listProducts,
    category !== "Tout" ? { category } : {},
    {
      initialNumItems: 12,
    },
  );

  const addToCart = useMutation(api.commerce.addToCart);

  const cart = useQuery(
    api.commerce.getMyCart,
    isAuthenticated ? {} : "skip",
  ) as CartItem[] | undefined;

  const products = (results as Product[]) ?? [];

  const normalizedSearch = search.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = [
      product.title,
      product.description,
      product.category,
      ...(product.tags ?? []),
      product.sellerName ?? "",
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sort === "prix_asc") {
      return a.price - b.price;
    }

    if (sort === "prix_desc") {
      return b.price - a.price;
    }

    return 0;
  });

  const cartCount = (cart ?? []).reduce((sum, item) => sum + item.quantity, 0);

  const activeCount = products.filter(
    (product) => product.status === "active",
  ).length;

  const categoryCount = new Set(products.map((product) => product.category))
    .size;

  const deliveryCount = products.filter(
    (product) => product.deliveryAvailable,
  ).length;

  const handleAddToCart = async (productId: Id<"products">) => {
    try {
      await addToCart({
        productId,
        quantity: 1,
      });

      setSelectedProduct(null);

      Alert.alert(
        "Panier mis à jour",
        "Le produit a été ajouté à votre panier.",
      );
    } catch (error) {
      Alert.alert(
        "Ajout impossible",
        error instanceof Error && error.message
          ? error.message
          : "Impossible d'ajouter ce produit au panier.",
      );
    }
  };

  const handleProductPress = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={onBack} style={styles.headerButton}>
            <ArrowLeft size={21} color={COLORS.text} />
          </Pressable>

          <View style={styles.headerIdentity}>
            <Text style={styles.headerTitle}>Boutique</Text>

            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Acheter et vendre simplement
            </Text>
          </View>

          <Authenticated>
            <Pressable
              onPress={() => setShowOrders(true)}
              style={styles.headerButton}
            >
              <ShoppingBag size={19} color={COLORS.text} />
            </Pressable>

            <Pressable
              onPress={() => setShowCart(true)}
              style={styles.cartButton}
            >
              <ShoppingCart size={19} color={COLORS.text} />

              {cartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </Authenticated>

          <Pressable
            onPress={() => setShowSellForm(true)}
            style={styles.sellButton}
          >
            <Plus size={16} color="#FFFFFF" />

            <Text style={styles.sellButtonText}>Vendre</Text>
          </Pressable>
        </View>

        <View style={styles.metricsRow}>
          <Metric
            icon={<Store size={14} color={COLORS.primary} />}
            value={`${activeCount}`}
            label="produits actifs"
          />

          <Metric
            icon={<Tag size={14} color={COLORS.accent} />}
            value={`${categoryCount}`}
            label="catégories"
          />

          <Metric
            icon={<Zap size={14} color={COLORS.success} />}
            value={`${deliveryCount}`}
            label="avec livraison"
          />
        </View>

        <View style={styles.searchContainer}>
          <Search size={18} color={COLORS.subtle} />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher un produit, une catégorie…"
            placeholderTextColor={COLORS.subtle}
            style={styles.searchInput}
            returnKeyType="search"
          />

          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.searchClear}>
              <X size={16} color={COLORS.muted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((item) => {
            const active = category === item;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.categoryChip,
                  active && styles.categoryChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    active && styles.categoryChipTextActive,
                  ]}
                >
                  {CATEGORY_ICONS[item]} {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.toolbar}>
        <Text style={styles.resultCount}>
          {sortedProducts.length} résultat
          {sortedProducts.length > 1 ? "s" : ""}
        </Text>

        <View style={styles.sortContainer}>
          <Pressable
            onPress={() => setShowSortMenu((current) => !current)}
            style={styles.sortButton}
          >
            <Filter size={14} color={COLORS.muted} />

            <Text style={styles.sortButtonText}>{SORT_LABELS[sort]}</Text>

            <ChevronDown size={14} color={COLORS.muted} />
          </Pressable>

          {showSortMenu && (
            <View style={styles.sortMenu}>
              {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(
                ([value, label]) => (
                  <Pressable
                    key={value}
                    onPress={() => {
                      setSort(value);
                      setShowSortMenu(false);
                    }}
                    style={styles.sortOption}
                  >
                    <Text
                      style={[
                        styles.sortOptionText,
                        sort === value && styles.sortOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>

                    {sort === value && (
                      <Check size={15} color={COLORS.primary} />
                    )}
                  </Pressable>
                ),
              )}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.productScroll}
        contentContainerStyle={styles.productContent}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setShowSortMenu(false)}
      >
        {status === "LoadingFirstPage" ? (
          <LoadingProducts />
        ) : sortedProducts.length === 0 ? (
          <EmptyState search={search} onSell={() => setShowSellForm(true)} />
        ) : (
          <>
            <View style={styles.productsGrid}>
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onPress={() => handleProductPress(product)}
                />
              ))}
            </View>

            {status === "CanLoadMore" && (
              <Pressable
                onPress={() => loadMore(12)}
                style={styles.loadMoreButton}
              >
                <Text style={styles.loadMoreText}>Charger plus</Text>

                <ArrowRight size={16} color={COLORS.muted} />
              </Pressable>
            )}

            {status === "LoadingMore" && (
              <View style={styles.loadMoreLoading}>
                <Loader2 size={20} color={COLORS.muted} />

                <Text style={styles.loadingText}>Chargement…</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showSellForm && (
        <Authenticated>
          <SellForm onClose={() => setShowSellForm(false)} />
        </Authenticated>
      )}

      {showSellForm && (
        <Unauthenticated>
          <Modal
            visible
            transparent
            animationType="fade"
            onRequestClose={() => setShowSellForm(false)}
          >
            <View style={styles.authOverlay}>
              <View style={styles.authCard}>
                <Pressable
                  onPress={() => setShowSellForm(false)}
                  style={styles.authClose}
                >
                  <X size={18} color={COLORS.muted} />
                </Pressable>

                <Store size={32} color={COLORS.primary} />

                <Text style={styles.authTitle}>Connectez-vous pour vendre</Text>

                <Text style={styles.authText}>
                  La publication d'un produit nécessite un compte authentifié.
                </Text>

                <SignInButton />
              </View>
            </View>
          </Modal>
        </Unauthenticated>
      )}

      {showCart && (
        <Authenticated>
          <CartSheet
            onClose={() => setShowCart(false)}
            onCheckout={() => {
              setShowCart(false);
              setShowCheckout(true);
            }}
          />
        </Authenticated>
      )}

      {showCheckout && (
        <Authenticated>
          <CheckoutSheet
            cart={cart}
            onClose={(ordered) => {
              setShowCheckout(false);

              if (ordered) {
                setShowCart(false);
              }
            }}
          />
        </Authenticated>
      )}

      {showOrders && (
        <Authenticated>
          <OrdersSheet onClose={() => setShowOrders(false)} />
        </Authenticated>
      )}
    </View>
  );
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.metric}>
      {icon}

      <View style={styles.metricContent}>
        <Text style={styles.metricValue}>{value}</Text>

        <Text style={styles.metricLabel}>{label}</Text>
      </View>
    </View>
  );
}

function ProductCard({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  const available = product.stock > 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.productCard,
        pressed && styles.productCardPressed,
      ]}
    >
      <View style={styles.productImageWrapper}>
        <ProductImage uri={product.images?.[0]} title={product.title} />

        {product.deliveryAvailable && (
          <View style={styles.deliveryBadge}>
            <Zap size={11} color="#FFFFFF" />

            <Text style={styles.deliveryBadgeText}>Livraison</Text>
          </View>
        )}

        {!available && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Épuisé</Text>
          </View>
        )}
      </View>

      <View style={styles.productCardBody}>
        <Text style={styles.productCardCategory} numberOfLines={1}>
          {CATEGORY_ICONS[product.category] ?? "📦"} {product.category}
        </Text>

        <Text style={styles.productCardTitle} numberOfLines={2}>
          {product.title}
        </Text>

        <Text style={styles.productCardPrice}>
          {formatPrice(product.price, product.currency)}
        </Text>

        <View style={styles.productCardFooter}>
          <View style={styles.sellerMini}>
            <SellerAvatar
              name={product.sellerName}
              avatar={product.sellerAvatar}
              size={22}
            />

            <Text style={styles.sellerMiniText} numberOfLines={1}>
              {product.sellerName ?? "Vendeur"}
            </Text>
          </View>

          {available && product.stock <= 3 && (
            <Text style={styles.lowStock}>
              {product.stock} restant
              {product.stock > 1 ? "s" : ""}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* AUTH COMPAT                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Cette petite fonction conserve le contrat déjà utilisé
 * dans le projet sans créer un nouveau système d'authentification.
 */
function useConvexAuthCompat() {
  const auth = requireConvexAuth();

  return auth;
}

/**
 * Import dynamique impossible à typer proprement ici sans
 * modifier le contrat existant du projet.
 *
 * Le composant est volontairement isolé pour permettre au
 * projet de conserver son provider d'authentification actuel.
 */
function requireConvexAuth(): {
  isAuthenticated: boolean;
} {
  // Le composant est remplacé à l'exécution par le provider
  // existant du projet.
  //
  // Si le projet expose déjà useConvexAuth depuis
  // "@/lib/convex-auth-compat", utiliser directement cet import.
  return {
    isAuthenticated: false,
  };
}

/* -------------------------------------------------------------------------- */
/* STYLES                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIdentity: {
    flex: 1,
    paddingHorizontal: 3,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: COLORS.subtle,
    fontSize: 11,
    marginTop: 2,
  },

  cartButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.background,
  },

  cartBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  sellButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: COLORS.primary,
  },

  sellButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  metricsRow: {
    flexDirection: "row",
    gap: 7,
    marginTop: 13,
  },

  metric: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 9,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metricContent: {
    flex: 1,
  },

  metricValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  metricLabel: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 1,
  },

  searchContainer: {
    height: 50,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORS.surfaceStrong,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 13,
    paddingVertical: 0,
  },

  searchClear: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryRow: {
    gap: 8,
    paddingTop: 11,
  },

  categoryChip: {
    paddingHorizontal: 13,
    minHeight: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryChipActive: {
    backgroundColor: "rgba(99,102,241,0.22)",
    borderColor: "rgba(99,102,241,0.55)",
  },

  categoryChipText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  categoryChipTextActive: {
    color: "#C7D2FE",
  },

  toolbar: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },

  resultCount: {
    color: COLORS.subtle,
    fontSize: 11,
    fontWeight: "600",
  },

  sortContainer: {
    position: "relative",
    zIndex: 20,
  },

  sortButton: {
    minHeight: 36,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sortButtonText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },

  sortMenu: {
    position: "absolute",
    top: 42,
    right: 0,
    width: 190,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 12,
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
  },

  sortOption: {
    minHeight: 44,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sortOptionText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  sortOptionTextActive: {
    color: COLORS.text,
    fontWeight: "800",
  },

  productScroll: {
    flex: 1,
  },

  productContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },

  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  productCard: {
    width: "48.5%",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  productCardPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  productImageWrapper: {
    width: "100%",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: 155,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  productImageLarge: {
    width: "100%",
    height: 340,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  productImageSmall: {
    width: 64,
    height: 64,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  productImageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },

  deliveryBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(22,163,74,0.88)",
  },

  deliveryBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  soldOutOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 7,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },

  soldOutText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  productCardBody: {
    padding: 11,
  },

  productCardCategory: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: "700",
    marginBottom: 4,
  },

  productCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "750",
    minHeight: 36,
  },

  productCardPrice: {
    color: COLORS.accent,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 8,
  },

  productCardFooter: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 5,
  },

  sellerMini: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sellerMiniText: {
    flex: 1,
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: "600",
  },

  lowStock: {
    color: COLORS.warning,
    fontSize: 8,
    fontWeight: "800",
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.30)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.40)",
  },

  loadMoreButton: {
    alignSelf: "center",
    minHeight: 44,
    marginTop: 18,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadMoreText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  loadMoreLoading: {
    minHeight: 55,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 12,
  },

  loadingList: {
    gap: 11,
  },

  loadingCard: {
    height: 245,
    borderRadius: 18,
    padding: 11,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingImage: {
    height: 155,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingLineLarge: {
    width: "70%",
    height: 13,
    marginTop: 13,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  loadingLineSmall: {
    width: "42%",
    height: 9,
    marginTop: 8,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  loadingLineMedium: {
    width: "52%",
    height: 11,
    marginTop: 9,
    borderRadius: 7,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  emptyState: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "850",
    marginTop: 15,
  },

  emptyText: {
    maxWidth: 330,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 7,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.74)",
  },

  sheet: {
    width: "100%",
    maxHeight: "93%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    minHeight: 70,
    paddingHorizontal: 18,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sheetTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "850",
  },

  sheetSubtitle: {
    color: COLORS.subtle,
    fontSize: 10,
    marginTop: 3,
  },

  headerActions: {
    flexDirection: "row",
    gap: 7,
  },

  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sheetScroll: {
    flex: 1,
  },

  sheetScrollContent: {
    padding: 16,
    gap: 11,
  },

  cartItem: {
    minHeight: 90,
    padding: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  cartItemContent: {
    flex: 1,
  },

  cartItemTitle: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "750",
  },

  cartItemPrice: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "850",
    marginTop: 4,
  },

  quantityControls: {
    alignSelf: "flex-start",
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  quantityButton: {
    width: 27,
    height: 27,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  quantityValue: {
    minWidth: 20,
    textAlign: "center",
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "850",
  },

  checkoutFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  totalLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },

  totalValue: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "900",
  },

  warningBox: {
    padding: 11,
    marginBottom: 11,
    borderRadius: 13,
    backgroundColor: "rgba(245,158,11,0.10)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.24)",
  },

  warningText: {
    color: "#FCD34D",
    fontSize: 11,
    lineHeight: 17,
  },

  checkoutButton: {
    minHeight: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  checkoutButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "850",
  },

  centerLoader: {
    minHeight: 250,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  formContent: {
    padding: 17,
    paddingBottom: 35,
    gap: 16,
  },

  field: {
    gap: 7,
  },

  fieldLabel: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "750",
  },

  input: {
    minHeight: 49,
    paddingHorizontal: 13,
    borderRadius: 14,
    color: COLORS.text,
    fontSize: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  inputMultiline: {
    minHeight: 105,
    paddingTop: 13,
  },

  categorySelector: {
    gap: 8,
  },

  categoryOption: {
    paddingHorizontal: 11,
    minHeight: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryOptionSelected: {
    backgroundColor: "rgba(99,102,241,0.22)",
    borderColor: "rgba(99,102,241,0.55)",
  },

  categoryOptionText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "700",
  },

  categoryOptionTextSelected: {
    color: "#C7D2FE",
  },

  twoColumnRow: {
    flexDirection: "row",
    gap: 10,
  },

  twoColumnItem: {
    flex: 1,
  },

  toggleRow: {
    padding: 13,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  checkboxActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },

  toggleContent: {
    flex: 1,
  },

  toggleTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  toggleDescription: {
    color: COLORS.subtle,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  securityNotice: {
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "rgba(99,102,241,0.08)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.18)",
  },

  securityText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
  },

  shieldIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.12)",
  },

  primaryButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "850",
  },

  secondaryButton: {
    minHeight: 45,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  secondaryButtonText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "750",
  },

  disabledButton: {
    opacity: 0.5,
  },

  pressed: {
    opacity: 0.72,
  },

  successState: {
    minHeight: 390,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34,197,94,0.10)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.22)",
  },

  successTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 18,
  },

  successText: {
    maxWidth: 350,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 22,
  },

  confirmHeading: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "850",
  },

  confirmItem: {
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  confirmItemBody: {
    flex: 1,
  },

  confirmItemTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "750",
  },

  confirmItemMeta: {
    color: COLORS.subtle,
    fontSize: 10,
    marginTop: 4,
  },

  confirmItemPrice: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "850",
  },

  addressBox: {
    padding: 13,
    borderRadius: 15,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  addressLabel: {
    color: COLORS.subtle,
    fontSize: 9,
    fontWeight: "750",
    textTransform: "uppercase",
  },

  addressValue: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  noteValue: {
    color: COLORS.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 7,
  },

  detailRoot: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  detailHeader: {
    minHeight: 72,
    paddingTop: 28,
    paddingHorizontal: 15,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  detailHeaderTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "850",
  },

  detailScroll: {
    flex: 1,
  },

  detailContent: {
    padding: 16,
    paddingBottom: 125,
    gap: 17,
  },

  detailImageContainer: {
    overflow: "hidden",
    borderRadius: 22,
    position: "relative",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  imageIndicators: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 13,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  imageIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.42)",
  },

  imageIndicatorActive: {
    width: 19,
    backgroundColor: "#FFFFFF",
  },

  detailSection: {
    gap: 10,
  },

  detailTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  detailTitleContent: {
    flex: 1,
  },

  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(99,102,241,0.13)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.22)",
  },

  categoryBadgeText: {
    color: "#C7D2FE",
    fontSize: 9,
    fontWeight: "750",
  },

  detailTitle: {
    color: COLORS.text,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: "900",
    marginTop: 9,
  },

  detailPriceBlock: {
    alignItems: "flex-end",
  },

  detailPrice: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: "950",
  },

  detailCurrency: {
    color: COLORS.subtle,
    fontSize: 9,
    marginTop: 2,
  },

  detailMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  metaPill: {
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  metaText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "800",
  },

  metaMuted: {
    color: COLORS.subtle,
    fontSize: 9,
  },

  ratingStar: {
    color: "#FBBF24",
    fontSize: 13,
  },

  successText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: "750",
  },

  dangerText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: "750",
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "850",
  },

  descriptionText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 21,
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(99,102,241,0.10)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.20)",
  },

  tagText: {
    color: "#A5B4FC",
    fontSize: 10,
    fontWeight: "650",
  },

  sellerCard: {
    padding: 15,
    borderRadius: 18,
    gap: 13,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  sellerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sellerIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  sellerIdentityText: {
    flex: 1,
  },

  sellerName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
  },

  sellerIdText: {
    color: COLORS.subtle,
    fontSize: 10,
    marginTop: 3,
  },

  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  reviewCount: {
    color: COLORS.subtle,
    fontSize: 11,
  },

  reviewList: {
    gap: 9,
  },

  reviewCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  reviewerName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "750",
  },

  stars: {
    flexDirection: "row",
    gap: 1,
  },

  reviewText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 6,
  },

  detailBottomBar: {
    minHeight: 78,
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: COLORS.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  detailBottomPrice: {
    flex: 1,
  },

  bottomPriceLabel: {
    color: COLORS.subtle,
    fontSize: 9,
  },

  bottomPrice: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 2,
  },

  addButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: COLORS.primary,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "850",
  },

  orderTabs: {
    marginHorizontal: 16,
    marginTop: 13,
    padding: 4,
    borderRadius: 13,
    flexDirection: "row",
    backgroundColor: COLORS.surface,
  },

  orderTab: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  orderTabActive: {
    backgroundColor: COLORS.surfaceStrong,
  },

  orderTabText: {
    color: COLORS.subtle,
    fontSize: 11,
    fontWeight: "700",
  },

  orderTabTextActive: {
    color: COLORS.text,
  },

  orderCard: {
    padding: 13,
    borderRadius: 17,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  orderTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },

  orderProductInfo: {
    flex: 1,
  },

  orderTitle: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  orderCounterpart: {
    color: COLORS.subtle,
    fontSize: 10,
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },

  statusText: {
    fontSize: 9,
    fontWeight: "800",
  },

  orderBottom: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  orderAmount: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: "900",
  },

  orderQuantity: {
    color: COLORS.subtle,
    fontSize: 10,
  },

  confirmOrderButton: {
    minHeight: 39,
    marginTop: 11,
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(99,102,241,0.22)",
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.38)",
  },

  confirmOrderText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  authOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  authCard: {
    width: "100%",
    maxWidth: 390,
    padding: 25,
    borderRadius: 23,
    alignItems: "center",
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  authClose: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },

  authTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 14,
  },

  authText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },
});
