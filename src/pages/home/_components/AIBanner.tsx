import { View, Pressable, Text } from "react-native";
import {
  ArrowRight,
  Sparkles,
  Wand2,
  Zap,
  Brain,
  ChevronRight,
} from "lucide-react-native";

interface AIBannerProps {
  onOpenAI: () => void;
  onOpenStudio?: () => void;
}

export default function AIBanner({ onOpenAI, onOpenStudio }: AIBannerProps) {
  const hasStudio = typeof onOpenStudio === "function";

  return (
    <View
      className="relative mx-5 mt-3 overflow-hidden rounded-[30px]"
      accessibilityLabel="Débrouille AI"
    >
      {/* =========================================================
          AMBIENT AI LIGHT
      ========================================================== */}

      <View
        accessibilityElementsHidden={true}
        className="absolute -right-20 -top-24 h-60 w-60 rounded-full"
        style={{  }}
      />

      <View
        accessibilityElementsHidden={true}
        className="absolute -bottom-24 -left-16 h-52 w-52 rounded-full"
        style={{  }}
      />

      {/* =========================================================
          GLASS SURFACE
      ========================================================== */}

      <View
        className="relative overflow-hidden"
        style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.24)", borderStyle: "solid" }}
      >
        {/* Decorative grid */}
        <View
         
          className="absolute inset-0 opacity-[0.035]"
         
        />

        {/* =======================================================
            HEADER
        ======================================================== */}

        <View className="relative flex items-center gap-3 px-4 pb-3 pt-4">
          {/* AI orb */}
          <View
            className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.16)", borderStyle: "solid" }}
          >
            <View
            >
              <Sparkles size={17} className="text-white" strokeWidth={2.2} />
            </View>

            <Text
             
              className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: "#C4B5FD" }}
            />
          </View>

          <View className="min-w-0 flex-1">
            <View className="flex items-center gap-2">
              <Text className="text-[12px] font-black tracking-tight text-white">
                Débrouille AI
              </Text>

              <Text
                className="rounded-full px-2 py-0.5 text-[7px] font-black uppercase tracking-[0.12em]"
                style={{ color: "#DDD6FE", backgroundColor: "rgba(139,92,246,.14)", borderWidth: 1, borderColor: "rgba(139,92,246,.22)", borderStyle: "solid" }}
              >
                Intelligence
              </Text>
            </View>

            <Text className="mt-0.5 flex items-center gap-1 text-[9px] text-white/35">
              <Brain size={9} />
              Votre copilote numérique
            </Text>
          </View>

          {/* Live indicator */}
          <View className="flex items-center gap-1.5 rounded-full px-2 py-1">
            <Text
              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
            />

            <Text className="text-[8px] font-bold text-white/30">Prêt</Text>
          </View>
        </View>

        {/* =======================================================
            HERO MESSAGE
        ======================================================== */}

        <View className="relative px-4 pb-4">
          <View className="max-w-[340px]">
            <Text className="text-[19px] font-black leading-[1.15] tracking-[-0.035em] text-white">
              Une idée.
              <br />
              <Text
                style={{ WebkitBackgroundClip: "text" }}
              >
                Des possibilités infinies.
              </Text>
            </Text>

            <Text className="mt-2 max-w-[310px] text-[10px] leading-[1.55] text-white/42">
              Pose une question, crée, transforme ou donne vie à ton prochain
              projet avec l'intelligence de Débrouille.
            </Text>
          </View>
        </View>

        {/* =======================================================
            ACTIONS
        ======================================================== */}

        <View className="relative gap-2 px-4 pb-4">
          {/* CHAT IA */}
          <Pressable
            type="button"
            onPress={onOpenAI}
            className="group relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 text-left"
            style={{  }}
          >
            {/* Shine */}
            <View
              accessibilityElementsHidden={true}
              className="absolute inset-y-0 -left-20 w-16 bg-white/20"
            />

            <View className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/14">
              <Sparkles size={16} className="text-white" strokeWidth={2.2} />
            </View>

            <View className="relative min-w-0 flex-1">
              <Text className="text-[11px] font-black text-white">Parler à l'IA</Text>
              <Text className="mt-0.5 truncate text-[8px] text-white/55">
                Demande n'importe quoi
              </Text>
            </View>

            <ArrowRight
              size={14}
              className="relative flex-shrink-0 text-white/60"
            />
          </Pressable>

          {/* IA STUDIO */}
          {hasStudio && (
            <Pressable
              type="button"
              onPress={onOpenStudio}
              className="group relative flex items-center gap-3 overflow-hidden rounded-2xl p-3 text-left"
              style={{ backgroundColor: "rgba(245,158,11,.09)", borderWidth: 1, borderColor: "rgba(245,158,11,.20)", borderStyle: "solid" }}
            >
              <View
               
                className="absolute -right-8 -top-8 h-20 w-20 rounded-full"
                style={{ backgroundColor: "rgba(245,158,11,.18)" }}
              />

              <View
                className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(245,158,11,.11)", borderWidth: 1, borderColor: "rgba(245,158,11,.15)", borderStyle: "solid" }}
              >
                <Wand2 size={16} style={{ color: "#FCD34D" }} />
              </View>

              <View className="relative min-w-0 flex-1">
                <Text
                  className="text-[11px] font-black"
                  style={{ color: "#FDE68A" }}
                >
                  IA Studio
                </Text>
                <Text className="mt-0.5 truncate text-[8px] text-white/35">
                  Créer · Transformer · Générer
                </Text>
              </View>

              <ChevronRight
                size={14}
                style={{ color: "rgba(252,211,77,.45)" }}
                className="relative flex-shrink-0"
              />
            </Pressable>
          )}
        </View>

        {/* =======================================================
            CAPABILITIES
        ======================================================== */}

        <View
          className="relative flex items-center gap-1.5 overflow-x-auto px-4 pb-4"
          style={{  }}
        >
          {["Comprendre", "Créer", "Traduire", "Transformer"].map(
            (capability, index) => (
              <Text
                key={capability}
                className="flex-shrink-0 rounded-full px-2.5 py-1 text-[8px] font-semibold text-white/32"
                style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
              >
                {capability}
              </Text>
            ),
          )}
        </View>

        {/* =======================================================
            BOTTOM AI SHIMMER
        ======================================================== */}

        <View
          accessibilityElementsHidden={true}
          className="absolute bottom-0 left-0 h-px w-full"
          style={{  }}
        />
      </View>
    </View>
  );
}
