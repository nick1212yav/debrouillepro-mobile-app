import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  Trash,
  MapPin,
  Tag,
  ShieldCheck,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  CheckCircle,
  FileText,
} from "lucide-react-native";

// Imports d'interfaces typées conformes à verbatimModuleSyntax
import type { CartItemRecord } from "../hooks/useCart";
import type { InvoiceMetadata } from "../payments/InvoiceGenerator";

// Imports de l'architecture d'ingénierie du module
import { useCart } from "../hooks/useCart";
import { useOrder } from "../hooks/useOrder";
import { usePayment } from "../hooks/usePayment";
import { useAIRecommendations } from "../hooks/useAIRecommendations";
import { useRestaurant } from "../hooks/useRestaurant";

// Imports des composants réutilisables du module
import { OrderSummary } from "../components/order/OrderSummary";
import { PaymentMethods } from "../components/payment/PaymentMethods";
import { ReceiptDownload } from "../components/payment/ReceiptDownload";
import { InvoiceGenerator } from "../payments/InvoiceGenerator";

// Correction d'import de chemin TS2307
import { PaymentForm } from "../forms/PaymentForm";

interface RestaurationCartPageProps {
  restaurantId: number;
  onBack: () => void;
  onNavigateHome: () => void;
}

export default function RestaurationCartPage({
  restaurantId,
  onBack,
  onNavigateHome,
}: RestaurationCartPageProps) {
  const { restaurant } = useRestaurant(restaurantId);
  const {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartItemsCount,
  } = useCart();
  const { placeOrder } = useOrder();
  const { processPayment, isProcessing: isPaying } = usePayment();
  const { getMealNutritionAnalysis } = useAIRecommendations();

  const [checkoutStep, setCheckoutStep] = useState<
    "cart" | "payment" | "success"
  >("cart");

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [selectedPayment, setSelectedPayment] =
    useState<string>("mobile_money");
  const [couponCode, setCouponCode] = useState("");
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);

  const [showNutritionPanel, setShowNutritionPanel] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedInvoice, setConfirmedInvoice] =
    useState<InvoiceMetadata | null>(null);

  const deliveryFee = restaurant?.deliveryFee || 1000;
  const tax = useMemo(() => Math.round(cartTotal * 0.05), [cartTotal]);

  const finalTotal = useMemo(() => {
    const rawTotal = cartTotal + deliveryFee + tax - discountAmount;
    return Math.max(0, rawTotal);
  }, [cartTotal, deliveryFee, tax, discountAmount]);

  const nutritionAnalysis = useMemo(() => {
    if (cartItemsCount === 0) return null;
    const itemsForAnalysis = Object.values(cart).map((item) => ({
      item: { name: item.name, price: item.price },
      quantity: item.quantity,
      nutrition: {
        calories: 350,
        proteins: 15,
        carbohydrates: 40,
        lipids: 10,
        sodium: 480,
        fiber: 3,
      },
    }));
    return getMealNutritionAnalysis(itemsForAnalysis);
  }, [cart, cartItemsCount, getMealNutritionAnalysis]);

  const handleApplyCoupon = () => {
    if (couponCode.trim().toUpperCase() === "MAMA225") {
      const discount = Math.round(cartTotal * 0.15);
      setDiscountAmount(discount);
      setIsCouponApplied(true);
      UIService.openToast("Coupon MAMA225 appliqué : -15% sur vos plats !", "success");
    } else {
      UIService.openToast("Code de réduction invalide ou expiré.", "error");
    }
  };

  const handleStepNavigation = () => {
    if (checkoutStep === "cart") {
      if (!deliveryAddress.trim()) {
        UIService.openToast("Veuillez renseigner une adresse exacte de livraison.", "error");
        return;
      }
      setCheckoutStep("payment");
    }
  };

  const handlePaymentSubmit = async (paymentDetails: any) => {
    if (!restaurant) return;

    // Alignement de structure attendu par placeOrder
    const orderItems = Object.values(cart).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
    }));

    // Alignement de structure attendu par checkout (TS2322 : price exigé par CheckoutSessionPayload)
    const checkoutItems = Object.values(cart).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const orderResponse = await placeOrder({
      restaurantId,
      userId: "USER_CURRENT_REACTIVE_ID",
      items: orderItems,
      deliveryAddress,
      paymentMethod: selectedPayment,
    });

    if (!orderResponse.success || !orderResponse.order) {
      UIService.openToast("Échec d'enregistrement de votre commande en cuisine.", "error");
      return;
    }

    const response = await processPayment({
      orderId: orderResponse.order.id,
      clientName: "Client DébrouillePro",
      clientEmail: "client@debrouillepro.com",
      restaurantName: restaurant.name,
      items: checkoutItems, // Correction de mappage de type de l'item
      deliveryFee: restaurant.deliveryFee,
      paymentMethod: selectedPayment as any,
      paymentDetails,
    });

    if (response.success && response.invoice) {
      setConfirmedOrderId(orderResponse.order.id);
      setConfirmedInvoice(response.invoice);
      clearCart();
      setCheckoutStep("success");
    } else {
      UIService.openToast(response.errorMessage || "Échec lors de la validation du prélèvement.", "error");
    }
  };

  return (
    <View className="h-full w-full flex flex-col relative text-white bg-[#020617]">
      <View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] flex items-center gap-3">
        <Pressable
          onPress={
            checkoutStep === "payment" ? () => setCheckoutStep("cart") : onBack
          }
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
        >
          <ArrowLeft size={18} />
        </Pressable>
        <View className="flex-1 text-left">
          <Text className="text-lg font-black text-white leading-none">
            {checkoutStep === "success"
              ? "Commande Validée"
              : "Caisse & Panier"}
          </Text>
          <Text className="text-[10px] text-white/40 mt-1 uppercase tracking-wider font-bold">
            {checkoutStep === "cart" && "Validation du panier"}
            {checkoutStep === "payment" && "Validation du règlement"}
            {checkoutStep === "success" && "Reçu de facturation"}
          </Text>
        </View>
      </View>

      <View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">
        <>
          {checkoutStep === "cart" && (
            <View
              key="step_cart"
              className="space-y-4 text-left"
            >
              <View className="space-y-3">
                <View className="flex justify-between items-center px-1 text-white/40 text-[10px] font-black uppercase tracking-wider">
                  <Text>Articles sélectionnés ({cartItemsCount})</Text>
                  {cartItemsCount > 0 && (
                    <Pressable
                      onPress={clearCart}
                      className="text-rose-400 flex items-center gap-1"
                    >
                      <Trash size={12} /> <Text>Vider</Text></Pressable>
                  )}
                </View>

                {cartItemsCount > 0 ? (
                  <View className="space-y-2.5">
                    {Object.values(cart).map((item) => (
                      <View
                        key={item.name}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4"
                      >
                        <View className="min-w-0 pr-2">
                          <Text className="font-extrabold text-sm text-white block truncate">
                            {item.name}
                          </Text>
                          <Text className="text-xs font-black text-orange-400/80 mt-1">
                            {(item.price * item.quantity).toLocaleString()} FCFA
                          </Text>
                        </View>

                        <View className="flex items-center gap-2.5 bg-orange-500/10 border border-orange-500/30 rounded-lg p-0.5 shrink-0">
                          <Pressable
                            onPress={() => removeFromCart(item.name)}
                            className="w-6.5 h-6.5 rounded-md flex items-center justify-center bg-orange-500/25 text-white font-bold"
                          >
                            <Minus size={11} />
                          </Pressable>
                          <Text className="text-xs font-black text-orange-400 min-w-4 text-center">
                            {item.quantity}
                          </Text>
                          <Pressable
                            onPress={() =>
                              addToCart({
                                name: item.name,
                                price: item.price,
                              } as any)
                            }
                            className="w-6.5 h-6.5 rounded-md flex items-center justify-center bg-orange-500/25 text-white font-bold"
                          >
                            <Plus size={11} />
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View className="text-center py-16 text-white/30 text-xs flex flex-col items-center gap-2">
                    <ShoppingBag size={24} className="text-white/10" />
                    <Text>Votre panier d'achat est vide.</Text>
                  </View>
                )}
              </View>

              {cartItemsCount > 0 && (
                <>
                  <View className="space-y-2">
                    <Text className="block text-[10px] text-white/40 uppercase font-bold px-1">
                      Lieu de livraison exact
                    </Text>
                    <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                      <MapPin size={15} className="text-white/40 shrink-0" />
                      <TextInput
                       
                        placeholder="Ex: Villa 45, Rue de la Pharmacie des Allées, Riviera 3"
                        value={deliveryAddress}
                        onChangeText={(text) => setDeliveryAddress(text)}
                        className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/20"
                       />
                    </View>
                  </View>

                  <View className="space-y-2 pt-2 border-t border-white/[0.04]">
                    <Text className="block text-[10px] text-white/40 uppercase font-bold px-1">
                      Code promo (Optionnel)
                    </Text>
                    <View className="flex gap-2">
                      <View className="flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
                        <Tag size={15} className="text-white/40 shrink-0" />
                        <TextInput
                         
                          placeholder="Saisir votre code (Ex: MAMA225)"
                          value={couponCode}
                          onChangeText={(text) =>
                            setCouponCode(text.toUpperCase())
                          }
                         
                          className="flex-1 bg-transparent text-xs text-white font-mono outline-none placeholder:text-white/20"
                         editable={!(isCouponApplied)}/>
                      </View>
                      <Pressable
                       
                        onPress={handleApplyCoupon}
                        disabled={isCouponApplied || !couponCode.trim()}
                        className="px-4 py-3 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider"
                      >
                        <Text>Appliquer</Text></Pressable>
                    </View>
                  </View>

                  {nutritionAnalysis && (
                    <View className="p-3.5 rounded-2xl bg-gradient-to-tr from-orange-500/[0.04] to-amber-500/[0.02] border border-orange-500/15 text-left space-y-2">
                      <View className="flex items-center justify-between">
                        <View className="flex items-center gap-1.5 text-orange-400">
                          <Sparkles size={14} className="animate-pulse" />
                          <Text className="text-[10px] font-black uppercase tracking-wider">
                            Diagnostic nutritionnel IA
                          </Text>
                        </View>
                        <Pressable
                         
                          onPress={() =>
                            setShowNutritionPanel(!showNutritionPanel)
                          }
                          className="text-[9px] uppercase font-black text-white/40 tracking-wider flex items-center gap-0.5"
                        >
                          {showNutritionPanel ? "Masquer" : "Consulter"}
                        </Pressable>
                      </View>

                      {showNutritionPanel && (
                        <View className="text-xs text-white/60 leading-relaxed font-normal pt-2 border-t border-white/[0.04] space-y-1.5">
                          <View className="flex justify-between font-mono text-[10px]">
                            <Text>Estimation calorique :</Text>
                            <Text className="font-extrabold text-white">
                              {nutritionAnalysis.totalMacros.calories} kcal
                            </Text>
                          </View>
                          <Text className="italic font-normal">
                            "{nutritionAnalysis.nutritionAdvice[0]}"
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  <View className="space-y-2 pt-4 border-t border-white/[0.04]">
                    <View className="space-y-1.5 text-xs text-white/50">
                      <View className="flex justify-between">
                        <Text>Sous-total</Text>
                        <Text>{cartTotal.toLocaleString()} FCFA</Text>
                      </View>
                      <View className="flex justify-between">
                        <Text>Frais de livraison</Text>
                        <Text>{deliveryFee.toLocaleString()} FCFA</Text>
                      </View>
                      <View className="flex justify-between">
                        <Text>Taxes (5%)</Text>
                        <Text>{tax.toLocaleString()} FCFA</Text>
                      </View>
                      {isCouponApplied && (
                        <View className="flex justify-between text-orange-400 font-bold">
                          <Text>Remise Promo</Text>
                          <Text>- {discountAmount.toLocaleString()} FCFA</Text>
                        </View>
                      )}
                      <View className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/[0.04]">
                        <Text>Montant final TTC</Text>
                        <Text className="text-orange-400">
                          {finalTotal.toLocaleString()} FCFA
                        </Text>
                      </View>
                    </View>

                    <Pressable
                     
                      onPress={handleStepNavigation}
                      className="w-full py-4 rounded-xl bg-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
                    >
                      <Text>Procéder à la caisse (</Text>{cartItemsCount}<Text>)</Text></Pressable>
                  </View>
                </>
              )}
            </View>
          )}

          {checkoutStep === "payment" && (
            <View
              key="step_payment"
              className="space-y-4"
            >
              <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left">
                <Text className="block text-[8px] text-white/30 uppercase font-black mb-1">
                  Résumé de facturation
                </Text>
                <View className="flex justify-between items-center text-xs">
                  <Text className="text-white/60">Total TTC à prélever</Text>
                  <Text className="text-base font-black text-orange-400">
                    {finalTotal.toLocaleString()} FCFA
                  </Text>
                </View>
              </View>

              <PaymentMethods
                selectedMethod={selectedPayment}
                onChange={setSelectedPayment}
                totalAmount={finalTotal}
              />

              {selectedPayment !== "cash" && (
                <PaymentForm
                  gateway={selectedPayment as any}
                  amount={finalTotal}
                  onSubmit={handlePaymentSubmit}
                  isSubmitting={isPaying}
                />
              )}

              {selectedPayment === "cash" && (
                <Pressable
                 
                  onPress={() => handlePaymentSubmit({})}
                  disabled={isPaying}
                  className="w-full py-4 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
                  style={{  }}
                >
                  <ShieldCheck size={14} />
                  {isPaying
                    ? "Génération du reçu..."
                    : "Confirmer et Payer en Espèces"}
                </Pressable>
              )}
            </View>
          )}

          {checkoutStep === "success" &&
            confirmedOrderId &&
            confirmedInvoice && (
              <View
                key="step_success"
                className="space-y-5 text-center py-6"
              >
                <View className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle size={32} />
                </View>

                <View className="space-y-1">
                  <Text className="text-lg font-black text-white">
                    Commande en Préparation !
                  </Text>
                  <Text className="text-xs text-white/50 leading-relaxed font-normal px-4">
                    Votre transaction a été validée. Le restaurant prépare
                    actuellement vos plats avec le plus grand soin.
                  </Text>
                </View>

                <View className="text-left bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-3">
                  <View className="flex justify-between items-center text-xs">
                    <Text className="text-white/40">ID de transaction</Text>
                    <Text className="font-mono font-bold text-white/80">
                      {confirmedOrderId}
                    </Text>
                  </View>
                  <View className="flex justify-between items-center text-xs">
                    <Text className="text-white/40">Émetteur du reçu</Text>
                    <Text className="font-bold text-white">
                      {restaurant?.name}
                    </Text>
                  </View>
                  <View className="flex justify-between items-center text-xs">
                    <Text className="text-white/40"><Text>Adresse de livraison</Text></Text>
                    <Text className="font-medium text-white/80 truncate max-w-[200px]">
                      {deliveryAddress}
                    </Text>
                  </View>
                </View>

                <ReceiptDownload
                  invoiceNumber={confirmedInvoice.invoiceNumber}
                />

                <Pressable
                  onPress={onNavigateHome}
                  className="w-full py-4 rounded-xl bg-orange-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
                >
                  <Text>Retour au Catalogue Principal</Text></Pressable>
              </View>
            )}
        </>
      </View>
    </View>
  );
}
