import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  Check,
  Heart,
  Loader2,
  MessageCircle,
  Phone,
  Share2,
  ShoppingCart,
  ShieldCheck,
  Store,
  X,
} from "lucide-react-native";

import {
  useProduct,
  useCart,
  useWishlist,
  useProductReviews,
  useSeller,
  useRecommendations,
  useRecentlyViewed,
  useQuestions,
  useSellerFollowers,
  useConversation,
} from "@/features/marketplace/hooks";

import {
  ProductGallery,
  ProductPrice,
  ProductDiscount,
  ProductCoupons,
  ProductStock,
  ProductVariants,
  ProductDescription,
  ProductSpecifications,
  ProductWarranty,
  ProductAuthenticity,
  ProductDelivery,
  ProductPayment,
  SellerCard,
  SellerStats,
  SellerCertification,
  SellerPolicies,
  SellerProducts,
  ProductReviews,
  ProductQuestions,
  ProductRecommendations,
  ProductSimilar,
  RecentlyViewedProducts,
  ProductShare,
  ProductCompare,
  ProductReport,
  StickyPurchaseBar,
  QuantitySelector,
  ProductVideos,
  ProductStories,
  ProductFlashSale,
  LimitedStockBanner,
  ProductInstallment,
  ProductLoyalty,
  RewardPoints,
  ProductFeatures,
  ProductDimensions,
  ProductDocuments,
  ProductAccessories,
  FrequentlyBoughtTogether,
  ProductReviewStats,
  ProductVideoReviews,
  ProductCommunity,
  ProductActions,
  SellerBadges,
  SellerFollowers,
  SellerContact,
  SellerChat,
  SellerCall,
  SellerVideoCall,
  ProductLive,
  AIShoppingAssistant,
  AIPriceAdvisor,
  AISimilarProducts,
} from "@/features/marketplace/components";

import type { Id } from "@/convex/_generated/dataModel";

const COLORS = {
  background: "#050812",
  backgroundSecondary: "#0c1022",
  card: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.10)",
  text: "#FFFFFF",
  muted: "#9CA3AF",
  subtle: "#6B7280",
  primary: "#4F46E5",
  primaryDark: "#3730A3",
  success: "#22C55E",
  danger: "#EF4444",
};

function isValidUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function safeString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : undefined;
}

function formatQuantity(quantity: number): string {
  return new Intl.NumberFormat("fr-FR").format(quantity);
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingIcon}>
        <Loader2 size={28} color={COLORS.muted} />
      </View>

      <Text style={styles.loadingTitle}>Chargement du produit</Text>

      <Text style={styles.loadingText}>
        Récupération des informations depuis la boutique.
      </Text>
    </View>
  );
}

function EmptyProductScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <ShoppingCart size={28} color={COLORS.muted} />
      </View>

      <Text style={styles.emptyTitle}>Produit introuvable</Text>

      <Text style={styles.emptyText}>
        Ce produit n'est pas disponible ou n'existe plus.
      </Text>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <ArrowLeft size={18} color="#FFFFFF" />
        <Text style={styles.primaryButtonText}>Retour à la boutique</Text>
      </Pressable>
    </View>
  );
}

