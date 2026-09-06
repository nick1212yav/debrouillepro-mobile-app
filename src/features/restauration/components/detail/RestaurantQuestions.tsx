import { View, Text } from "react-native";
import { HelpCircle } from "lucide-react-native";

export function RestaurantQuestions() {
  const qas = [
    {
      q: "Est-ce qu'il y a un parking sécurisé ?",
      a: "Oui, un parking avec gardiennage de nuit est accessible gratuitement.",
    },
    {
      q: "Les plats contiennent-ils de l'arachide ?",
      a: "Certaines sauces locales oui. Pensez à mentionner vos allergies lors de la commande.",
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]">
      <View className="flex items-center gap-2 mb-3">
        <HelpCircle size={16} className="text-white/40" />
        <Text className="text-xs font-bold uppercase tracking-wider text-white/40">
          F.A.Q & Questions
        </Text>
      </View>
      <View className="space-y-3 text-left">
        {qas.map((qa, i) => (
          <View key={i} className="space-y-1.5">
            <Text className="block text-xs font-extrabold text-white">
              <Text>Q:</Text>{qa.q}
            </Text>
            <Text className="block text-xs text-white/50 pl-4 font-normal">
              <Text>R:</Text>{qa.a}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
