import { View, Text } from "react-native";
import { PaymentGateway } from "../../types/enums";
import {
  CreditCard,
  Smartphone,
  Check,
  HelpCircle,
  DollarSign,
} from "lucide-react-native";

interface OrderPaymentProps {
  paymentMethod: PaymentGateway | string;
  totalAmount: number;
  transactionId?: string;
  isPaid: boolean;
}

export function OrderPayment({
  paymentMethod,
  totalAmount,
  transactionId,
  isPaid,
}: OrderPaymentProps) {
  const getGatewayConfig = (method: string) => {
    switch (method) {
      case PaymentGateway.CARD:
        return {
          label: "Carte Bancaire",
          icon: CreditCard,
          color: "text-sky-400",
        };
      case PaymentGateway.CASH:
        return {
          label: "Paiement en espèces",
          icon: DollarSign,
          color: "text-amber-400",
        };
      case PaymentGateway.ORANGE_MONEY:
      case PaymentGateway.MTN:
      case PaymentGateway.MOOV:
      case PaymentGateway.WAVE:
        return {
          label: `Mobile Money (${method.toUpperCase().replace("_", " ")})`,
          icon: Smartphone,
          color: "text-emerald-400",
        };
      default:
        return {
          label: "Passerelle Digitale",
          icon: HelpCircle,
          color: "text-white/40",
        };
    }
  };

  const config = getGatewayConfig(paymentMethod);
  const Icon = config.icon;

  return (
    <View className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-left space-y-3"><View className="flex justify-between items-center"><Text className="text-xs font-bold uppercase tracking-wider text-white/40">Mode de règlement
        </Text>{isPaid ? (
          <Text className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider"><Check size={10} />Payé
          </Text>
        ) : (
          <Text className="inline-flex items-center gap-1 text-[10px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">Attente règlement
          </Text>
        )}</View><View className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"><Icon size={16} className={config.color} /><View><Text className="block text-xs font-extrabold text-white">{config.label}</Text><Text className="block text-[10px] text-white/40 mt-0.5">Montant : {totalAmount.toLocaleString()}FCFA
          </Text></View></View>{transactionId && (
        <View className="flex justify-between items-center text-[10px] text-white/30 pt-1.5 border-t border-white/[0.04]">
          <Text>Numéro de transaction</Text>
          <Text className="font-mono">{transactionId}</Text>
        </View>
      )}</View>
  );
}
