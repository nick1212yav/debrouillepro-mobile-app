import { View, Text } from "react-native";
import { FileText } from "lucide-react-native";
import type { InvoiceMetadata } from "../../payments/InvoiceGenerator";

interface InvoiceViewerProps {
  metadata: InvoiceMetadata;
}

export function InvoiceViewer({ metadata }: InvoiceViewerProps) {
  const formattedDate = new Date(metadata.issuedAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  );

  return (
    <View className="p-5 rounded-3xl bg-white/[0.01] border border-white/[0.06] text-left space-y-4">
      <View className="flex justify-between items-start gap-4 pb-4 border-b border-white/[0.06]">
        <View>
          <View className="flex items-center gap-1.5 mb-1.5">
            <FileText size={16} className="text-orange-400" />
            <Text className="text-xs font-bold uppercase tracking-wider text-white">
              Facture Commerciale
            </Text>
          </View>
          <Text className="text-xs font-mono font-bold text-white/40">
            {metadata.invoiceNumber}
          </Text>
        </View>

        <View className="text-right">
          <Text className="block text-[8px] text-white/30 uppercase font-black">
            Date d'émission
          </Text>
          <Text className="text-xs text-white/70 font-medium">
            {formattedDate}
          </Text>
        </View>
      </View>

      <View className="gap-4 text-xs">
        <View>
          <Text className="block text-[8px] text-white/30 uppercase font-black mb-1">
            Destinataire
          </Text>
          <Text className="font-bold text-white block">
            {metadata.clientName}
          </Text>
          <Text className="text-white/50 block mt-1">
            Plateforme DébrouillePro
          </Text>
        </View>
        <View className="text-right">
          <Text className="block text-[8px] text-white/30 uppercase font-black mb-1">
            Émetteur
          </Text>
          <Text className="font-bold text-white block">
            {metadata.restaurantName}
          </Text>
          <Text className="text-white/50 block mt-1">Cuisine Agrée</Text>
        </View>
      </View>

      {/* Lignes de Facturation */}
      <View className="space-y-3 py-3 border-t border-b border-white/[0.06]">
        <Text className="block text-[8px] text-white/30 uppercase font-black">
          Lignes d'achats
        </Text>
        {metadata.lines.map((line, i) => (
          <View key={i} className="flex justify-between items-center text-xs">
            <View>
              <Text className="font-semibold text-white/95">
                {line.description}
              </Text>
              <Text className="text-[10px] text-white/40 block mt-0.5">
                {line.quantity} x {line.unitPrice.toLocaleString()} FCFA
              </Text>
            </View>
            <Text className="font-extrabold text-white">
              {line.total.toLocaleString()} FCFA
            </Text>
          </View>
        ))}
      </View>

      {/* Rapprochement total */}
      <View className="space-y-1.5 text-xs">
        <View className="flex justify-between text-white/50">
          <Text>Sous-total HT</Text>
          <Text>{metadata.subtotal.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-white/50">
          <Text>Frais Logistique & Livraison</Text>
          <Text>{metadata.deliveryFee.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-white/50">
          <Text>Taxes locales (5%)</Text>
          <Text>{metadata.tax.toLocaleString()} FCFA</Text>
        </View>
        <View className="flex justify-between text-sm font-black text-white pt-2.5 border-t border-white/[0.06]">
          <Text><Text>MONTANT TOTAL TTC</Text></Text>
          <Text className="text-orange-400">
            {metadata.totalAmount.toLocaleString()} <Text>FCFA</Text></Text>
        </View>
      </View>
    </View>
  );
}
