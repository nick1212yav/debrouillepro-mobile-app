import { View, Text, Pressable } from "react-native";
import { ChevronRight, X } from "lucide-react-native";
import { useState } from "react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";

interface ProfileStep {
  key: string;
  label: string;
  done: (user: NonNullable<ReturnType<typeof useCurrentUser>>) => boolean;
}

const PROFILE_STEPS: ProfileStep[] = [
  { key: "name", label: "Ajouter un nom", done: (u) => !!u.name },
  { key: "avatar", label: "Photo de profil", done: (u) => !!u.avatar },
  { key: "bio", label: "Écrire une bio", done: (u) => !!u.bio },
  { key: "city", label: "Indiquer votre ville", done: (u) => !!u.city },
  {
    key: "interests",
    label: "Choisir vos centres d'intérêt",
    done: (u) => (u.interests ?? []).length >= 2,
  },
];

interface ProfileProgressBarProps {
  onNavigateToProfile: () => void;
}

function ProfileProgressBarInner({
  onNavigateToProfile,
}: ProfileProgressBarProps) {
  const user = useCurrentUser();
  const [dismissed, setDismissed] = useState(false);

  if (!user || dismissed) return null;

  const completedCount = PROFILE_STEPS.filter((s) => s.done(user)).length;
  const total = PROFILE_STEPS.length;
  const percent = Math.round((completedCount / total) * 100);

  // Don't show if profile is complete
  if (percent >= 100) return null;

  const nextStep = PROFILE_STEPS.find((s) => !s.done(user));

  return (
<View>
      <View initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(139,92,246,0.1)", borderWidth: 1, borderColor: "rgba(139,92,246,0.25)", borderStyle: "solid" }} onPress={onNavigateToProfile} accessibilityRole="button" accessibilityLabel="Compléter mon profil">
        <View className="p-3"><View className="flex items-center justify-between mb-2"><View className="flex-1"><View className="flex items-center gap-2"><Text className="text-xs font-bold text-white/80">Profil complété à {percent}%
                </Text><Text className="text-[10px] text-white/40">{completedCount}/{total}étapes
                </Text></View>{nextStep && (
                <Text className="text-[11px] text-violet-300/70 mt-0.5">Prochaine étape : {nextStep.label}</Text>
              )}</View><View className="flex items-center gap-1"><ChevronRight size={14} className="text-violet-400" /><Pressable onPress={(e) => {
                  setDismissed(true);
                }} className="p-1 rounded-full transition-colors" accessibilityLabel="Masquer"><X size={12} className="text-white/30" /></Pressable></View></View>{}<View className="h-1.5 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full" style={{  }} initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 0.8, ease: "easeOut" as const }} /></View>{}<View className="flex items-center gap-1.5 mt-2">{PROFILE_STEPS.map((step) => {
              const done = step.done(user);
              return (
                <View key={step.key} animate={{ scale: done ? [1, 1.2, 1] : 1 }} transition={{ duration: 0.3 }} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: done ? "#8B5CF6" : "rgba(255,255,255,0.15)" }} />
              );
            })}</View></View>
      </View>
    </View>
  );
}

export default function ProfileProgressBar({
  onNavigateToProfile,
}: ProfileProgressBarProps) {
  return <ProfileProgressBarInner onNavigateToProfile={onNavigateToProfile} />;
}
