import { View, Pressable, Text } from "react-native";
import { useEffect, useState } from "react";
import { Bell, Menu, Sparkles } from "lucide-react-native";

import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user";
import UserAvatar from "@/components/ui/user-avatar";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TopBarProps {
  onMenuOpen: () => void;
  onProfileOpen: () => void;
  onNotificationsOpen: () => void;
  onRecompensesOpen?: () => void;
}

interface Greeting {
  text: string;
  emoji: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TAGLINES = [
  "Que veux-tu régler aujourd'hui ?",
  "Ton Afrique dans ta poche. 🌍",
  "Prêt à conquérir ta journée ? 🚀",
  "Une action suffit pour changer les choses.",
  "Ta ville, tes opportunités. ⚡",
  "Explore. Connecte. Réalise.",
  "Tout ce dont tu as besoin, ici. 💡",
  "Fais bouger les choses aujourd'hui. 💪",
  "Le futur se construit maintenant.",
  "Qu'est-ce qu'on règle ensemble ? 🤝",
  "Ta communauté t'attend. 👥",
  "Chaque jour est une nouvelle opportunité. ✨",
];

const TAGLINE_INTERVAL = 5000;
const TAGLINE_TRANSITION = 350;

// ─────────────────────────────────────────────────────────────────────────────
// Greeting
// ─────────────────────────────────────────────────────────────────────────────

function getGreeting(): Greeting {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return {
      text: "Bonjour",
      emoji: "☀️",
    };
  }

  if (hour >= 12 && hour < 14) {
    return {
      text: "Bon appétit",
      emoji: "🍽️",
    };
  }

  if (hour >= 14 && hour < 18) {
    return {
      text: "Bon après-midi",
      emoji: "🌤️",
    };
  }

  if (hour >= 18 && hour < 21) {
    return {
      text: "Bonsoir",
      emoji: "🌇",
    };
  }

  return {
    text: "Bonne nuit",
    emoji: "🌙",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared visual primitives
// ─────────────────────────────────────────────────────────────────────────────

const glassButtonClass = [
  "relative",
  "flex",
  "h-10",
  "w-10",
  "shrink-0",
  "items-center",
  "justify-center",
  "rounded-2xl",
  "border",
  "border-white/[0.08]",
  "bg-white/[0.055]",
  "text-white",
  "backdrop-blur-xl",
  "transition-all",
  "duration-200",
  "hover:border-white/[0.16]",
  "hover:bg-white/[0.09]",
  "hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)]",
  "focus:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-violet-400/70",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-[#030617]",
  "active:scale-[0.92]",
].join(" ");

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

function TopBarInner({
  onMenuOpen,
  onProfileOpen,
  onNotificationsOpen,
  onRecompensesOpen,
}: TopBarProps) {
  const user = useCurrentUser();
  const reduceMotion = useReducedMotion();

  const [taglineIdx, setTaglineIdx] = useState(() =>
    Math.floor(Math.random() * TAGLINES.length),
  );

  const [taglineVisible, setTaglineVisible] = useState(true);

  const greeting = getGreeting();

  const displayName = getDisplayName(user).trim();

  const firstName =
    displayName.length > 0 ? displayName.split(/\s+/)[0] : "Nick";

  /**
   * --------------------------------------------------------------------------
   * Rotation du message d'accueil
   * --------------------------------------------------------------------------
   *
   * On garde volontairement une rotation légère :
   * elle donne de la vie au Home sans devenir intrusive.
   */
  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const interval = undefined(() => {
      setTaglineVisible(false);

      undefined;
    }, TAGLINE_INTERVAL);

    return () => {
      undefined;
    };
  }, [reduceMotion]);

  /**
   * --------------------------------------------------------------------------
   * Animation principale
   * --------------------------------------------------------------------------
   */
  const containerInitial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, y: -18 };

  const containerAnimate = reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <View
      className="relative z-20 px-4 pb-3 pt-4 sm:px-5"
    >
      {/* ================================================================== */}
      {/* Ambient top glow                                                    */}
      {/* ================================================================== */}

      <View
       
        className="absolute left-1/2 top-0 h-24 w-72 -translate-x-1/2 rounded-full opacity-70"
        style={{  }}
      />

      {/* ================================================================== */}
      {/* Main glass container                                                */}
      {/* ================================================================== */}

