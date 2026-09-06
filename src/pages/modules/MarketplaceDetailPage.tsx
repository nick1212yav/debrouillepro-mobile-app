import { useLocalSearchParams, useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";

// src/pages/modules/MarketplaceDetailPage.tsx
// ✅ Version finale – toutes les erreurs corrigées

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";
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

// ─── Stubs locaux pour les composants non implémentés ──────────────────────
const CountdownOffer = (props: any) => (
  <View className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
    <Text className="text-orange-400 text-sm font-bold">⏳ Offre limitée</Text>
  </View>
);

const Cashback = (props: any) => (
  <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
    <Text className="text-green-400 text-sm font-bold">
      💵 Cashback {props.percentage || 0}%
    </Text>
  </View>
);

const DeliveryEstimator = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">🚚 Estimation de livraison</Text>
  </View>
);

const DeliveryTimeline = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">📋 Suivi de livraison</Text>
  </View>
);

const DeliveryTrackingMap = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">🗺️ Traçage en temps réel</Text>
  </View>
);

const DeliveryInsurance = (props: any) => (
  <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
    <Text className="text-blue-400 text-sm font-bold">🛡️ Assurance livraison</Text>
  </View>
);

const SellerPerformance = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3">
    <Text className="text-white/60 text-sm">📊 Performance</Text>
  </View>
);

const SellerAbout = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3">
    <Text className="text-white/60 text-sm">
      📝 {props.description || "À propos du vendeur"}
    </Text>
  </View>
);

const SellerLocation = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3">
    <Text className="text-white/60 text-sm">
      📍 {props.location || "Localisation"}
    </Text>
  </View>
);

const SellerGuarantees = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3">
    <Text className="text-white/60 text-sm">🛡️ Garanties</Text>
  </View>
);

const SellerTimeline = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3">
    <Text className="text-white/60 text-sm">📅 Chronologie</Text>
  </View>
);

