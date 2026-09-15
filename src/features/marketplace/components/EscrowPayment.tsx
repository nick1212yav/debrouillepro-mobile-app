import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/EscrowPayment.tsx
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Shield,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  X,
  CreditCard,
  Smartphone,
  Building,
  DollarSign,
  ArrowRight,
  Lock,
} from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EscrowPaymentProps {
  amount: number;
  currency: string;
  sellerId: Id<"users">;
  orderId?: Id<"orders">;
  productId?: Id<"products">;
  onSuccess?: (transactionId: string) => void;
  onCancel?: () => void;
  onClose?: () => void;
}

type PaymentMethod = "mobile_money" | "card" | "bank_transfer";
type EscrowStatus =
  | "idle"
  | "pending"
  | "confirmed"
  | "released"
  | "disputed"
  | "cancelled";

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { value: "mobile_money", label: "Mobile Money", icon: Smartphone },
  { value: "card", label: "Carte bancaire", icon: CreditCard },
  { value: "bank_transfer", label: "Virement bancaire", icon: Building },
];

// ─── Composant ─────────────────────────────────────────────────────────────────

export function EscrowPayment({
  amount,
  currency,
  sellerId,
  orderId,
  productId,
  onSuccess,
  onCancel,
  onClose,
}: EscrowPaymentProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("mobile_money");
  const [status, setStatus] = useState<EscrowStatus>("idle");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // ── Stubs : remplacent les appels Convex ──────────────────────────────────

  // ✅ Toutes les fonctions sont des stubs avec console.log et Promise.resolve()
  const initiatePayment = async (args: any) => {
    console.log("[EscrowPayment] initiatePayment stub", args);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { transactionId: "ESCROW-" + Date.now() };
  };

  const confirmPayment = async (args: any) => {
    console.log("[EscrowPayment] confirmPayment stub", args);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true };
  };

  const releasePayment = async (args: any) => {
    console.log("[EscrowPayment] releasePayment stub", args);
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true };
  };

  const cancelPayment = async (args: any) => {
    console.log("[EscrowPayment] cancelPayment stub", args);
    await new Promise((resolve) => setTimeout(resolve, 600));
    return { success: true };
  };

  const getEscrowStatus = async (args: any) => {
    console.log("[EscrowPayment] getEscrowStatus stub", args);
    await new Promise((resolve) => setTimeout(resolve, 300));
    return { status: "confirmed" };
  };

  // ── Simulation du suivi du statut ─────────────────────────────────────────

  useEffect(() => {
    if (status === "pending") {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            // Simuler la confirmation après 100%
            setTimeout(() => {
              setStatus("confirmed");
              setProgress(100);
              toast.success("Paiement confirmé ! Les fonds sont sécurisés.");
            }, 500);
            return 100;
          }
          return p + 10;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [status]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!selectedMethod) {
      toast.error("Veuillez sélectionner un mode de paiement");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await initiatePayment({
        amount,
        currency,
        sellerId,
        orderId,
        productId,
        method: selectedMethod,
      });

      setTransactionId(result.transactionId);
      toast.info("Paiement en cours de validation...");
    } catch (err) {
      console.error("Erreur paiement:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
      toast.error("Erreur lors du paiement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!transactionId) return;
    setIsLoading(true);
    try {
      await confirmPayment({ escrowId: transactionId });
      toast.success("Paiement confirmé ! Les fonds sont sécurisés.");
    } catch (err) {
      toast.error("Erreur lors de la confirmation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!transactionId) return;
    setIsLoading(true);
    try {
      await releasePayment({ escrowId: transactionId });
      toast.success("Fonds libérés au vendeur !");
      if (onSuccess) onSuccess(transactionId);
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      toast.error("Erreur lors de la libération des fonds");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!transactionId) {
      if (onCancel) onCancel();
      if (onClose) onClose();
      return;
    }
    if (status === "pending" || status === "confirmed") {
      if (!confirm("Voulez-vous vraiment annuler ce paiement ?")) return;
    }
    setIsLoading(true);
    try {
      await cancelPayment({ escrowId: transactionId });
      toast.info("Paiement annulé");
      if (onCancel) onCancel();
      if (onClose) onClose();
    } catch (err) {
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsLoading(false);
    }
  };

  // ── UI helpers ─────────────────────────────────────────────────────────────

  const renderMethodIcon = (method: PaymentMethod) => {
    const found = PAYMENT_METHODS.find((m) => m.value === method);
    if (!found) return <CreditCard size={20} />;
    const Icon = found.icon;
    return <Icon size={20} />;
  };

  const getStatusDisplay = () => {
    switch (status) {
      case "idle":
        return { label: "Prêt", color: "text-white/40", icon: null };
      case "pending":
        return {
          label: "En attente de confirmation",
          color: "text-yellow-400",
          icon: Clock,
        };
      case "confirmed":
        return {
          label: "Confirmé - Fonds sécurisés",
          color: "text-green-400",
          icon: Shield,
        };
      case "released":
        return {
          label: "Fonds libérés au vendeur",
          color: "text-green-400",
          icon: CheckCircle,
        };
      case "disputed":
        return {
          label: "Litige en cours",
          color: "text-red-400",
          icon: AlertCircle,
        };
      case "cancelled":
        return { label: "Annulé", color: "text-red-400", icon: X };
      default:
        return { label: "", color: "", icon: null };
    }
  };

  const statusDisplay = getStatusDisplay();

  // ─── Rendu ───────────────────────────────────────────────────────────────────

  return (
    <View className="space-y-5">{}<View className="flex items-center justify-between"><View className="flex items-center gap-2.5"><View className="p-2 rounded-xl bg-orange-500/20"><Shield size={20} className="text-orange-400" /></View><View><Text className="text-white font-bold text-base">Paiement sécurisé
            </Text><Text className="text-white/40 text-xs">Les fonds sont bloqués jusqu'à validation
            </Text></View></View>{onClose && (
          <Pressable onPress={onClose} className="text-white/40 transition-colors"><X size={18} /></Pressable>
        )}</View>{}<View className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5"><View><Text className="text-white/40 text-xs">Montant à payer</Text><Text className="text-white font-bold text-xl">{amount.toLocaleString()}{currency}</Text></View><View className="text-right"><Text className="text-white/40 text-xs">Statut</Text><View className="flex items-center gap-1.5">{statusDisplay.icon && (
              <statusDisplay.icon size={14} className={statusDisplay.color} />
            )}<Text className={`text-sm font-medium ${statusDisplay.color}`}>{statusDisplay.label}</Text></View></View></View>{}{status === "idle" && (
        <>
          <View className="space-y-2"><Text className="text-white/60 text-xs font-medium">Mode de paiement
            </Text><View className="gap-2">{PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                return (
                  <Pressable key={method.value} onPress={() => setSelectedMethod(method.value)} className={`
                      p-3 rounded-xl text-center transition-all
                      ${
                        selectedMethod === method.value
                          ? "bg-orange-500/20 border border-orange-500/40"
                          : "bg-white/5 border border-white/5 hover:bg-white/10"
                      }
                    `}><Icon size={20} className={
                        selectedMethod === method.value
                          ? "text-orange-400"
                          : "text-white/40"
                      } /><Text className={`text-[10px] mt-1 ${selectedMethod === method.value ? "text-white" : "text-white/40"}`}>{method.label}</Text></Pressable>
                );
              })}</View></View>

          <Pressable onPress={handleSubmit} disabled={isLoading} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50">{isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                Payer {amount.toLocaleString()} {currency}
                <ArrowRight size={16} />
              </>
            )}</Pressable>
        </>
      )}{}{status === "pending" && (
        <View className="space-y-3"><View className="flex items-center justify-between text-sm"><Text className="text-white/60">Validation en cours...</Text><Text className="text-white/60">{progress}%</Text></View><View className="w-full h-2 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${progress}%` }} initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} /></View><View className="flex items-center gap-2 text-white/40 text-xs"><Lock size={12} /><Text>Vos fonds sont sécurisés, en attente de confirmation</Text></View><Pressable onPress={handleCancel} className="w-full py-2 rounded-xl bg-white/5 text-white/40 text-sm transition-colors"><Text>Annuler le paiement</Text></Pressable></View>
      )}{}{status === "confirmed" && (
        <View className="space-y-3"><View className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20"><Shield size={20} className="text-green-400" /><View className="flex-1"><Text className="text-white font-medium text-sm">Paiement confirmé
              </Text><Text className="text-white/60 text-xs">Les fonds sont sécurisés. Confirmez la réception pour libérer le
                paiement.
              </Text></View></View><View className="flex gap-2"><Pressable onPress={handleRelease} disabled={isLoading} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">{isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Confirmer la réception"
              )}</Pressable><Pressable onPress={() => {
                setStatus("disputed");
                toast.warning("Litige ouvert. Un médiateur va intervenir.");
              }} className="flex-1 py-2.5 rounded-xl bg-red-500/20 text-red-400 font-medium text-sm transition-colors"><Text>Signaler un litige</Text></Pressable></View></View>
      )}{}{status === "released" && (
        <View className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20"><CheckCircle size={24} className="text-green-400" /><View><Text className="text-white font-medium">Paiement libéré</Text><Text className="text-white/60 text-xs">Les fonds ont été transférés au vendeur.
            </Text></View></View>
      )}{}{status === "disputed" && (
        <View className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20"><AlertCircle size={24} className="text-red-400" /><View><Text className="text-white font-medium">Litige en cours</Text><Text className="text-white/60 text-xs">Un médiateur examinera votre dossier sous 24h.
            </Text></View></View>
      )}{}{status === "cancelled" && (
        <View className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
          <X size={20} className="text-white/40" />
          <Text className="text-white/60 text-sm">Paiement annulé</Text>
        </View>
      )}{}{error && (
        <View className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={14} />
          <Text>{error}</Text>
          <Pressable onPress={() => setError(null)} className="ml-auto text-red-400/70">
            <X size={14} />
          </Pressable>
        </View>
      )}{}<Text className="text-white/20 text-[10px] text-center">Paiement sécurisé par séquestre. Les fonds ne sont libérés qu'après
        validation de la réception.
      </Text></View>
  );
}
