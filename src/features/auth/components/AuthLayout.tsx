// src/features/auth/components/AuthLayout.tsx

import { useEffect, useState, type ReactNode } from "react";
import { Image, Text, View } from "react-native";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Coins,
  Cpu,
  Globe,
  Heart,
  Home,
  Search,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react-native";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

type SmartphoneScreen = {
  id: string;
  module: string;
  title: string;
  detail: string;
  image: string;
  color: string;
  icon: typeof ShoppingBag;
};

type MockNotification = {
  title: string;
  message: string;
  image: string;
  icon: typeof Heart;
  color: string;
};

const SMARTPHONE_SCREENS: SmartphoneScreen[] = [
  {
    id: "marketplace",
    module: "Marketplace",
    title: "MacBook Pro M3 • 16GB",
    detail: "1 450 USD • Kinshasa",
    image:
      "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=320&q=80",
    color: "#8B5CF6",
    icon: ShoppingBag,
  },
  {
    id: "sante",
    module: "Téléconsultation",
    title: "Dr. Kabange • Pédiatre",
    detail: "Disponible immédiatement",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=320&q=80",
    color: "#A78BFA",
    icon: Heart,
  },
  {
    id: "jobs",
    module: "Emplois",
    title: "Product Designer Senior",
    detail: "CDI • Abidjan",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=320&q=80",
    color: "#818CF8",
    icon: Briefcase,
  },
  {
    id: "ia",
    module: "Assistant IA",
    title: "Modèle de contrat de bail",
    detail: "Généré en 3 secondes par l'IA",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=320&q=80",
    color: "#C084FC",
    icon: Cpu,
  },
  {
    id: "paiements",
    module: "Paiements",
    title: "Mobile Money intégré",
    detail: "Envoyer & recevoir de l'argent",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=320&q=80",
    color: "#8B5CF6",
    icon: Coins,
  },
  {
    id: "immo",
    module: "Immobilier",
    title: "Villa moderne • Gombe",
    detail: "Location gérée via l'application",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=320&q=80",
    color: "#FBBF24",
    icon: Home,
  },
];

const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    title: "Rendez-vous médecin",
    message: "Rendez-vous confirmé à 14h30 avec le Dr. Kabange",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=120&q=80",
    icon: Heart,
    color: "rgba(239,68,68,0.12)",
  },
  {
    title: "Paiement reçu",
    message: "Marie vous a envoyé +15 000 FCFA via l'application",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=120&q=80",
    icon: Coins,
    color: "rgba(16,185,129,0.12)",
  },
  {
    title: "Nouveau message",
    message: "L'assistant IA a fini d'analyser votre document juridique",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&q=80",
    icon: Cpu,
    color: "rgba(139,92,246,0.12)",
  },
  {
    title: "Offre d'emploi",
    message: "Une nouvelle carrière de Designer correspond à vos critères",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80",
    icon: Briefcase,
    color: "rgba(59,130,246,0.12)",
  },
];

function BrandMark() {
  return (
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 rounded-2xl bg-violet-600 items-center justify-center">
        <Globe size={20} color="#FFFFFF" />
      </View>

      <Text className="text-xl font-black text-white tracking-tight">
        Débrouille
        <Text className="text-violet-400">Pro</Text>
      </Text>

      <View className="px-2.5 py-1 rounded-full border border-violet-500/20 bg-violet-500/10">
        <Text className="text-[9px] font-bold text-violet-300 tracking-widest uppercase">
          Super-App
        </Text>
      </View>
    </View>
  );
}

function AmbientOrb({
  position,
  size,
  opacity,
}: {
  position: string;
  size: number;
  opacity: number;
}) {
  return (
    <View
      pointerEvents="none"
      className={`absolute rounded-full bg-violet-600 ${position}`}
      style={{
        width: size,
        height: size,
        opacity,
      }}
    />
  );
}