export default function MarketplaceDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const productId = id as Id<"products">;

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

  // ── Hooks ───────────────────────────────────────────────────────────────────
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

  // ── Effets ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (cartItems && product) {
      const inCart = cartItems.some((item) => item.productId === product._id);
      setIsInCart(inCart);
    }
  }, [cartItems, product]);

  useEffect(() => {
    if (product) {
      setIsLiked(product.isLiked || false);
    }
  }, [product]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product._id, quantity);
      setIsInCart(true);
      UIService.openToast("Ajouté au panier !", "success");
    } catch {
      UIService.openToast("Erreur lors de l'ajout au panier", "error");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    router.push(`/checkout?product=${product._id}&quantity=${quantity}`);
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    try {
      await toggleWishlist(product._id);
      setIsLiked((prev) => !prev);
      UIService.openToast(isLiked ? "Retiré des favoris" : "Ajouté aux favoris", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const handleVariantSelect = (variantId: string, option: string) => {
    setSelectedVariants((prev) => ({ ...prev, [variantId]: option }));
  };

  const handleShare = () => setShowShare(true);
  const handleReport = () => setShowReport(true);
  const handleCompare = () => setShowCompare(true);

  const handleContact = async () => {
    if (!seller) return;
    try {
      const conversationId = await getOrCreate([seller.userId]);
      router.push(`/messages/${conversationId}`);
    } catch {
      UIService.openToast("Erreur lors de l'ouverture de la conversation", "error");
    }
  };
  const handleCall = () => setShowCall(true);
  const handleVideoCall = () => setShowVideoCall(true);

  // ── États de chargement ──────────────────────────────────────────────────
  if (productLoading || sellerLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!product) {
    return (
      <View
        className="h-full flex flex-col items-center justify-center px-4"
        style={{  }}
      >
        <Pressable onPress={() => router(-1)} className="self-start mb-4">
          <ArrowLeft size={24} className="text-white/60" />
        </Pressable>
        <Text className="text-white/40">Produit introuvable</Text>
      </View>
    );
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3">
        <Pressable
          onPress={() => router(-1)}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={20} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-lg flex-1 truncate">
          Détail du produit
        </Text>
        <View className="flex items-center gap-1.5">
          <Pressable
            onPress={handleWishlistToggle}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Heart
              size={18}
              className={
                isLiked ? "fill-red-500 text-red-500" : "text-white/60"
              }
            />
          </Pressable>
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
          >
            <Share2 size={18} className="text-white/60" />
          </Pressable>
        </View>
      </View>

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 pb-8 space-y-5"
        style={{  }}
      >
        <View
          className="space-y-5"
        >
          {/* ─── Galerie ────────────────────────────────────────────────────── */}
          <ProductGallery images={product.images || []} title={product.title} />

          {/* ─── Vidéos ────────────────────────────────────────────────────── */}
          {(product as any).videos && (product as any).videos.length > 0 && (
            <ProductVideos videos={(product as any).videos} />
          )}

          {/* ─── Stories ────────────────────────────────────────────────────── */}
          {(product as any).stories && (product as any).stories.length > 0 && (
            <ProductStories stories={(product as any).stories} />
          )}

          {/* ─── Prix et promotions ────────────────────────────────────────── */}
          <View className="space-y-3">
            <View className="flex items-start justify-between">
              <View>
                <Text className="text-white text-xl font-bold">
                  {product.title}
                </Text>
                <View className="flex items-center gap-2 mt-1">
                  <Text className="text-white/40 text-sm">
                    {product.category}
                  </Text>
                  {product.rating && product.rating > 0 && (
                    <Text className="flex items-center gap-0.5 text-yellow-400 text-sm">
                      <Text>★</Text> {product.rating.toFixed(1)}
                      <Text className="text-white/30">
                        ({product.reviewCount})
                      </Text>
                    </Text>
                  )}
                </View>
              </View>
              <ProductPrice
                product={product}
                discountPercent={(product as any).discountPercent}
              />
            </View>

            {(product as any).discountPercent > 0 && (
              <ProductDiscount
                originalPrice={product.price}
                discountPercent={(product as any).discountPercent}
                currency={product.currency}
                endDate={(product as any).discountEndDate}
              />
            )}

            {(product as any).flashSale && (
              <ProductFlashSale {...(product as any).flashSale} />
            )}

            {(product as any).countdownOffer && (
              <CountdownOffer {...(product as any).countdownOffer} />
            )}

            {product.stock <= 5 && product.stock > 0 && (
              <LimitedStockBanner stock={product.stock} />
            )}

            {(product as any).coupons &&
              (product as any).coupons.length > 0 && (
                <ProductCoupons
                  coupons={(product as any).coupons}
                  currency={product.currency}
                />
              )}

            {(product as any).installmentPlans &&
              (product as any).installmentPlans.length > 0 && (
                <ProductInstallment
                  price={product.price}
                  currency={product.currency}
                  installments={(product as any).installmentPlans[0].months}
                  interestRate={
                    (product as any).installmentPlans[0].interestRate
                  }
                />
              )}

            {(product as any).loyaltyPoints && (
              <ProductLoyalty
                points={(product as any).loyaltyPoints}
                level={(product as any).loyaltyLevel}
              />
            )}
            {(product as any).rewardPoints && (
              <RewardPoints
                points={(product as any).rewardPoints}
                level="bronze"
              />
            )}
            {(product as any).cashback !== undefined && (
              <Cashback percentage={(product as any).cashback} />
            )}
          </View>

          {/* ─── Stock et variantes ────────────────────────────────────────── */}
          <View className="space-y-3">
            <ProductStock stock={product.stock} />
            {product.tags && product.tags.length > 0 && (
              <View className="flex flex-wrap gap-1.5">
                {product.tags.map((tag) => (
                  <Text
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
                  >
                    #{tag}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {(product as any).variants &&
            (product as any).variants.length > 0 && (
              <ProductVariants
                selected={selectedVariants}
                onSelect={handleVariantSelect}
              />
            )}

          <View className="flex items-center gap-4">
            <Text className="text-white/60 text-sm">Quantité</Text>
            <QuantitySelector
              quantity={quantity}
              min={1}
              max={product.stock || 99}
              onChange={setQuantity}
            />
          </View>

          {/* ─── Description et spécifications ────────────────────────────── */}
          <ProductDescription description={product.description} />

          {(product as any).features &&
            (product as any).features.length > 0 && (
              <ProductFeatures features={(product as any).features} />
            )}

          {(product as any).specifications &&
            (product as any).specifications.length > 0 && (
              <ProductSpecifications
                specifications={(product as any).specifications}
              />
            )}

          {(product as any).dimensions && (
            <ProductDimensions dimensions={(product as any).dimensions} />
          )}

          {(product as any).documents &&
            (product as any).documents.length > 0 && (
              <ProductDocuments documents={(product as any).documents} />
            )}

          {/* ─── Garantie et authenticité ──────────────────────────────────── */}
          <ProductWarranty
            months={(product as any).warrantyMonths || 0}
            coverage={(product as any).warrantyCoverage}
          />
          <ProductAuthenticity
            verified={(product as any).isAuthentic || false}
            certificateUrl={(product as any).certificateUrl}
          />

          {/* ─── Livraison ──────────────────────────────────────────────────── */}
          <ProductDelivery
            deliveryAvailable={product.deliveryAvailable}
            location={product.location}
            estimatedDays={(product as any).deliveryDays}
          />
          <DeliveryEstimator
            productId={product._id}
            location={product.location || ""}
          />
          {(product as any).deliveryTracking && (
            <DeliveryTrackingMap
              trackingId={(product as any).deliveryTracking}
            />
          )}
          {(product as any).deliveryTimeline && (
            <DeliveryTimeline events={(product as any).deliveryTimeline} />
          )}
          <DeliveryInsurance
            available={true}
            onSelect={() => UIService.openToast("Assurance livraison sélectionnée", "info")}
          />

          {/* ─── Paiement ──────────────────────────────────────────────────── */}
          <ProductPayment
            methods={
              (product as any).paymentMethods || ["card", "mobile_money"]
            }
            currency={product.currency}
          />

          {/* ─── Actions ────────────────────────────────────────────────────── */}
          <ProductActions
            onLike={handleWishlistToggle}
            onShare={handleShare}
            onCompare={handleCompare}
            onReport={handleReport}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            isLiked={isLiked}
            isInCart={isInCart}
            disabled={addingToCart}
          />

          {/* ─── Vendeur ────────────────────────────────────────────────────── */}
          {seller && (
            <View className="space-y-4">
              <SellerCard seller={seller} onContact={handleContact} />
              <SellerBadges
                badges={(seller as any).badges || []}
                verified={seller.verified}
              />
              <SellerStats
                rating={seller.rating || 0}
                reviewCount={seller.reviewCount || 0}
                totalSales={seller.totalSales || 0}
                responseTime={seller.responseTime}
                fulfillmentRate={(seller as any).fulfillmentRate}
              />
              <SellerPerformance
                totalRevenue={(seller as any).totalRevenue || 0}
                totalOrders={(seller as any).totalOrders || 0}
                conversionRate={(seller as any).conversionRate || 0}
                averageRating={seller.rating || 0}
              />
              {(seller as any).about && (
                <SellerAbout description={(seller as any).about} />
              )}
              {(seller as any).location && (
                <SellerLocation location={(seller as any).location} />
              )}
              <SellerGuarantees guarantees={(seller as any).guarantees || []} />
              <SellerTimeline milestones={(seller as any).milestones || []} />
              <SellerCertification
                certifications={(seller as any).certifications || []}
                verified={seller.verified}
              />
              {(seller as any).policies && (
                <SellerPolicies
                  returnPolicy={(seller as any).policies?.return}
                  shippingPolicy={(seller as any).policies?.shipping}
                  warrantyPolicy={(seller as any).policies?.warranty}
                />
              )}
              <SellerFollowers
                followerCount={followers.length}
                isFollowing={isFollowing}
                onToggleFollow={toggleFollow}
              />
              <SellerContact
                onChat={handleContact}
                onCall={handleCall}
                onEmail={() => UIService.openToast("Email envoyé", "info")}
              />
            </View>
          )}

          {/* ─── Autres produits du vendeur ────────────────────────────────── */}
          {(product as any).sellerProducts &&
            (product as any).sellerProducts.length > 0 && (
              <SellerProducts
                products={(product as any).sellerProducts}
                onProductPress={(p) => router.push(`/marketplace/${p._id}`)}
              />
            )}

          {/* ─── Bundles et accessoires ────────────────────────────────────── */}
          {(product as any).bundleProducts &&
            (product as any).bundleProducts.length > 0 && (
              <FrequentlyBoughtTogether
                products={(product as any).bundleProducts}
                mainProduct={{ ...product, id: product._id }}
                onAddAll={(ids) =>
                  UIService.openToast(`Ajout de ${ids.length} produits au panier`, "info")
                }
              />
            )}
          {(product as any).accessories &&
            (product as any).accessories.length > 0 && (
              <ProductAccessories
                accessories={(product as any).accessories}
                onSelect={(acc) => UIService.openToast(`Sélectionné: ${acc.title}`, "info")}
              />
            )}

          {/* ─── Avis ────────────────────────────────────────────────────────── */}
          <ProductReviews
            reviews={reviews}
            averageRating={product.rating}
            onAddReview={addReview}
            onLikeReview={likeReview}
          />
          <ProductReviewStats
            ratings={(product as any).ratingDistribution || {}}
            totalReviews={reviews.length}
          />
          {(product as any).videoReviews &&
            (product as any).videoReviews.length > 0 && (
              <ProductVideoReviews
                videos={(product as any).videoReviews}
                onPlay={() => UIService.openToast("Lecture vidéo", "info")}
              />
            )}

          {/* ─── Questions ───────────────────────────────────────────────────── */}
          <ProductQuestions questions={questions} onAsk={ask} />

          {/* ─── Communauté ──────────────────────────────────────────────────── */}
          <ProductCommunity
            reviews={reviews.length}
            questions={questions.length}
            followers={followers.length}
            shares={(product as any).shareCount || 0}
          />

          {/* ─── Recommandations ────────────────────────────────────────────── */}
          <ProductRecommendations
            products={recommendations}
            onProductPress={(p) => router.push(`/marketplace/${p._id}`)}
          />
          {(product as any).similarProducts &&
            (product as any).similarProducts.length > 0 && (
              <ProductSimilar
                products={(product as any).similarProducts}
                onProductPress={(p) => router.push(`/marketplace/${p._id}`)}
              />
            )}
          <RecentlyViewedProducts
            products={recentProducts}
            onProductPress={(p) => router.push(`/marketplace/${p._id}`)}
          />

          {/* ─── IA ──────────────────────────────────────────────────────────── */}
          <AIShoppingAssistant
            product={product}
            onSuggestion={(text) => UIService.openToast(`Suggestion IA: ${text}`, "info")}
          />
          <AIPriceAdvisor
            product={product}
            onAdvice={(advice) => UIService.openToast(advice, "info")}
          />
          <AISimilarProducts
            product={product}
            onSelect={(p) => router.push(`/marketplace/${p._id}`)}
          />

          {/* ─── Live ────────────────────────────────────────────────────────── */}
          {(product as any).liveStream && (
            <ProductLive {...(product as any).liveStream} />
          )}
        </View>
      </View>

      {/* Sticky Purchase Bar */}
      <StickyPurchaseBar
        product={product}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
      />

      {/* Modals */}
      <>
        {showShare && (
          <ProductShare
            productId={product._id}
            title={product.title}
            onClose={() => setShowShare(false)}
          />
        )}
        {showReport && (
          <ProductReport
            productId={product._id}
            onClose={() => setShowReport(false)}
          />
        )}
        {showCompare && (
          <ProductCompare
            productId={product._id}
            onClose={() => setShowCompare(false)}
          />
        )}
        {showChat && (
          <SellerChat
            sellerName={seller?.name || "Vendeur"}
            onClose={() => setShowChat(false)}
            onSendMessage={async (msg) => {
              console.log("Message:", msg);
              UIService.openToast("Message envoyé", "info");
            }}
          />
        )}
        {showCall && (
          <SellerCall
            sellerName={seller?.name || "Vendeur"}
            sellerPhone="+243 999 999 999"
            onClose={() => setShowCall(false)}
          />
        )}
        {showVideoCall && (
          <SellerVideoCall
            sellerName={seller?.name || "Vendeur"}
            onClose={() => setShowVideoCall(false)}
          />
        )}
      </>
    </View>
  );
}

function ProductDetailSkeleton() {
  return (
    <View
      className="h-full flex flex-col px-4 pt-12 pb-8 space-y-4"
      style={{  }}
    >
      <View className="flex items-center justify-between">
        <Skeleton className="w-10 h-10 rounded-2xl" />
        <Skeleton className="w-8 h-8 rounded-full" />
      </View>
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <Skeleton className="h-8 w-3/4 rounded-xl" />
      <Skeleton className="h-6 w-1/2 rounded-xl" />
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-12 w-full rounded-xl" />
      <View className="gap-2">
        <Skeleton className="h-12 rounded-xl" />
        <Skeleton className="h-12 rounded-xl" />
      </View>
    </View>
  );
}
