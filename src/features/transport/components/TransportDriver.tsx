import { View, Text, Image, Linking } from "react-native";

// src/features/transport/components/TransportDriver.tsx
import { Star, Phone, MessageSquare, ShieldCheck, Mail } from "lucide-react-native";
import { Button } from "@/components/ui/button";

interface TransportDriverProps {
  name: string;
  rating?: number;
  phone?: string;
  email?: string;
  verified?: boolean;
  avatar?: string;
}

export function TransportDriver({
  name,
  rating = 4.8,
  phone,
  email,
  verified = true,
  avatar,
}: TransportDriverProps) {
  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (phone) {
      const cleanPhone = phone.replace(/\s+/g, "");
      Linking.openURL(String(`https://wa.me/${cleanPhone}`));
    }
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">Votre chauffeur [2]
        </Text>{verified && (
          <View className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400"><ShieldCheck size={10} /><Text>Chauffeur Certifié [2]</Text></View>
        )}</View><View className="flex items-center gap-4">{}<View className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-lg font-black text-white shadow-inner">{avatar ? (
            <Image className="w-full h-full object-cover rounded-2xl" source={{ uri: avatar }} accessibilityLabel={name} />
          ) : (
            name.charAt(0)
          )}</View>{}<View className="flex-1"><Text className="text-sm font-bold text-white">{name}</Text><View className="flex items-center gap-1.5 mt-0.5"><View className="flex items-center gap-0.5"><Star size={11} className="text-amber-400 fill-amber-400" /><Text className="text-xs font-semibold text-white/70">{rating}</Text></View><Text className="text-white/20">•</Text><Text className="text-[10px] text-white/40">100+ courses validées [2]
            </Text></View></View>{}<View className="flex items-center gap-1.5">{phone && (
            <Button
              onPress={handleCall}
              size="icon"
              variant="outline"
              className="w-10 h-10 rounded-xl"
            >
              <Phone size={15} />
            </Button>
          )}{phone && (
            <Button
              onPress={handleWhatsApp}
              size="icon"
              variant="outline"
              className="w-10 h-10 rounded-xl"
            >
              <MessageSquare size={15} className="text-emerald-400" />
            </Button>
          )}</View></View></View>
  );
}
