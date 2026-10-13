import { Pressable, Text, Linking, Alert } from "react-native";

interface Props {
  url?: string;
}

export function Service360({ url }: Props) {
  if (!url?.trim()) {
    return null;
  }

  const handleOpen = async () => {
    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Lien indisponible",
          "Cet appareil ne peut pas ouvrir ce lien.",
        );
        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Ouverture impossible",
        "La visite à 360° n'a pas pu être ouverte. Réessaie plus tard.",
      );
    }
  };

  return (
    <Pressable
      onPress={handleOpen}
      accessibilityRole="link"
      accessibilityLabel="Ouvrir la visite à 360 degrés"
      className="px-4 py-2 rounded-xl bg-white/10 active:bg-white/15"
    >
      <Text className="text-xs text-white/70">🔄 Visite 360°</Text>
    </Pressable>
  );
}