export default function MarketplaceDetailPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();

  const productIdParam = Array.isArray(params.id) ? params.id[0] : params.id;

  const productId = productIdParam as Id<"products">;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);

  const [isLiked, setIsLiked] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const { product, isLoading: productLoading } = useProduct(productId);

  const { items: cartItems, addItem } = useCart();

  const { toggle: toggleWishlist } = useWishlist();

  const { reviews, addReview, likeReview } = useProductReviews(productId);

  const { seller, isLoading: sellerLoading } = useSeller(product?.sellerId);

  const { products: recommendations } = useRecommendations(productId);

  const { products: recentProducts } = useRecentlyViewed();

  const { questions, ask, answer } = useQuestions(productId);

  const { followers, isFollowing, toggleFollow } = useSellerFollowers(
    product?.sellerId,
  );

  const { getOrCreate } = useConversation();

  useEffect(() => {
    if (!product || !cartItems) {
      return;
    }

    setIsInCart(cartItems.some((item) => item.productId === product._id));
  }, [cartItems, product]);

  useEffect(() => {
    if (!product) {
      return;
    }

    setIsLiked(Boolean(product.isLiked));

    const maxStock =
      typeof product.stock === "number" ? Math.max(product.stock, 0) : 0;

    setQuantity((current) => {
      if (maxStock <= 0) return 1;
      return Math.min(Math.max(current, 1), maxStock);
    });
  }, [product]);

  const stock = useMemo(() => {
    if (!product) return 0;

    return typeof product.stock === "number" ? Math.max(product.stock, 0) : 0;
  }, [product]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/marketplace");
  };

  const handleAddToCart = async () => {
    if (!product || addingToCart) {
      return;
    }

    if (stock <= 0) {
      Alert.alert(
        "Produit indisponible",
        "Ce produit n'est actuellement plus en stock.",
      );
      return;
    }

    if (quantity > stock) {
      Alert.alert(
        "Quantité indisponible",
        `La quantité maximale disponible est de ${formatQuantity(stock)}.`,
      );
      return;
    }

    setAddingToCart(true);

    try {
      await addItem(product._id, quantity);

      setIsInCart(true);

      Alert.alert(
        "Panier mis à jour",
        `${formatQuantity(quantity)} article${
          quantity > 1 ? "s" : ""
        } ajouté${quantity > 1 ? "s" : ""} au panier.`,
      );
    } catch {
      Alert.alert(
        "Ajout impossible",
        "Le produit n'a pas pu être ajouté au panier. Réessayez.",
      );
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    if (stock <= 0) {
      Alert.alert(
        "Produit indisponible",
        "Ce produit n'est actuellement plus en stock.",
      );
      return;
    }

    if (quantity > stock) {
      Alert.alert(
        "Quantité indisponible",
        `La quantité maximale disponible est de ${formatQuantity(stock)}.`,
      );
      return;
    }

    router.push({
      pathname: "/checkout",
      params: {
        product: product._id,
        quantity: String(quantity),
      },
    });
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    const previousValue = isLiked;
    const nextValue = !previousValue;

    setIsLiked(nextValue);

    try {
      await toggleWishlist(product._id);
    } catch {
      setIsLiked(previousValue);

      Alert.alert(
        "Favoris",
        "Impossible de modifier vos favoris pour le moment.",
      );
    }
  };

  const handleVariantSelect = (variantId: string, option: string) => {
    setSelectedVariants((current) => ({
      ...current,
      [variantId]: option,
    }));
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleNativeShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        title: product.title,
        message: product.title,
      });
    } catch {
      // L'utilisateur peut simplement fermer le partage natif.
    }
  };

  const handleContact = async () => {
    if (!seller?.userId) {
      Alert.alert(
        "Vendeur indisponible",
        "Les informations de contact du vendeur ne sont pas disponibles.",
      );
      return;
    }

    try {
      const conversationId = await getOrCreate([seller.userId]);

      router.push(`/messages/${conversationId}` as never);
    } catch {
      Alert.alert(
        "Conversation",
        "Impossible d'ouvrir la conversation avec le vendeur.",
      );
    }
  };

  const handleSellerCall = () => {
    const phone = safeString(
      (seller as unknown as { phone?: unknown } | undefined)?.phone,
    );

    if (!phone) {
      Alert.alert(
        "Téléphone indisponible",
        "Le vendeur n'a pas publié de numéro de téléphone.",
      );
      return;
    }

    setShowCall(true);
  };

  const handleSellerEmail = () => {
    const email = safeString(
      (seller as unknown as { email?: unknown } | undefined)?.email,
    );

    if (!email) {
      Alert.alert(
        "Email indisponible",
        "Le vendeur n'a pas publié d'adresse email.",
      );
      return;
    }

    void Linking.openURL(`mailto:${email}`);
  };

  const handleVideoCall = () => {
    if (!seller?.userId) {
      Alert.alert(
        "Appel vidéo indisponible",
        "Le vendeur n'est pas disponible pour un appel vidéo.",
      );
      return;
    }

    setShowVideoCall(true);
  };

  if (productLoading || sellerLoading) {
    return <LoadingScreen />;
  }

  if (!product) {
    return <EmptyProductScreen onBack={handleBack} />;
  }

  const productAny = product as unknown as Record<string, unknown>;

  const sellerAny = seller as unknown as Record<string, unknown> | null;

  const discountPercent =
    typeof productAny.discountPercent === "number"
      ? productAny.discountPercent
      : undefined;

  const videos = Array.isArray(productAny.videos) ? productAny.videos : [];

  const stories = Array.isArray(productAny.stories) ? productAny.stories : [];

  const variants = Array.isArray(productAny.variants)
    ? productAny.variants
    : [];

  const features = Array.isArray(productAny.features)
    ? productAny.features
    : [];

  const specifications = Array.isArray(productAny.specifications)
    ? productAny.specifications
    : [];

  const dimensions = productAny.dimensions;

  const documents = Array.isArray(productAny.documents)
    ? productAny.documents
    : [];

  const accessories = Array.isArray(productAny.accessories)
    ? productAny.accessories
    : [];

  const sellerProducts = Array.isArray(productAny.sellerProducts)
    ? productAny.sellerProducts
    : [];

  const bundleProducts = Array.isArray(productAny.bundleProducts)
    ? productAny.bundleProducts
    : [];

  const similarProducts = Array.isArray(productAny.similarProducts)
    ? productAny.similarProducts
    : [];

  const videoReviews = Array.isArray(productAny.videoReviews)
    ? productAny.videoReviews
    : [];

  const installmentPlans = Array.isArray(productAny.installmentPlans)
    ? productAny.installmentPlans
    : [];

  const coupons = Array.isArray(productAny.coupons) ? productAny.coupons : [];

  const deliveryTracking = safeString(productAny.deliveryTracking);

  const deliveryTimeline = Array.isArray(productAny.deliveryTimeline)
    ? productAny.deliveryTimeline
    : [];

  const liveStream = productAny.liveStream;

  const phone = safeString(sellerAny?.phone);

  const sellerLocation = safeString(sellerAny?.location);

  const sellerAbout = safeString(sellerAny?.about);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={21} color={COLORS.text} />
        </Pressable>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Boutique
          </Text>

          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {product.title}
          </Text>
        </View>

        <Pressable
          onPress={handleWishlistToggle}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            isLiked ? "Retirer des favoris" : "Ajouter aux favoris"
          }
        >
          <Heart
            size={19}
            color={isLiked ? COLORS.danger : COLORS.muted}
            fill={isLiked ? COLORS.danger : "transparent"}
          />
        </Pressable>

        <Pressable
          onPress={handleNativeShare}
          style={({ pressed }) => [
            styles.headerButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Partager"
        >
          <Share2 size={19} color={COLORS.muted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery images={product.images || []} title={product.title} />

        {videos.length > 0 && <ProductVideos videos={videos} />}

        {stories.length > 0 && <ProductStories stories={stories} />}

        <View style={styles.section}>
          <View style={styles.productHeader}>
            <View style={styles.productIdentity}>
              <Text style={styles.productTitle}>{product.title}</Text>

              <Text style={styles.productCategory}>{product.category}</Text>

              {typeof product.rating === "number" && product.rating > 0 && (
                <View style={styles.ratingRow}>
                  <Text style={styles.ratingStar}>★</Text>

                  <Text style={styles.ratingValue}>
                    {product.rating.toFixed(1)}
                  </Text>

                  <Text style={styles.ratingCount}>
                    ({product.reviewCount ?? 0})
                  </Text>
                </View>
              )}
            </View>

            <ProductPrice product={product} discountPercent={discountPercent} />
          </View>

          {discountPercent !== undefined && discountPercent > 0 && (
            <ProductDiscount
              originalPrice={product.price}
              discountPercent={discountPercent}
              currency={product.currency}
              endDate={productAny.discountEndDate}
            />
          )}

          {productAny.flashSale ? (
            <ProductFlashSale {...(productAny.flashSale as object)} />
          ) : null}

          {stock > 0 && stock <= 5 && <LimitedStockBanner stock={stock} />}

          {coupons.length > 0 && (
            <ProductCoupons coupons={coupons} currency={product.currency} />
          )}

          {installmentPlans.length > 0 && (
            <ProductInstallment
              price={product.price}
              currency={product.currency}
              installments={
                (
                  installmentPlans[0] as {
                    months?: number;
                  }
                )?.months
              }
              interestRate={
                (
                  installmentPlans[0] as {
                    interestRate?: number;
                  }
                )?.interestRate
              }
            />
          )}
        </View>

        <View style={styles.section}>
          <ProductStock stock={stock} />

          {product.tags?.length ? (
            <View style={styles.tags}>
              {product.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {variants.length > 0 && (
            <ProductVariants
              variants={variants}
              selected={selectedVariants}
              onSelect={handleVariantSelect}
            />
          )}

          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>Quantité</Text>

            <QuantitySelector
              quantity={quantity}
              min={1}
              max={Math.max(stock, 1)}
              onChange={setQuantity}
            />
          </View>
        </View>

        <ProductDescription description={product.description} />

        {features.length > 0 && <ProductFeatures features={features} />}

        {specifications.length > 0 && (
          <ProductSpecifications specifications={specifications} />
        )}

        {dimensions ? <ProductDimensions dimensions={dimensions} /> : null}

        {documents.length > 0 && <ProductDocuments documents={documents} />}

        <ProductWarranty
          months={
            typeof productAny.warrantyMonths === "number"
              ? productAny.warrantyMonths
              : 0
          }
          coverage={productAny.warrantyCoverage}
        />

        <ProductAuthenticity
          verified={Boolean(productAny.isAuthentic)}
          certificateUrl={
            isValidUrl(productAny.certificateUrl)
              ? productAny.certificateUrl
              : undefined
          }
        />

        <ProductDelivery
          deliveryAvailable={product.deliveryAvailable}
          location={product.location}
          estimatedDays={
            typeof productAny.deliveryDays === "number"
              ? productAny.deliveryDays
              : undefined
          }
        />

        {deliveryTracking ? (
          <View style={styles.infoCard}>
            <ShieldCheck size={20} color={COLORS.success} />

            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Suivi de livraison</Text>

              <Text style={styles.infoCardText}>
                Un suivi est associé à cette commande.
              </Text>
            </View>
          </View>
        ) : null}

        {deliveryTimeline.length > 0 ? (
          <View style={styles.infoCard}>
            <ShoppingCart size={20} color={COLORS.primary} />

            <View style={styles.infoCardContent}>
              <Text style={styles.infoCardTitle}>Historique de livraison</Text>

              <Text style={styles.infoCardText}>
                {deliveryTimeline.length} étape
                {deliveryTimeline.length > 1 ? "s" : ""} enregistrée
                {deliveryTimeline.length > 1 ? "s" : ""}.
              </Text>
            </View>
          </View>
        ) : null}

        <ProductPayment
          methods={
            Array.isArray(productAny.paymentMethods)
              ? productAny.paymentMethods
              : []
          }
          currency={product.currency}
        />

        <ProductActions
          onLike={handleWishlistToggle}
          onShare={handleNativeShare}
          onCompare={() => setShowCompare(true)}
          onReport={() => setShowReport(true)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isLiked={isLiked}
          isInCart={isInCart}
          disabled={addingToCart || stock <= 0}
        />

        {seller && (
          <View style={styles.sellerSection}>
            <View style={styles.sectionHeading}>
              <Store size={19} color={COLORS.primary} />

              <Text style={styles.sectionHeadingText}>À propos du vendeur</Text>
            </View>

            <SellerCard seller={seller} onContact={handleContact} />

            <SellerBadges
              badges={Array.isArray(sellerAny?.badges) ? sellerAny.badges : []}
              verified={Boolean(seller.verified)}
            />

            <SellerStats
              rating={seller.rating || 0}
              reviewCount={seller.reviewCount || 0}
              totalSales={seller.totalSales || 0}
              responseTime={seller.responseTime}
              fulfillmentRate={
                typeof sellerAny?.fulfillmentRate === "number"
                  ? sellerAny.fulfillmentRate
                  : undefined
              }
            />

            {sellerAbout ? (
              <View style={styles.infoCard}>
                <MessageCircle size={19} color={COLORS.muted} />

                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Présentation</Text>

                  <Text style={styles.infoCardText}>{sellerAbout}</Text>
                </View>
              </View>
            ) : null}

            {sellerLocation ? (
              <View style={styles.infoCard}>
                <Store size={19} color={COLORS.muted} />

                <View style={styles.infoCardContent}>
                  <Text style={styles.infoCardTitle}>Localisation</Text>

                  <Text style={styles.infoCardText}>{sellerLocation}</Text>
                </View>
              </View>
            ) : null}

            <SellerCertification
              certifications={
                Array.isArray(sellerAny?.certifications)
                  ? sellerAny.certifications
                  : []
              }
              verified={Boolean(seller.verified)}
            />

            {sellerAny?.policies ? (
              <SellerPolicies
                returnPolicy={
                  (
                    sellerAny.policies as {
                      return?: unknown;
                    }
                  )?.return
                }
                shippingPolicy={
                  (
                    sellerAny.policies as {
                      shipping?: unknown;
                    }
                  )?.shipping
                }
                warrantyPolicy={
                  (
                    sellerAny.policies as {
                      warranty?: unknown;
                    }
                  )?.warranty
                }
              />
            ) : null}

            <SellerFollowers
              followerCount={followers.length}
              isFollowing={isFollowing}
              onToggleFollow={toggleFollow}
            />

            <SellerContact
              onChat={handleContact}
              onCall={handleSellerCall}
              onEmail={handleSellerEmail}
            />

            <View style={styles.sellerActions}>
              {phone ? (
                <Pressable
                  onPress={() => setShowCall(true)}
                  style={({ pressed }) => [
                    styles.secondaryAction,
                    pressed && styles.pressed,
                  ]}
                >
                  <Phone size={17} color={COLORS.text} />

                  <Text style={styles.secondaryActionText}>Appeler</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleContact}
                style={({ pressed }) => [
                  styles.secondaryAction,
                  pressed && styles.pressed,
                ]}
              >
                <MessageCircle size={17} color={COLORS.text} />

                <Text style={styles.secondaryActionText}>Contacter</Text>
              </Pressable>
            </View>
          </View>
        )}

        {sellerProducts.length > 0 && (
          <SellerProducts
            products={sellerProducts}
            onProductPress={(item) =>
              router.push(`/marketplace/${item._id}` as never)
            }
          />
        )}

        {bundleProducts.length > 0 && (
          <FrequentlyBoughtTogether
            products={bundleProducts}
            mainProduct={{
              ...product,
              id: product._id,
            }}
            onAddAll={() => {
              Alert.alert(
                "Panier",
                "Les produits doivent être ajoutés individuellement afin de respecter les variantes et disponibilités réelles.",
              );
            }}
          />
        )}

        {accessories.length > 0 && (
          <ProductAccessories
            accessories={accessories}
            onSelect={(accessory) =>
              router.push(`/marketplace/${accessory._id}` as never)
            }
          />
        )}

        <ProductReviews
          reviews={reviews}
          averageRating={product.rating}
          onAddReview={addReview}
          onLikeReview={likeReview}
        />

        <ProductReviewStats
          ratings={
            (productAny.ratingDistribution as Record<string, number>) || {}
          }
          totalReviews={reviews.length}
        />

        {videoReviews.length > 0 && (
          <ProductVideoReviews videos={videoReviews} onPlay={() => undefined} />
        )}

        <ProductQuestions questions={questions} onAsk={ask} onAnswer={answer} />

        <ProductCommunity
          reviews={reviews.length}
          questions={questions.length}
          followers={followers.length}
          shares={
            typeof productAny.shareCount === "number"
              ? productAny.shareCount
              : 0
          }
        />

        <ProductRecommendations
          products={recommendations}
          onProductPress={(item) =>
            router.push(`/marketplace/${item._id}` as never)
          }
        />

        {similarProducts.length > 0 && (
          <ProductSimilar
            products={similarProducts}
            onProductPress={(item) =>
              router.push(`/marketplace/${item._id}` as never)
            }
          />
        )}

        <RecentlyViewedProducts
          products={recentProducts}
          onProductPress={(item) =>
            router.push(`/marketplace/${item._id}` as never)
          }
        />

        <AIShoppingAssistant product={product} onSuggestion={() => undefined} />

        <AIPriceAdvisor product={product} onAdvice={() => undefined} />

        <AISimilarProducts
          product={product}
          onSelect={(item) => router.push(`/marketplace/${item._id}` as never)}
        />

        {liveStream ? <ProductLive {...(liveStream as object)} /> : null}
      </ScrollView>

      <StickyPurchaseBar
        product={product}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      <Modal
        visible={showShare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowShare(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Partager le produit</Text>

              <Pressable
                onPress={() => setShowShare(false)}
                style={styles.modalClose}
              >
                <X size={20} color={COLORS.muted} />
              </Pressable>
            </View>

            <ProductShare
              productId={product._id}
              title={product.title}
              onClose={() => setShowShare(false)}
            />

            <Pressable
              onPress={handleNativeShare}
              style={styles.nativeShareButton}
            >
              <Share2 size={18} color="#FFFFFF" />

              <Text style={styles.nativeShareText}>
                Partager avec le système
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showReport}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReport(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ProductReport
              productId={product._id}
              onClose={() => setShowReport(false)}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCompare}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCompare(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ProductCompare
              productId={product._id}
              onClose={() => setShowCompare(false)}
            />
          </View>
        </View>
      </Modal>

      {seller && (
        <Modal
          visible={showChat}
          transparent
          animationType="slide"
          onRequestClose={() => setShowChat(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <SellerChat
                sellerName={seller.name || "Vendeur"}
                onClose={() => setShowChat(false)}
                onSendMessage={async () => {
                  await handleContact();
                  setShowChat(false);
                }}
              />
            </View>
          </View>
        </Modal>
      )}

      {seller && (
        <Modal
          visible={showCall}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCall(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <SellerCall
                sellerName={seller.name || "Vendeur"}
                sellerPhone={phone || ""}
                onClose={() => setShowCall(false)}
              />
            </View>
          </View>
        </Modal>
      )}

      {seller && (
        <Modal
          visible={showVideoCall}
          transparent
          animationType="slide"
          onRequestClose={() => setShowVideoCall(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <SellerVideoCall
                sellerName={seller.name || "Vendeur"}
                onClose={() => setShowVideoCall(false)}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 78,
    paddingTop: 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitleContainer: {
    flex: 1,
    paddingHorizontal: 4,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: COLORS.subtle,
    fontSize: 11,
    marginTop: 2,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 150,
    gap: 18,
  },

  section: {
    gap: 14,
  },

  productHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },

  productIdentity: {
    flex: 1,
  },

  productTitle: {
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },

  productCategory: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 7,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 4,
  },

  ratingStar: {
    color: "#FBBF24",
    fontSize: 15,
  },

  ratingValue: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  ratingCount: {
    color: COLORS.subtle,
    fontSize: 12,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  tagText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  quantityRow: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  quantityLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  sellerSection: {
    gap: 13,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionHeadingText: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
  },

  sellerActions: {
    flexDirection: "row",
    gap: 10,
  },

  secondaryAction: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryActionText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },

  infoCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  infoCardContent: {
    flex: 1,
  },

  infoCardTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },

  infoCardText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingTitle: {
    color: COLORS.text,
    fontSize: 17,
    fontWeight: "800",
    marginTop: 16,
  },

  loadingText: {
    color: COLORS.muted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    marginTop: 7,
  },

  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
    marginTop: 16,
  },

  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },

  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "flex-end",
  },

  modalCard: {
    maxHeight: "92%",
    padding: 18,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "800",
  },

  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },

  nativeShareButton: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  nativeShareText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  pressed: {
    opacity: 0.72,
  },
});
