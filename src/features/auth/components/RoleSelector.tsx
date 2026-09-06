import { View, Text, Pressable } from "react-native";
import type { UserRole } from "../types/auth.types";

const ROLES: {
  value: UserRole;
  label: string;
  emoji: string;
  description: string;
}[] = [
  {
    value: "particulier",
    label: "Particulier",
    emoji: "👤",
    description: "Usage personnel",
  },
  {
    value: "professionnel",
    label: "Professionnel",
    emoji: "💼",
    description: "Indépendant, freelance",
  },
  {
    value: "artisan",
    label: "Artisan",
    emoji: "🔨",
    description: "Artisan, commerçant",
  },
  {
    value: "entreprise",
    label: "Entreprise",
    emoji: "🏢",
    description: "PME, grande entreprise",
  },
  {
    value: "association",
    label: "Association",
    emoji: "🤝",
    description: "Association à but non lucratif",
  },
  {
    value: "ong",
    label: "ONG",
    emoji: "🌍",
    description: "Organisation non gouvernementale",
  },
  {
    value: "mine",
    label: "Mine",
    emoji: "⛏️",
    description: "Secteur minier",
  },
  {
    value: "administration",
    label: "Administration",
    emoji: "🏛️",
    description: "Service public",
  },
];

interface RoleSelectorProps {
  selected: string[];
  onChange: (roles: string[]) => void;
  label?: string;
  multiple?: boolean;
}

export function RoleSelector({
  selected,
  onChange,
  label = "Type de compte",
  multiple = false,
}: RoleSelectorProps) {
  const toggleRole = (role: UserRole) => {
    if (multiple) {
      if (selected.includes(role)) {
        onChange(selected.filter((r) => r !== role));
      } else {
        onChange([...selected, role]);
      }
    } else {
      onChange([role]);
    }
  };

  return (
    <View className="space-y-3">
      <Text className="block text-xs font-medium text-white/60">{label}</Text>

      <View className="gap-3">
        {ROLES.map((role) => {
          const active = selected.includes(role.value);

          return (
            <Pressable
              key={role.value}
             
              onPress={() => toggleRole(role.value)}
              className="rounded-2xl p-3 text-left"
              style={{ backgroundColor: active
                                ? "rgba(139,92,246,.18)"
                                : "rgba(255,255,255,.05)", borderColor: "rgba(139,92,246,.6)", borderStyle: "solid" }}
            >
              <View className="flex items-start gap-3">
                <Text className="text-xl leading-none">{role.emoji}</Text>

                <View className="min-w-0">
                  <Text
                    className={`text-sm font-semibold ${
                      active ? "text-white" : "text-white/80"
                    }`}
                  >
                    {role.label}
                  </Text>

                  <Text className="mt-1 text-[11px] leading-4 text-white/40">
                    {role.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {multiple && (
        <Text className="text-xs text-white/35">
          <Text>Vous pouvez sélectionner plusieurs rôles.</Text></Text>
      )}
    </View>
  );
}
