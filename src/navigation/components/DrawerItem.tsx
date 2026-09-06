import { Text, View, Pressable } from "react-native";
import type { NavItem } from "../navigation.types";

interface DrawerItemProps {
  item: NavItem;
  badge?: number;
  onClick: () => void;
}

export function DrawerItem({ item, badge, onClick }: DrawerItemProps) {
  const Icon = item.icon;

  return (
    <Pressable
      onPress={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left w-full"
    >
      <View
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${item.color}18` }}
      >
        <Icon size={15} style={{ color: item.color }} />
      </View>
      <Text className="flex-1 text-sm text-white/70 font-medium">
        {item.label}
      </Text>

      {badge && badge > 0 && (
        <Text
          className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{  }}
        >
          {badge > 9 ? "9+" : badge}
        </Text>
      )}

      {item.isNew && (
        <Text
          className="px-1.5 py-0.5 rounded-full text-[8px] font-black text-white leading-none"
          style={{  }}
        >
          NEW
        </Text>
      )}
    </Pressable>
  );
}