      <View className="relative overflow-hidden rounded-[26px] border border-white/[0.07] bg-[#080b1d]/55 px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
        {/* Inner highlight */}
        <View
         
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* Subtle violet aura */}
        <View
         
          className="absolute -right-16 -top-20 h-40 w-40 rounded-full"
          style={{  }}
        />

        <View className="relative flex items-center justify-between gap-2">
          {/* ================================================================ */}
          {/* LEFT — Menu                                                       */}
          {/* ================================================================ */}

          <Tooltip>
            <TooltipTrigger asChild>
              <Pressable
                type="button"
                onPress={onMenuOpen}
                accessibilityLabel="Ouvrir le menu"
                className={glassButtonClass}
              >
                <Menu
                  size={19}
                  strokeWidth={2.1}
                  className="text-white/90"
                  accessibilityElementsHidden={true}
                />

                {/* tiny decorative indicator */}
                <Text
                 
                  className="absolute right-[7px] top-[6px] h-1 w-1 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.9)]"
                />
              </Pressable>
            </TooltipTrigger>

            <TooltipContent side="bottom"><Text>Ouvrir le menu</Text></TooltipContent>
          </Tooltip>

          {/* ================================================================ */}
          {/* CENTER — Greeting                                                 */}
          {/* ================================================================ */}

          <View className="min-w-0 flex-1 px-2 text-center">
            <>
              <View
                key={`${greeting.text}-${firstName}`}
                className="flex flex-col items-center"
              >
                <View className="flex max-w-full items-center justify-center gap-1.5">
                  <Text className="truncate text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-white sm:text-lg">
                    {greeting.text},{" "}
                    <Text className="text-white">{firstName}</Text>
                  </Text>

                  <Text
                    accessibilityElementsHidden={true}
                    className="text-base"
                  >
                    {greeting.emoji}
                  </Text>
                </View>

                {/* ========================================================== */}
                {/* Rotating tagline                                            */}
                {/* ========================================================== */}

                <View className="mt-1 flex h-[18px] w-full items-center justify-center overflow-hidden">
                  <AnimatePresence mode="wait">
                    {taglineVisible && (
                      <Text
                        key={taglineIdx}
                        className="max-w-[250px] truncate text-[10px] font-medium leading-none tracking-wide text-white/42 sm:text-[11px]"
                      >
                        {TAGLINES[taglineIdx]}
                      </Text>
                    )}
                  </AnimatePresence>
                </View>
              </View>
            </>
          </View>

          {/* ================================================================ */}
          {/* RIGHT — Actions                                                   */}
          {/* ================================================================ */}

          <View className="flex shrink-0 items-center gap-1.5">
            {/* ============================================================ */}
            {/* Rewards                                                        */}
            {/* ============================================================ */}

            {onRecompensesOpen && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Pressable
                    type="button"
                    onPress={onRecompensesOpen}
                    accessibilityLabel="Ouvrir mes récompenses"
                    className={`${glassButtonClass} hidden sm:flex`}
                  >
                    <Sparkles
                      size={17}
                      strokeWidth={2}
                      className="text-violet-300"
                      accessibilityElementsHidden={true}
                    />

                    <Text
                     
                      className="absolute inset-0 rounded-2xl opacity-0"
                      style={{  }}
                    />
                  </Pressable>
                </TooltipTrigger>

                <TooltipContent side="bottom"><Text>Mes récompenses</Text></TooltipContent>
              </Tooltip>
            )}

            {/* ============================================================ */}
            {/* Notifications                                                  */}
            {/* ============================================================ */}

            <Tooltip>
              <TooltipTrigger asChild>
                <Pressable
                  type="button"
                  onPress={onNotificationsOpen}
                  accessibilityLabel="Notifications"
                  className={`${glassButtonClass} group`}
                >
                  <Bell
                    size={18}
                    strokeWidth={2}
                    className="text-white/90"
                    accessibilityElementsHidden={true}
                  />

                  {/* Notification status glow */}
                  <Text
                   
                    className="absolute right-[6px] top-[6px] h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_9px_rgba(167,139,250,0.9)]"
                  />
                </Pressable>
              </TooltipTrigger>

              <TooltipContent side="bottom"><Text>Notifications</Text></TooltipContent>
            </Tooltip>

            {/* ============================================================ */}
            {/* Profile                                                         */}
            {/* ============================================================ */}

            <Tooltip>
              <TooltipTrigger asChild>
                <Pressable
                  type="button"
                  onPress={onProfileOpen}
                  accessibilityLabel="Ouvrir mon profil"
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.10] bg-white/[0.06] p-[2px] shadow-[0_6px_22px_rgba(0,0,0,0.22)]"
                >
                  <UserAvatar user={user} size="w-full h-full" showOnline />

                  {/* Premium avatar ring */}
                  <Text
                   
                    className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.12]"
                  />
                </Pressable>
              </TooltipTrigger>

              <TooltipContent side="bottom"><Text>Mon profil</Text></TooltipContent>
            </Tooltip>
          </View>
        </View>

        {/* ================================================================== */}
        {/* Bottom micro-accent                                                */}
        {/* ================================================================== */}

        <View
         
          className="absolute bottom-0 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/30 to-transparent"
        />
      </View>
    </View>
  );
}

export default function TopBar(props: TopBarProps) {
  return <TopBarInner {...props} />;
}
