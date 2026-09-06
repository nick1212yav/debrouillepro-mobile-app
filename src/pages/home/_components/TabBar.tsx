import { View, Pressable, Text } from "react-native";
import { useMemo } from "react";
import { Compass, Home, MessageCircle, Plus, Zap } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TabDefinition {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface TabBarProps {
  active: string;
  onChange: (tab: string) => void;
  hidden?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const BASE_TABS: TabDefinition[] = [
  {
    id: "home",
    label: "Accueil",
    icon: Home,
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: Compass,
  },
  {
    id: "actions",
    label: "Actions",
    icon: Zap,
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function TabBar({
  active,
  onChange,
  hidden = false,
}: TabBarProps) {
  const reduceMotion = useReducedMotion();

  /**
   * --------------------------------------------------------------------------
   * Backend-ready notification state
   * --------------------------------------------------------------------------
   *
   * Pour l'instant, nous ne fabriquons pas de compteur.
   * Il pourra être remplacé directement par la query Convex Messages.
   */
  const msgUnread = 0;

  const tabs = useMemo<TabDefinition[]>(
    () =>
      BASE_TABS.map((tab) => ({
        ...tab,
        badge: tab.id === "messages" ? msgUnread : undefined,
      })),
    [msgUnread],
  );

  return (
    <>
      {!hidden && (
        <View
          key="main-tabbar"
          accessibilityLabel="Navigation principale"
          className="fixed inset-x-0 bottom-0 z-40 px-2 sm:px-4"
          style={{
            paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
          }}
        >
          {/* ================================================================= */}
          {/* Outer floating shell                                              */}
          {/* ================================================================= */}

          <View className="relative mx-auto max-w-2xl">
            {/* ----------------------------------------------------------------- */}
            {/* Ambient glow                                                      */}
            {/* ----------------------------------------------------------------- */}

            <View
             
              className="absolute -inset-x-10 bottom-0 h-28 rounded-[40px] opacity-70"
              style={{  }}
            />

            {/* ----------------------------------------------------------------- */}
            {/* Glass container                                                    */}
            {/* ----------------------------------------------------------------- */}

            <View
              className="relative overflow-visible rounded-[30px] border border-white/[0.08] bg-[#050714]/88 shadow-[0_-8px_40px_rgba(0,0,0,0.30),0_12px_45px_rgba(0,0,0,0.25)]"
              style={{  }}
            >
              {/* Top glass highlight */}
              <View
               
                className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
              />

              {/* Inner ambient violet glow */}
              <View
               
                className="absolute left-1/2 top-0 h-16 w-72 -translate-x-1/2 rounded-full opacity-40"
                style={{  }}
              />

              {/* =============================================================== */}
              {/* Navigation row                                                   */}
              {/* =============================================================== */}

              <View className="relative flex h-[70px] items-end justify-between px-2 pb-1 sm:h-[74px] sm:px-3">
                {/* ============================================================= */}
                {/* Left navigation                                                 */}
                {/* ============================================================= */}

                <View className="flex min-w-0 flex-1 items-center justify-around">
                  {tabs.slice(0, 2).map((tab) => (
                    <TabItem
                      key={tab.id}
                      tab={tab}
                      isActive={active === tab.id}
                      onPress={() => onChange(tab.id)}
                      reduceMotion={Boolean(reduceMotion)}
                    />
                  ))}
                </View>

                {/* ============================================================= */}
                {/* CENTER CREATE ACTION                                            */}
                {/* ============================================================= */}

                <CreateButton
                  active={active === "create"}
                  onPress={() => onChange("create")}
                  reduceMotion={Boolean(reduceMotion)}
                />

                {/* ============================================================= */}
                {/* Right navigation                                                */}
                {/* ============================================================= */}

                <View className="flex min-w-0 flex-1 items-center justify-around">
                  {tabs.slice(2).map((tab) => (
                    <TabItem
                      key={tab.id}
                      tab={tab}
                      isActive={active === tab.id}
                      onPress={() => onChange(tab.id)}
                      reduceMotion={Boolean(reduceMotion)}
                    />
                  ))}
                </View>
              </View>

              {/* Bottom subtle accent */}
              <View
               
                className="absolute bottom-0 left-1/2 h-px w-20 -translate-x-1/2 bg-gradient-to-r from-transparent via-violet-400/25 to-transparent"
              />
            </View>
          </View>
        </View>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Create button
// ─────────────────────────────────────────────────────────────────────────────

interface CreateButtonProps {
  active: boolean;
  onClick: () => void;
  reduceMotion: boolean;
}

function CreateButton({ active, onClick, reduceMotion }: CreateButtonProps) {
  return (
    <View className="relative flex w-[82px] shrink-0 justify-center">
      {/* --------------------------------------------------------------------- */}
      {/* Outer ambient glow                                                    */}
      {/* --------------------------------------------------------------------- */}

      <View
        className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-[22px]"
        style={{  }}
      />

      {/* --------------------------------------------------------------------- */}
      {/* Button                                                                */}
      {/* --------------------------------------------------------------------- */}

      <Pressable
        onPress={onClick}
        accessibilityLabel={active ? "Fermer le menu de création" : "Créer"}
        aria-pressed={active}
        className="group relative -top-5 flex h-[58px] w-[58px] items-center justify-center rounded-[21px] border border-white/[0.16] bg-gradient-to-br from-violet-500 via-indigo-500 to-indigo-600 shadow-[0_10px_35px_rgba(99,102,241,0.48),0_0_0_1px_rgba(255,255,255,0.06)] outline-none sm:h-[62px] sm:w-[62px]"
      >
        {/* Glass shine */}
        <Text
         
          className="absolute inset-[1px] rounded-[20px] bg-gradient-to-b from-white/[0.18] via-transparent to-transparent opacity-80"
        />

        {/* Active inner ring */}
        <Text
          className="absolute inset-0 rounded-[21px] border border-white/20"
        />

        {/* Icon */}
        <View
          className="relative z-10"
        >
          <Plus
            size={29}
            strokeWidth={2.3}
            className="text-white"
          />
        </View>

        {/* Tiny top highlight */}
        <Text
         
          className="absolute left-1/2 top-[6px] h-1 w-8 -translate-x-1/2 rounded-full bg-white/25"
        />
      </Pressable>

      {/* Label */}
      <Text
        className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 text-[9px] font-bold tracking-wide text-violet-300"
      >
        Créer
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab item
// ─────────────────────────────────────────────────────────────────────────────

interface TabItemProps {
  tab: TabDefinition;
  isActive: boolean;
  onClick: () => void;
  reduceMotion: boolean;
}

function TabItem({ tab, isActive, onClick, reduceMotion }: TabItemProps) {
  const Icon = tab.icon;

  return (
    <Pressable
      onPress={onClick}
      aria-current={isActive ? "page" : undefined}
      accessibilityLabel={tab.label}
      className="group relative flex h-[62px] w-[70px] flex-col items-center justify-center rounded-2xl outline-none sm:w-[78px]"
    >
      {/* ===================================================================== */}
      {/* Active background                                                     */}
      {/* ===================================================================== */}

      <>
        {isActive && (
          <View
            className="absolute inset-x-2 top-1 h-[39px] rounded-2xl border border-violet-400/[0.18] bg-violet-500/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          />
        )}
      </>

      {/* ===================================================================== */}
      {/* Active glow                                                            */}
      {/* ===================================================================== */}

      <>
        {isActive && (
          <View
            className="absolute left-1/2 top-2 h-7 w-10 -translate-x-1/2 rounded-full bg-violet-500/20"
          />
        )}
      </>

      {/* ===================================================================== */}
      {/* Icon                                                                   */}
      {/* ===================================================================== */}

      <View
        className="relative z-10 flex h-7 w-8 items-center justify-center"
      >
        <View
        >
          <Icon
            size={20}
            strokeWidth={isActive ? 2.45 : 1.85}
            className={
              isActive
                ? "text-violet-300"
                : "text-white/55 transition-colors duration-200 group-hover:text-white/80"
            }
          />
        </View>
      </View>

      {/* ===================================================================== */}
      {/* Label                                                                  */}
      {/* ===================================================================== */}

      <Text
        className="relative z-10 mt-1 text-[9px] font-semibold tracking-[0.01em] sm:text-[10px]"
      >
        {tab.label}
      </Text>

      {/* ===================================================================== */}
      {/* Active dot                                                             */}
      {/* ===================================================================== */}

      <>
        {isActive && (
          <Text
            className="absolute bottom-0.5 h-1 w-1 rounded-full bg-violet-300 shadow-[0_0_8px_rgba(196,181,253,0.9)]"
          />
        )}
      </>

      {/* ===================================================================== */}
      {/* Notification badge                                                    */}
      {/* ===================================================================== */}

      {typeof tab.badge === "number" && tab.badge > 0 && (
        <Text
          className="absolute right-[5px] top-[2px] z-20 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border border-[#080b1d] bg-gradient-to-br from-red-400 to-rose-600 px-1 text-[8px] font-black leading-none text-white shadow-[0_3px_10px_rgba(244,63,94,0.38)]"
        >
          {tab.badge > 99 ? "99+" : tab.badge}
        </Text>
      )}
    </Pressable>
  );
}
