// src/features/auth/components/RoleSelector.tsx

import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";

import type { UserRole } from "../types/auth.types";

interface RoleOption {
  value: UserRole;
  label: string;
  emoji: string;
  description: string;
}

const ROLES: readonly RoleOption[] = [
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
  const selectedRoles = useMemo(() => new Set(selected), [selected]);

  const toggleRole = (role: UserRole) => {
    if (multiple) {
      if (selectedRoles.has(role)) {
        onChange(selected.filter((current) => current !== role));
      } else {
        onChange([...selected, role]);
      }

      return;
    }

    onChange([role]);
  };

  return (
    <View className="w-full">
      <Text className="mb-3 text-xs font-medium text-white/60">{label}</Text>

      <View className="w-full">
        {ROLES.map((role) => {
          const active = selectedRoles.has(role.value);

          return (
            <Pressable
              key={role.value}
              accessibilityRole={multiple ? "checkbox" : "radio"}
              accessibilityLabel={`${role.label}. ${role.description}`}
              accessibilityState={{
                checked: active,
              }}
              onPress={() => toggleRole(role.value)}
              className={`mb-2 w-full rounded-2xl border p-3 active:opacity-80 ${
                active
                  ? "border-violet-500/60 bg-violet-500/[0.18]"
                  : "border-white/10 bg-white/[0.05]"
              }`}
            >
              <View className="flex-row items-center">
                <View
                  className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
                    active ? "bg-violet-500/20" : "bg-white/[0.05]"
                  }`}
                >
                  <Text className="text-xl">{role.emoji}</Text>
                </View>

                <View className="flex-1 pr-3">
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

                <View
                  className={`h-5 w-5 items-center justify-center rounded-full border ${
                    active
                      ? "border-violet-400 bg-violet-500"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {active ? (
                    <Text className="text-[11px] font-bold text-white">✓</Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {multiple ? (
        <Text className="mt-1 text-xs leading-4 text-white/35">
          Vous pouvez sélectionner plusieurs rôles.
        </Text>
      ) : null}
    </View>
  );
}