function FloatingFeature({
  icon: Icon,
  title,
  description,
  position,
}: {
  icon: typeof Home;
  title: string;
  description: string;
  position: string;
}) {
  return (
    <View
      className={`absolute ${position} z-30 flex-row items-center gap-3 rounded-2xl border border-white/10 bg-[#070914]/95 px-3 py-3`}
    >
      <View className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/20 items-center justify-center">
        <Icon size={16} color="#A78BFA" />
      </View>

      <View>
        <Text className="text-xs font-bold text-white">{title}</Text>
        <Text className="text-[9px] text-white/40 font-semibold">
          {description}
        </Text>
      </View>
    </View>
  );
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const [activeScreen, setActiveScreen] = useState(0);
  const [activeNotification, setActiveNotification] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((previous) => (previous + 1) % SMARTPHONE_SCREENS.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNotification(
        (previous) => (previous + 1) % MOCK_NOTIFICATIONS.length,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentScreen =
    SMARTPHONE_SCREENS[activeScreen] ?? SMARTPHONE_SCREENS[0];

  const currentNotification =
    MOCK_NOTIFICATIONS[activeNotification] ?? MOCK_NOTIFICATIONS[0];

  const CurrentScreenIcon = currentScreen.icon;
  const CurrentNotificationIcon = currentNotification.icon;

  return (
    <View className="min-h-screen w-full flex-1 bg-[#020617] overflow-hidden">
      {/* Ambient background */}
      <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
        <AmbientOrb position="-top-48 -left-48" size={520} opacity={0.12} />

        <AmbientOrb position="-bottom-48 -right-48" size={520} opacity={0.09} />

        <View className="absolute inset-0 bg-[#020617]/30" />

        <View className="absolute top-[18%] left-[28%] w-2 h-2 rounded-full bg-violet-400 opacity-40" />
        <View className="absolute top-[52%] left-[18%] w-1.5 h-1.5 rounded-full bg-indigo-400 opacity-50" />
        <View className="absolute top-[35%] left-[46%] w-2 h-2 rounded-full bg-violet-400 opacity-40" />
      </View>

      <View className="flex-1 lg:flex-row">
        {/* ============================================================
            LEFT — BRAND / PRODUCT PRESENTATION
           ============================================================ */}
        <View className="hidden lg:flex w-[54%] min-h-screen flex-col justify-between p-12 xl:p-16 relative z-10">
          <BrandMark />

          <View className="flex-1 items-center justify-center relative">
            {/* Decorative network */}
            <View
              pointerEvents="none"
              className="absolute w-[430px] h-[500px] rounded-[120px] border border-violet-500/10"
            />

            <View
              pointerEvents="none"
              className="absolute w-[360px] h-[430px] rounded-[100px] border border-indigo-500/10"
            />

            {/* Smartphone */}
            <View className="relative z-10 w-[240px] h-[480px] rounded-[44px] border-[5px] border-white/10 bg-[#070811] overflow-hidden p-4">
              {/* Camera / notch */}
              <View className="absolute top-2.5 left-1/2 -ml-10 w-20 h-4 bg-black rounded-full items-center justify-center">
                <View className="w-1 h-1 rounded-full bg-white/20" />
              </View>

              {/* Header */}
              <View className="mt-4 flex-row items-center justify-between">
                <Text className="text-[10px] font-black text-white">
                  DébrouillePro
                </Text>

                <View className="flex-row items-center gap-1">
                  <Text className="text-[7px] text-white/50">Live</Text>
                  <View className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </View>
              </View>

              {/* Search */}
              <View className="mt-3.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 flex-row items-center gap-2">
                <Search size={10} color="rgba(255,255,255,0.4)" />
                <Text className="text-[9px] text-white/30">Rechercher...</Text>
              </View>

              {/* Current module */}
              <View className="mt-4 flex-1">
                <View className="flex-row items-center gap-2 mb-4">
                  <View
                    className="w-7 h-7 rounded-lg items-center justify-center border border-white/10"
                    style={{
                      backgroundColor: `${currentScreen.color}15`,
                    }}
                  >
                    <CurrentScreenIcon size={14} color={currentScreen.color} />
                  </View>

                  <Text
                    className="text-[9px] font-black tracking-wider uppercase"
                    style={{ color: currentScreen.color }}
                  >
                    {currentScreen.module}
                  </Text>
                </View>

                <View className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden">
                  <Image
                    className="w-full h-24"
                    source={{ uri: currentScreen.image }}
                    accessibilityLabel={currentScreen.title}
                    resizeMode="cover"
                  />

                  <View className="p-3">
                    <Text className="text-[11px] text-white font-black leading-tight">
                      {currentScreen.title}
                    </Text>

                    <Text className="text-[9px] text-white/40 font-medium mt-1">
                      {currentScreen.detail}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 w-full py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 flex-row items-center justify-center gap-1.5">
                  <Text className="text-[9px] font-bold text-violet-300">
                    Découvrir le module
                  </Text>

                  <ArrowRight size={10} color="#C4B5FD" />
                </View>
              </View>

              {/* Bottom status */}
              <View className="pt-3">
                <View className="h-px bg-white/5 mb-3" />

                <View className="flex-row items-center justify-between">
                  <Text className="text-[7px] text-white/30">Tout-en-un</Text>

                  <Text className="text-[7px] text-emerald-400/70">
                    Connecté
                  </Text>
                </View>
              </View>
            </View>

            {/* Notification card */}
            <View className="absolute top-1/2 -right-12 w-60 z-30">
              <View className="p-3.5 rounded-2xl border border-white/10 bg-[#070914] flex-row items-start gap-3">
                <Image
                  className="w-8 h-8 rounded-xl border border-white/5"
                  source={{ uri: currentNotification.image }}
                  accessibilityLabel={currentNotification.title}
                  resizeMode="cover"
                />

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[10px] font-bold text-white flex-1">
                      {currentNotification.title}
                    </Text>

                    <Text className="text-[7px] text-white/30 ml-2">1s</Text>
                  </View>

                  <Text className="text-[9px] text-white/50 leading-relaxed mt-1">
                    {currentNotification.message}
                  </Text>
                </View>

                <CurrentNotificationIcon size={12} color="#A78BFA" />
              </View>
            </View>

            {/* Floating feature cards */}
            <FloatingFeature
              icon={Home}
              title="Immobilier"
              description="Logements certifiés"
              position="top-8 -left-8"
            />

            <FloatingFeature
              icon={Briefcase}
              title="Emplois"
              description="Carrières vérifiées"
              position="top-16 -right-12"
            />

            <FloatingFeature
              icon={Heart}
              title="Santé"
              description="Praticiens agréés"
              position="bottom-12 -left-10"
            />

            <FloatingFeature
              icon={ShoppingBag}
              title="Marketplace"
              description="Boutiques de confiance"
              position="bottom-16 -right-12"
            />
          </View>

          {/* Trust indicators */}
          <View className="flex-row items-center gap-8 border-t border-white/5 pt-8">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-white/40">
                Gratuit & sans commission
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <ShieldCheck size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-white/40">
                Données sécurisées
              </Text>
            </View>

            <View className="flex-row items-center gap-2">
              <Coins size={14} color="#8B5CF6" />
              <Text className="text-xs font-semibold text-white/40">
                Paiements sécurisés
              </Text>
            </View>
          </View>
        </View>

        {/* ============================================================
            RIGHT — AUTHENTICATION CONTENT
           ============================================================ */}
        <View className="w-full lg:w-[46%] flex-1 items-center justify-center px-6 py-8 relative z-10">
          <View className="w-full max-w-[430px]">
            {/* Mobile brand */}
            <View className="lg:hidden items-center mb-8">
              <View className="flex-row items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
                <Globe size={14} color="#A78BFA" />

                <Text className="text-[10px] font-black text-white/70 tracking-widest uppercase">
                  La Super-App Africaine
                </Text>
              </View>

              <Text className="text-4xl font-black text-white tracking-tight mt-4">
                Débrouille
                <Text className="text-violet-400">Pro</Text>
              </Text>

              <Text className="text-white/50 text-sm text-center max-w-sm leading-relaxed mt-3">
                La première Super-App panafricaine qui réunit toute votre vie
                numérique.
              </Text>
            </View>

            {/* Desktop heading */}
            <View className="hidden lg:block mb-6 pl-2">
              <View className="flex-row items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 self-start">
                <SparklesFallback />

                <Text className="text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                  Super-App
                </Text>
              </View>

              <Text className="text-3xl font-black text-white leading-tight tracking-tight mt-3 max-w-sm">
                Une seule application.
                <Text className="text-violet-400">
                  {" "}
                  Des dizaines de possibilités.
                </Text>
              </Text>
            </View>

            {/* Auth card */}
            <View className="w-full rounded-[32px] p-8 md:p-10 bg-white/[0.03] border border-white/10 overflow-hidden">
              <View className="absolute top-0 left-0 right-0 h-px bg-violet-500/30" />

              <View className="mb-8">
                <Text className="text-2xl font-bold text-white tracking-tight">
                  {title}
                </Text>

                {subtitle ? (
                  <Text className="text-white/40 text-xs font-semibold mt-1.5">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <View className="space-y-6">{children}</View>
            </View>

            {/* Mobile trust */}
            <View className="lg:hidden flex-row items-center justify-center gap-4 mt-4">
              <Text className="text-[10px] text-white/30 font-semibold">
                ✓ Gratuit
              </Text>

              <Text className="text-[10px] text-white/30 font-semibold">
                ✓ Sécurisé
              </Text>

              <Text className="text-[10px] text-white/30 font-semibold">
                ✓ Mobile Money
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Petit composant local pour éviter une dépendance supplémentaire
 * uniquement pour l'icône de l'en-tête.
 */
function SparklesFallback() {
  return (
    <View className="w-3 h-3 rounded-full bg-violet-400 items-center justify-center">
      <View className="w-1 h-1 rounded-full bg-white" />
    </View>
  );
}
