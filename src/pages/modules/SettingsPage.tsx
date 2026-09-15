import { View, Pressable, Text } from "react-native";
import {
  ArrowLeft, Bell, Globe, WifiOff, Moon, ChevronRight, Shield,
  HelpCircle, Star, Smartphone, Palette, Sun, Monitor, Type,
  LayoutGrid, Check, FileText, LogIn
} from "lucide-react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";
import type { AccentColor, ColorMode, TextSize, Density } from "@/hooks/use-appearance.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

// ─── Toggle ───────────────────────────────────────────────────────────────────
function ToggleSwitch({ on, onToggle, color }: { on: boolean; onToggle: () => void; color: string }) {
  return (
    <Pressable onPress={onToggle} className="relative w-11 h-6 rounded-full flex-shrink-0 transition-all" style={{ backgroundColor: on ? color : "rgba(255,255,255,0.1)" }}><View animate={{ x: on ? 20 : 2 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" /></Pressable>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return <Text className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2 px-1">{label}</Text>;
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-3xl overflow-hidden flex flex-col" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{children}</View>
  );
}

// ─── Appearance preview ───────────────────────────────────────────────────────
function AppearancePreview({ accent }: { accent: AccentColor }) {
  const p = ACCENT_PALETTES[accent];
  return (
    <View className="mx-0 mb-4 rounded-2xl p-4 relative overflow-hidden" style={{ borderStyle: "solid" }}><View className="absolute -top-6 -right-6 w-28 h-28 rounded-full pointer-events-none" style={{  }} /><View className="flex items-center gap-3 relative"><View className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0" style={{  }}><Text>🎨</Text></View><View className="flex-1"><View className="text-white font-bold text-sm"><Text>Thème</Text>{p.label}<Text>actif</Text></View><View className="text-white/50 text-xs"><Text>Prévisualisation en temps réel</Text></View></View><View className="flex gap-1.5">{["🟠", "🔘", "⬜"].map((s, i) => (
            <View key={i} className="w-6 h-6 rounded-lg" style={{  }} />
          ))}</View></View></View>
  );
}

// ─── Sign-in overlay for unauthenticated state ────────────────────────────────
function AuthOverlay() {
  return (
    <View className="rounded-3xl p-5 flex flex-col items-center gap-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}><View className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.15)" }}><LogIn size={20} className="text-indigo-400" /></View><Text className="text-sm font-semibold text-white">Connexion requise</Text><Text className="text-xs text-white/40">Connectez-vous pour synchroniser vos préférences.</Text><SignInButton /></View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type ToggleKey = "notifications" | "offlineMode" | "biometrics" | "jobAlerts" | "immoAlerts" | "paymentAlerts";

const DEFAULT_TOGGLES: Record<ToggleKey, boolean> = {
  notifications: true,
  offlineMode: false,
  biometrics: false,
  jobAlerts: true,
  immoAlerts: false,
  paymentAlerts: true,
};

const languages = ["Français", "English", "Swahili", "Lingala", "Kikongo"];

interface SettingsPageProps { onBack: () => void; onNavigate?: (page: string) => void; }

