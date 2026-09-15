import { View, Text, Pressable } from "react-native";
import { AlertTriangle, Plus, Minus } from "lucide-react-native";

interface InventoryItem {
  name: string;
  stockLevel: number;
  unit: string;
  minimumLimit: number;
  perishableDays: number;
}

interface InventoryManagementProps {
  items: InventoryItem[];
  onUpdateStock: (name: string, delta: number) => void;
}

export function InventoryManagement({
  items,
  onUpdateStock,
}: InventoryManagementProps) {
  return (
    <View className="space-y-3 text-left"><View className="flex justify-between items-center px-1"><Text className="text-xs font-bold uppercase tracking-wider text-white">Inventaire Ingrédients
        </Text><Text className="text-[10px] text-white/40 uppercase font-black">Seuils Alerte
        </Text></View><View className="space-y-2.5">{items.map((item) => {
          const isCriticalStock = item.stockLevel <= item.minimumLimit;
          const isPerishingSoon = item.perishableDays <= 3;

          return (
            <View key={item.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4"><View className="min-w-0 flex-1"><View className="flex items-center gap-1.5"><Text className="font-extrabold text-xs text-white truncate">{item.name}</Text>{(isCriticalStock || isPerishingSoon) && (
                    <Text className="text-rose-400 shrink-0" title="Alerte Approvisionnement"><AlertTriangle size={13} /></Text>
                  )}</View><View className="flex items-center gap-2 mt-1 text-[10px] text-white/30 flex-wrap"><Text>Stock minimum : {item.minimumLimit}{item.unit}</Text><Text>•</Text><Text className={isPerishingSoon
                        ? "text-rose-400 font-bold"
                        : "text-white/30"}>Péremption : {item.perishableDays}jours
                  </Text></View></View>{}<View className="flex items-center gap-3 shrink-0"><Text className={`text-xs font-mono font-black ${isCriticalStock ? "text-rose-400" : "text-white/80"}`}>{item.stockLevel}{item.unit}</Text><View className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/10"><Pressable onPress={() => onUpdateStock(item.name, -1)} className="w-6 h-6 rounded-md flex items-center justify-center bg-white/10 text-white font-bold"><Minus size={10} /></Pressable><Pressable onPress={() => onUpdateStock(item.name, 1)} className="w-6 h-6 rounded-md flex items-center justify-center bg-white/10 text-white font-bold"><Plus size={10} /></Pressable></View></View></View>
          );
        })}</View></View>
  );
}
