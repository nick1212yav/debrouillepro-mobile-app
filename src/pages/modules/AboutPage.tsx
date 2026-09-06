import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import {
  ArrowLeft,
  Globe,
  Heart,
  Star,
  Users,
  Zap,
  Shield,
  Mail,
  ExternalLink,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Rocket,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance";

interface AboutPageProps {
  onBack: () => void;
}

const TEAM = [
  { name: "Équipe Produit", role: "Vision & Stratégie", emoji: "🧭" },
  { name: "Ingénierie", role: "Backend, Mobile & IA", emoji: "⚙️" },
  { name: "Design UX/UI", role: "Expérience utilisateur", emoji: "🎨" },
  { name: "Ops & Support", role: "Kolwezi · Kinshasa", emoji: "🇨🇩" },
];

const STATS = [
  {
    label: "Utilisateurs actifs",
    value: "50 000+",
    icon: Users,
    color: "#8B5CF6",
  },
  { label: "Modules disponibles", value: "80+", icon: Zap, color: "#F97316" },
  { label: "Note moyenne", value: "4.8 / 5", icon: Star, color: "#F59E0B" },
  { label: "Pays couverts", value: "5", icon: Globe, color: "#10B981" },
];

const CHANGELOG = [
  {
    version: "v2.8.0",
    date: "Juin 2025",
    note: "Accessibilité WCAG AA, mode daltonisme, animations de pages",
  },
  {
    version: "v2.7.0",
    date: "Mai 2025",
    note: "Centre de notifications push, Découverte & Tendances",
  },
  {
    version: "v2.6.0",
    date: "Avril 2025",
    note: "Export & partage de données, thème & personnalisation avancée",
  },
  {
    version: "v2.5.0",
    date: "Mars 2025",
    note: "Backend complet tous modules, modération améliorée",
  },
  {
    version: "v2.0.0",
    date: "Janv. 2025",
    note: "Lancement public · Kolwezi, RDC",
  },
];

const PILLARS = [
  {
    icon: "🌍",
    title: "Pensé pour l'Afrique",
    text: "Une expérience conçue autour des usages, besoins et réalités locales.",
  },
  {
    icon: "⚡",
    title: "Tout au même endroit",
    text: "Emploi, immobilier, santé, transport, services, communauté et bien plus.",
  },
  {
    icon: "🤖",
    title: "Intelligent par nature",
    text: "Recherche, découverte et recommandations évoluent avec votre usage.",
  },
];

const PRINCIPLES = [
  "Simplicité avant complexité",
  "Technologie utile au quotidien",
  "Expérience rapide et accessible",
  "Construire localement, penser globalement",
];

export default function AboutPage({ onBack }: AboutPageProps) {
  const { prefs } = useAppearance();
  const hex = ACCENT_PALETTES[prefs.accent].hex;
  const { gradFrom, gradTo, glow } = ACCENT_PALETTES[prefs.accent];

  return (
    <View
      className="flex flex-col h-full min-h-0 overflow-hidden text-white"
      style={{  }}
    >
      <View
        className="flex items-center gap-3 px-5 pt-12 pb-4 shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(2,6,23,0.68)" }}
      >
        <Pressable
          onPress={onBack}
          accessibilityLabel="Retour"
          className="w-10 h-10 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} accessibilityElementsHidden={true} />
        </Pressable>

        <View className="flex-1 min-w-0">
          <Text className="text-lg font-bold">À propos</Text>
          <Text className="text-xs text-white/40">
            Débrouille Pro · Made in Congo 🇨🇩
          </Text>
        </View>

        <View
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold"
          style={{ backgroundColor: `${hex}14`, borderStyle: "solid" }}
        >
          <Sparkles size={12} />
          <Text>NOTRE HISTOIRE</Text></View>
      </View>

      <View
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-5 py-5 sm:py-6"
        style={{  }}
      >
        <View className="max-w-3xl mx-auto space-y-6 pb-8">
          {/* Hero */}
          <View
            className="rounded-[2rem] p-6 sm:p-8 relative overflow-hidden"
            style={{ borderStyle: "solid" }}
          >
            <View
              className="absolute -top-24 -right-20 w-64 h-64 rounded-full"
              style={{  }}
            />
            <View
              className="absolute -bottom-28 -left-20 w-56 h-56 rounded-full"
              style={{  }}
            />

            <View className="relative z-10">
              <View className="flex items-center justify-between gap-4">
                <View
                  className="w-20 h-20 rounded-[1.65rem] flex items-center justify-center text-4xl"
                  style={{  }}
                >
                  <Text>🌍</Text></View>

                <View
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", borderStyle: "solid" }}
                >
                  <Shield size={13} style={{ color: hex }} />
                  <Text className="text-[10px] font-bold text-white/60">
                    CONÇU POUR DURER
                  </Text>
                </View>
              </View>

              <Text
                className="mt-7 text-[10px] font-black tracking-[0.25em]"
                style={{ color: hex }}
              >
                UNE PLATEFORME · UN ÉCOSYSTÈME
              </Text>

              <Text className="mt-2 text-3xl sm:text-4xl font-black tracking-tight">
                Débrouille{" "}
                <Text
                  style={{ WebkitBackgroundClip: "text", color: "transparent" }}
                >
                  Pro
                </Text>
              </Text>

              <Text className="text-sm sm:text-base text-white/55 mt-3 max-w-2xl leading-relaxed">
                Le super-app africain pour tout gérer — immobilier, santé,
                emploi, transport et bien plus. Conçu à Kolwezi, pour toute
                l'Afrique.
              </Text>

              <View className="flex flex-wrap items-center gap-2 mt-5">
                <Text
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ color: hex, backgroundColor: `${hex}18`, borderStyle: "solid" }}
                >
                  <Rocket size={13} />
                  Version 2.8.0
                </Text>
                <Text className="text-xs text-white/30">Juin 2025</Text>
                <Text className="text-white/15">•</Text>
                <Text className="text-xs text-white/35">Kolwezi · RDC</Text>
              </View>
            </View>
          </View>

          {/* Vision */}
          <View
          >
            <View className="flex items-end justify-between gap-3 mb-3 px-1">
              <View>
                <Text
                  className="text-[10px] font-black uppercase tracking-[0.2em]"
                  style={{ color: hex }}
                >
                  Pourquoi nous existons
                </Text>
                <Text className="text-xl font-black mt-1">
                  Une idée simple. Une grande ambition.
                </Text>
              </View>
            </View>

            <View
              className="rounded-[1.75rem] p-5 sm:p-6"
              style={{ backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.075)", borderStyle: "solid" }}
            >
              <View className="flex gap-4 items-start">
                <View
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${hex}16` }}
                >
                  <Heart size={20} style={{ color: hex }} />
                </View>
                <View>
                  <Text className="text-sm sm:text-base text-white/72 leading-relaxed">
                    Débrouille Pro est né d'un constat simple : les Congolais
                    méritent des outils numériques de qualité mondiale, adaptés
                    à leur réalité locale. Nous construisons la plateforme qui
                    simplifie la vie quotidienne — de trouver un logement à
                    accéder aux soins, en passant par chercher un emploi ou
                    envoyer de l'argent.
                  </Text>
                  <Text className="text-sm text-white/40 leading-relaxed mt-3">
                    Notre ambition est de réunir dans une même expérience les
                    services, les opportunités et les personnes qui font vivre
                    nos communautés.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pillars */}
          <View>
            <View className="flex items-center gap-2 mb-3 px-1">
              <Sparkles size={14} style={{ color: hex }} />
              <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                L'expérience Débrouille Pro
              </Text>
            </View>

            <View className="gap-3">
              {PILLARS.map((item, i) => (
                <View
                  key={item.title}
                  className="rounded-[1.5rem] p-4"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                >
                  <View className="text-2xl">{item.icon}</View>
                  <Text className="font-bold text-sm mt-3">{item.title}</Text>
                  <Text className="text-xs text-white/38 leading-relaxed mt-1.5">
                    {item.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats */}
          <View>
            <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-1">
              Débrouille en chiffres
            </Text>

            <View className="gap-2.5">
              {STATS.map(({ label, value, icon: Icon, color }, i) => (
                <View
                  key={label}
                  className="rounded-[1.4rem] p-4 relative overflow-hidden"
                  style={{ backgroundColor: `${color}0d`, borderStyle: "solid" }}
                >
                  <View
                    className="absolute -right-8 -top-8 w-20 h-20 rounded-full"
                    style={{ backgroundColor: `${color}10` }}
                  />
                  <Icon
                    size={19}
                    style={{ color }}
                    className="mb-3 relative"
                    accessibilityElementsHidden={true}
                  />
                  <Text className="text-xl font-black relative">{value}</Text>
                  <Text className="text-[11px] text-white/40 mt-1 relative">
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Principles */}
          <View>
            <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-1">
              Nos principes
            </Text>

            <View
              className="rounded-[1.75rem] p-4 sm:p-5"
              style={{ borderStyle: "solid" }}
            >
              <View className="gap-2">
                {PRINCIPLES.map((principle) => (
                  <View
                    key={principle}
                    className="flex items-center gap-2.5 py-2"
                  >
                    <CheckCircle2
                      size={16}
                      style={{ color: hex }}
                      className="shrink-0"
                    />
                    <Text className="text-sm text-white/65">{principle}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Team */}
          <View>
            <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-1">
              L'équipe
            </Text>

            <View
              className="rounded-[1.75rem] overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
            >
              {TEAM.map((member, i) => (
                <View
                  key={member.name}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.045)", borderBottomStyle: "solid" }}
                >
                  <View
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: `${hex}15` }}
                  >
                    {member.emoji}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-semibold text-white/85">
                      {member.name}
                    </Text>
                    <Text className="text-[11px] text-white/35 mt-0.5">
                      {member.role}
                    </Text>
                  </View>
                  <ChevronRight size={15} className="text-white/15" />
                </View>
              ))}
            </View>
          </View>

          {/* Changelog */}
          <View>
            <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-1">
              Historique des versions
            </Text>

            <View
              className="rounded-[1.75rem] overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
            >
              {CHANGELOG.map((change, i) => (
                <View
                  key={change.version}
                  className="flex items-start gap-3 px-4 py-4"
                  style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.045)", borderBottomStyle: "solid" }}
                >
                  <Text
                    className="text-xs font-black mt-0.5 shrink-0 min-w-[54px]"
                    style={{ color: i === 0 ? hex : "rgba(255,255,255,0.3)" }}
                  >
                    {change.version}
                  </Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm text-white/68 leading-snug">
                      {change.note}
                    </Text>
                    <Text className="text-[10px] text-white/25 mt-1">
                      {change.date}
                    </Text>
                  </View>
                  {i === 0 && (
                    <Text
                      className="text-[9px] font-bold"
                      style={{ color: hex }}
                    >
                      ACTUEL
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Contact */}
          <View>
            <Text className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-3 px-1">
              Contact
            </Text>

            <View
              className="rounded-[1.75rem] overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
            >
              <Pressable
                className="flex items-center gap-3 px-4 py-4 w-full border-b text-left"
                style={{ borderColor: "rgba(255,255,255,0.045)" }}
                onPress={() => UIService.openToast("Copié : contact@debrouille.pro", "info")}
              >
                <View
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#3B82F618" }}
                >
                  <Mail
                    size={17}
                    className="text-blue-400"
                    accessibilityElementsHidden={true}
                  />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-semibold text-white/85">
                    Nous contacter
                  </Text>
                  <Text className="text-[11px] text-white/30 mt-0.5">
                    contact@debrouille.pro
                  </Text>
                </View>
                <ExternalLink size={14} className="text-white/20" />
              </Pressable>

              <Pressable
                className="flex items-center gap-3 px-4 py-4 w-full text-left"
                onPress={() => UIService.openToast("Ouverture du site web…", "info")}
              >
                <View
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${hex}15` }}
                >
                  <Globe size={17} style={{ color: hex }} accessibilityElementsHidden={true} />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-semibold text-white/85">
                    Site officiel
                  </Text>
                  <Text className="text-[11px] text-white/30 mt-0.5">
                    www.debrouille.pro
                  </Text>
                </View>
                <ExternalLink size={14} className="text-white/20" />
              </Pressable>
            </View>
          </View>

          {/* Closing statement */}
          <View
            className="rounded-[1.75rem] p-5 text-center"
            style={{ borderStyle: "solid" }}
          >
            <MapPin size={18} style={{ color: hex }} className="mx-auto mb-2" />
            <Text className="text-sm font-bold text-white/80">
              Construit à Kolwezi. Pensé pour l'Afrique.
            </Text>
            <Text className="text-xs text-white/30 mt-1">
              Notre histoire ne fait que commencer.
            </Text>
          </View>

          {/* Legal */}
          <View className="flex flex-wrap gap-4 justify-center pt-1">
            {["CGU", "Confidentialité", "Licences"].map((label) => (
              <Pressable
                key={label}
                className="text-[11px] text-white/25"
                onPress={() => UIService.openToast(`Page ${label} bientôt disponible`, "info")}
              >
                {label}
              </Pressable>
            ))}
          </View>

          <Text className="text-center text-[10px] text-white/20 pb-2">
            <Text>© 2025 Débrouille Pro SAS · Kolwezi, RDC · Tous droits réservés</Text></Text>
        </View>
      </View>
    </View>
  );
}
