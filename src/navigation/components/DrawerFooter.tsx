import { Text, View, Pressable } from "react-native";
import { LogOut } from "lucide-react-native";

interface DrawerFooterProps {
  onLogout: () => void;
}

export function DrawerFooter({ onLogout }: DrawerFooterProps) {
  return (
    <View
      className="px-5 pb-8 pt-3 flex-shrink-0 space-y-2"
      style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)", borderTopStyle: "solid" }}
    >
      <Pressable
        onPress={onLogout}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl"
        style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
      >
        <View
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
        >
          <LogOut size={15} className="text-red-400" />
        </View>
        <Text className="text-sm text-red-400 font-semibold">
          Se déconnecter
        </Text>
      </Pressable>
    </View>
  );
}