// ─── General tab (authenticated) ──────────────────────────────────────────────
function GeneralTabAuth({ accentHex, onNavigate }: { accentHex: string; onNavigate?: (page: string) => void }) {
  const settings = useQuery(api.settings.getMySettings);
  const upsert = useMutation(api.settings.upsertSettings);
  const [showLang, setShowLang] = useState(false);

  // While loading
  if (settings === undefined) {
    return (
      <View className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-3xl" />
        ))}</View>
    );
  }

  const toggleValue = (key: ToggleKey): boolean => {
    if (settings && key in settings) {
      return (settings as Record<string, unknown>)[key] as boolean;
    }
    return DEFAULT_TOGGLES[key];
  };

  const currentLang = settings?.language ?? "Français";

  const handleToggle = async (key: ToggleKey) => {
    const newVal = !toggleValue(key);
    await upsert({ [key]: newVal });
    toast.success("Enregistré", { duration: 1500 });
  };

  const handleLangChange = async (lang: string) => {
    setShowLang(false);
    await upsert({ language: lang });
    toast.success("Enregistré", { duration: 1500 });
  };

  return (
    <View key="general" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
      {/* Language */}
      <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <SectionLabel label="Langue & Région" />
        <SettingsCard>
          <Pressable onPress={() => setShowLang(!showLang)} className="w-full flex items-center gap-3 px-4 py-3.5" style={{ borderBottomColor: "rgba(255,255,255,0.05)" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(99,102,241,0.2)" }}><Globe size={16} className="text-indigo-400" /></View><View className="flex-1 text-left"><Text className="text-sm font-semibold text-white">Langue de l'interface</Text><Text className="text-xs text-white/40">{currentLang}</Text></View><ChevronRight size={15} className="text-white/25" style={{ transform: showLang ? "rotate(90deg)" : "none" }} /></Pressable>
          {showLang && (
            <View className="flex flex-col">{languages.map((l) => (
                <Pressable key={l} onPress={() => handleLangChange(l)} className="flex items-center justify-between px-4 py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}><Text className="text-sm text-white/70">{l}</Text>{currentLang === l && <Check size={14} style={{  }} />}</Pressable>
              ))}</View>
          )}
        </SettingsCard>
      </View>

      {/* Notifications */}
      <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionLabel label="Notifications" />
        <SettingsCard>
          {([
            { key: "notifications" as const, label: "Toutes les notifs", color: accentHex },
            { key: "jobAlerts" as const, label: "Alertes Emplois", color: accentHex },
            { key: "immoAlerts" as const, label: "Alertes Immobilier", color: "#F97316" },
            { key: "paymentAlerts" as const, label: "Alertes Paiements", color: "#10B981" },
          ] satisfies { key: ToggleKey; label: string; color: string }[]).map((item, i, arr) => (
            <View key={item.key} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}><Bell size={16} style={{  }} /></View><Text className="flex-1 text-sm text-white/70">{item.label}</Text><ToggleSwitch on={toggleValue(item.key)} onToggle={() => handleToggle(item.key)} color={item.color} /></View>
          ))}
        </SettingsCard>
      </View>

      {/* App */}
      <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <SectionLabel label="Application" />
        <SettingsCard>
          {([
            { key: "offlineMode" as const, icon: WifiOff, label: "Mode hors-ligne", color: "#06B6D4", desc: "Cache les données localement" },
            { key: "biometrics" as const, icon: Smartphone, label: "Auth biométrique", color: "#10B981", desc: "Empreinte / Face ID" },
          ] satisfies { key: ToggleKey; icon: typeof WifiOff; label: string; color: string; desc: string }[]).map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <View key={item.key} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}><Icon size={16} style={{  }} /></View><View className="flex-1"><Text className="text-sm text-white/70">{item.label}</Text><Text className="text-[10px] text-white/30">{item.desc}</Text></View><ToggleSwitch on={toggleValue(item.key)} onToggle={() => handleToggle(item.key)} color={item.color} /></View>
            );
          })}
        </SettingsCard>
      </View>

      {/* About */}
      <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <SectionLabel label="À propos" />
        <SettingsCard>
          {([
            { icon: Shield, label: "Confidentialité & sécurité", color: "#3B82F6", page: "privacy" },
            { icon: HelpCircle, label: "Aide & Support", color: "#9CA3AF", page: "help" },
            { icon: Star, label: "À propos de l'app", color: "#F59E0B", page: "about" },
            { icon: FileText, label: "CGU & Mentions légales", color: "#6B7280", page: "terms" },
          ] satisfies { icon: typeof Shield; label: string; color: string; page: string }[]).map((item, i, arr) => {
            const Icon = item.icon;
            return (
              <Pressable key={item.label} className="flex items-center gap-3 px-4 py-3.5 text-left w-full" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)" }} onPress={() => onNavigate?.(item.page)}><View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${item.color}18` }}><Icon size={16} style={{  }} /></View><Text className="flex-1 text-sm text-white/70">{item.label}</Text><ChevronRight size={14} className="text-white/20" /></Pressable>
            );
          })}
        </SettingsCard>
        <Text className="text-center text-[10px] text-white/20 mt-3">Débrouille Pro v2.8.0 · Kolwezi, RDC 🇨🇩</Text>
      </View>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage({ onBack, onNavigate }: SettingsPageProps) {
  const { prefs, update, reset } = useAppearance();
  const [activeSection, setActiveSection] = useState<"general" | "apparence">("general");

  const accentHex = ACCENT_PALETTES[prefs.accent].hex;

  return (
    <View className="h-full flex flex-col" style={{  }}>{}<View initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="px-5 pt-12 pb-4 flex-shrink-0"><View className="flex items-center gap-3 mb-4"><Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-xl font-bold text-white">Paramètres ⚙️</Text><Text className="text-xs text-white/40">Compte, apparence & préférences</Text></View></View>{}<View className="flex gap-1 rounded-2xl p-1" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>{([["general", "⚙️ Général"], ["apparence", "🎨 Apparence"]] as const).map(([t, label]) => (
            <Pressable key={t} onPress={() => setActiveSection(t)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all" style={{ backgroundColor: activeSection === t ? `${accentHex}33` : "transparent", borderColor: "transparent", borderStyle: "solid" }}>{label}</Pressable>
          ))}</View></View>{}<View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}><View>{}{activeSection === "general" && (
            <>
              <AuthLoading>
                <View className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-3xl" />
                  ))}</View>
              </AuthLoading>
              <Unauthenticated>
                <View key="general-unauth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                  <AuthOverlay />
                </View>
              </Unauthenticated>
              <Authenticated>
                <GeneralTabAuth accentHex={accentHex} onNavigate={onNavigate} />
              </Authenticated>
            </>
          )}{}{activeSection === "apparence" && (
            <View key="apparence" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-5">

              {/* Quick link to full theme page */}
              {onNavigate && (
                <Pressable initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} onPress={() => onNavigate("theme")} className="w-full flex items-center gap-3 p-4 rounded-2xl transition-all" style={{ backgroundColor: `${accentHex}18`, borderStyle: "solid" }}>
                  <View className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentHex}33` }}><Palette size={18} style={{  }} /></View>
                  <View className="flex-1 text-left"><Text className="text-sm font-bold text-white">Thème & Personnalisation</Text><Text className="text-xs text-white/40">Aperçu live · Accent · Texte · Densité</Text></View>
                  <ChevronRight size={16} className="text-white/30" />
                </Pressable>
              )}

              {/* Live preview */}
              <AppearancePreview accent={prefs.accent} />

              {/* Accent color */}
              <View><SectionLabel label="Couleur d'accent" /><View className="gap-2">{(Object.entries(ACCENT_PALETTES) as [AccentColor, typeof ACCENT_PALETTES[AccentColor]][]).map(([key, p]) => {
                    const isActive = prefs.accent === key;
                    return (
                      <Pressable key={key} onPress={() => update("accent", key)} whileTap={{ scale: 0.94 }} className="relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all" style={{ backgroundColor: isActive ? `${p.hex}22` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", boxShadow: isActive ? `0 0 16px ${p.glow}` : "none" }}>
                        <View className="w-10 h-10 rounded-xl" style={{  }} />
                        <Text className="text-xs font-semibold" style={{ color: isActive ? p.hex : "rgba(255,255,255,0.5)" }}>{p.label}</Text>
                        {isActive && (
                          <View className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: p.hex }}><Check size={10} className="text-white" /></View>
                        )}
                      </Pressable>
                    );
                  })}</View></View>

              {/* Color mode */}
              <View><SectionLabel label="Mode couleur" /><View className="gap-2">{([
                    { key: "sombre" as ColorMode, label: "Sombre", icon: Moon, desc: "Toujours nuit" },
                    { key: "clair" as ColorMode, label: "Clair", icon: Sun, desc: "Toujours jour" },
                    { key: "systeme" as ColorMode, label: "Système", icon: Monitor, desc: "Auto" },
                  ]).map(({ key, label, icon: Icon, desc }) => {
                    const isActive = prefs.colorMode === key;
                    return (
                      <Pressable key={key} onPress={() => update("colorMode", key)} whileTap={{ scale: 0.94 }} className="flex flex-col items-center gap-2 p-3.5 rounded-2xl transition-all" style={{ backgroundColor: isActive ? `${accentHex}22` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                        <Icon size={20} style={{  }} />
                        <View className="text-center"><View className="text-xs font-semibold" style={{  }}>{label}</View><View className="text-[10px] text-white/30">{desc}</View></View>
                      </Pressable>
                    );
                  })}</View></View>

              {/* Text size */}
              <View><SectionLabel label="Taille du texte" /><View className="rounded-3xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>{([
                    { key: "petit" as TextSize, label: "Petit", sample: "Aa", sampleSize: "text-xs" },
                    { key: "normal" as TextSize, label: "Normal", sample: "Aa", sampleSize: "text-base" },
                    { key: "grand" as TextSize, label: "Grand", sample: "Aa", sampleSize: "text-lg" },
                  ]).map(({ key, label, sample, sampleSize }, i, arr) => {
                    const isActive = prefs.textSize === key;
                    return (
                      <Pressable key={key} onPress={() => update("textSize", key)} className="w-full flex items-center gap-3 px-4 py-3.5 transition-all" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)", backgroundColor: isActive ? `${accentHex}12` : "transparent" }}><View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isActive ? `${accentHex}22` : "rgba(255,255,255,0.06)" }}><Type size={16} style={{  }} /></View><View className="flex-1 text-left"><Text className="text-sm font-semibold" style={{ color: isActive ? "white" : "rgba(255,255,255,0.6)" }}>{label}</Text></View><Text className={`font-bold ${sampleSize}`} style={{ color: isActive ? accentHex : "rgba(255,255,255,0.25)" }}>{sample}</Text>{isActive && <Check size={14} style={{  }} />}</Pressable>
                    );
                  })}</View></View>

              {/* Density */}
              <View><SectionLabel label="Densité d'affichage" /><View className="gap-2">{([
                    { key: "compact" as Density, label: "Compact", desc: "Plus d'infos visibles" },
                    { key: "confortable" as Density, label: "Confortable", desc: "Espaces généreux" },
                  ]).map(({ key, label, desc }) => {
                    const isActive = prefs.density === key;
                    return (
                      <Pressable key={key} onPress={() => update("density", key)} whileTap={{ scale: 0.96 }} className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all text-center" style={{ backgroundColor: isActive ? `${accentHex}22` : "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                        <LayoutGrid size={24} style={{  }} />
                        <View><View className="text-sm font-bold" style={{  }}>{label}</View><View className="text-[10px] text-white/30">{desc}</View></View>
                        {isActive && <Check size={13} style={{  }} />}
                      </Pressable>
                    );
                  })}</View></View>

              {/* Reset */}
              <Pressable onPress={reset} className="w-full py-3.5 rounded-2xl text-sm font-semibold transition-opacity active:opacity-70" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                Réinitialiser l'apparence
              </Pressable>
            </View>
          )}</View></View></View>
  );
}
