import { View, Text, Image, GestureResponderEvent } from "react-native";

// src/features/auth/components/AuthLayout.tsx
import { useState, useEffect, type ReactNode } from "react";
import { motion } from "motion/react";
import {
  Sparkles,
  CheckCircle2,
  Home,
  Briefcase,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Globe,
  Search,
  Coins,
  Bell,
  Cpu,
  ArrowRight,
} from "lucide-react-native";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

// ── Écrans simulés sur le smartphone avec images qualitatives d'Unsplash [2] ──
const SMARTPHONE_SCREENS = [
  {
    id: "marketplace",
    module: "Marketplace [2]",
    title: "MacBook Pro M3 • 16GB",
    detail: "1 450 USD • Kinshasa",
    image:
      "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=80&q=80",
    color: "#8B5CF6", // Violet
    icon: ShoppingBag,
  },
  {
    id: "sante",
    module: "Téléconsultation [2]",
    title: "Dr. Kabange • Pédiatre",
    detail: "Disponible immédiatement",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=80&q=80",
    color: "#a78bfa", // Violet clair
    icon: Heart,
  },
  {
    id: "jobs",
    module: "Emplois [2]",
    title: "Product Designer Senior",
    detail: "CDI • Abidjan",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&q=80",
    color: "#818cf8", // Indigo
    icon: Briefcase,
  },
  {
    id: "ia",
    module: "Assistant IA [2]",
    title: "Modèle de contrat de bail",
    detail: "Généré en 3 secondes par l'IA",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80",
    color: "#c084fc", // Fuchsia doux
    icon: Cpu,
  },
  {
    id: "paiements",
    module: "Paiements [2]",
    title: "Mobile Money Intégré",
    detail: "Envoyer & recevoir de l'argent",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=80&q=80",
    color: "#8B5CF6",
    icon: Coins,
  },
  {
    id: "immo",
    module: "Immobilier [2]",
    title: "Villa Moderne • Gombe",
    detail: "Location gérée via l'application",
    image:
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=80&q=80",
    color: "#fbbf24", // Ambre doux
    icon: Home,
  },
];

// ── Notifications simulées avec visuels dynamiques [2] ──
const MOCK_NOTIFICATIONS = [
  {
    title: "Rendez-vous médecin [2]",
    message: "Rendez-vous confirmé à 14h30 avec le Dr. Kabange [2]",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=60&q=80",
    icon: Heart,
    color: "rgba(239, 68, 68, 0.12)",
  },
  {
    title: "Paiement reçu [2]",
    message: "Marie vous a envoyé +15 000 FCFA via l'application [2]",
    image:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=60&q=80",
    icon: Coins,
    color: "rgba(16, 185, 129, 0.12)",
  },
  {
    title: "Nouveau message [2]",
    message: "L'assistant IA a fini d'analyser votre document juridique [2]",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=60&q=80",
    icon: Cpu,
    color: "rgba(139, 92, 246, 0.12)",
  },
  {
    title: "Offre d'emploi [2]",
    message: "Une nouvelle carrière de Designer correspond à vos critères [2]",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=60&q=80",
    icon: Briefcase,
    color: "rgba(59, 130, 246, 0.12)",
  },
];

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  const [activeScreen, setActiveScreen] = useState(0);
  const [activeNotification, setActiveNotification] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 1. Cycle d'alternance des écrans (3,5s) [2]
  useEffect(() => {
    const screenInterval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % SMARTPHONE_SCREENS.length);
    }, 3500);
    return () => clearInterval(screenInterval);
  }, []);

  // 2. Cycle d'alternance des notifications (5s) [2]
  useEffect(() => {
    const notifInterval = setInterval(() => {
      setActiveNotification((prev) => (prev + 1) % MOCK_NOTIFICATIONS.length);
    }, 5000);
    return () => clearInterval(notifInterval);
  }, []);

  // 3. Suivi de la souris pour l'effet de projecteur lumineux (Desktop)
  const handleMouseMove = (e: GestureResponderEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const currentScreen = SMARTPHONE_SCREENS[activeScreen];
  const CurrentScreenIcon = currentScreen.icon;

  const currentNotif = MOCK_NOTIFICATIONS[activeNotification];
  const CurrentNotifIcon = currentNotif.icon;

  return (
    <View className="min-h-screen w-full relative flex items-center justify-center lg:justify-between overflow-x-hidden overflow-y-auto font-sans" style={{  }}>{}{isHovered && (
        <View className="absolute hidden lg:block rounded-full pointer-events-none z-0 filter blur-[120px] opacity-10" style={{ width: 350, height: 350, left: mousePos.x - 175, top: mousePos.y - 175 }} />
      )}{}<View className="absolute inset-0 overflow-hidden pointer-events-none z-0"><View animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }} transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }} className="absolute -top-60 -left-60 w-[800px] h-[800px] rounded-full filter blur-[150px] opacity-[0.22]" style={{  }} /><View animate={{
            scale: [1, 1.08, 1],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }} transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }} className="absolute -bottom-60 right-10 w-[800px] h-[800px] rounded-full filter blur-[160px] opacity-[0.14]" style={{  }} />{}<View className="absolute inset-0 w-full h-full hidden lg:block"><View animate={{ y: [0, -30, 0], opacity: [0.1, 0.4, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[20%] left-[25%] w-2 h-2 rounded-full bg-violet-400 filter blur-[1px]" /><View animate={{ y: [0, -50, 0], opacity: [0.1, 0.5, 0.1] }} transition={{
              duration: 11,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }} className="absolute top-[60%] left-[15%] w-1.5 h-1.5 rounded-full bg-violet-400 filter blur-[1px]" /><View animate={{ y: [0, -40, 0], opacity: [0.1, 0.4, 0.1] }} transition={{
              duration: 9,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2,
            }} className="absolute top-[40%] left-[45%] w-2.5 h-2.5 rounded-full bg-indigo-400 filter blur-[1px]" /></View></View>{}<View className="hidden lg:flex flex-col justify-between w-[54%] h-screen p-16 relative z-10">{}<View initial={{ opacity: 0, y: -15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-center gap-3"><View className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)] relative overflow-hidden group"><Globe className="text-white animate-[spin_12s_linear_infinite]" size={20} /><View className="absolute inset-0 bg-white/20 opacity-0 transition-opacity" /></View><Text className="text-xl font-black text-white tracking-tight">Débrouille<Text className="text-violet-400">Pro</Text></Text><View className="px-2.5 py-1 rounded-full border border-violet-500/10 bg-violet-500/5 text-[9px] font-bold text-violet-300/60 tracking-widest uppercase"><Text>Super-App [2]</Text></View></View>{}<View className="relative my-auto flex items-center justify-center h-[520px] w-full max-w-xl mx-auto">{}<View className="absolute inset-0 w-full h-full opacity-[0.28] z-0 pointer-events-none scale-110"><svg viewBox="0 0 400 500" className="w-full h-full fill-none"><motion.path d="M 120,100 L 220,120 L 280,180 L 300,280 L 260,380 L 190,440 L 170,350 L 110,250 L 70,160 Z" stroke="rgba(139, 92, 246, 0.22)" strokeWidth="1.5" strokeDasharray="4,4" animate={{ strokeDashoffset: [0, -50] }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }} /><path d="M 120,100 L 280,180" stroke="rgba(139, 92, 246, 0.12)" strokeWidth="1" /><path d="M 110,250 L 300,280" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="1" /><path d="M 220,120 L 170,350" stroke="rgba(139, 92, 246, 0.12)" strokeWidth="1" /><circle cx="120" cy="100" r="4" fill="#3B82F6" className="animate-pulse" /><circle cx="220" cy="120" r="5" fill="#8B5CF6" /><circle cx="280" cy="180" r="4" fill="#3B82F6" /><circle cx="300" cy="280" r="6" fill="#8B5CF6" className="animate-pulse" /><circle cx="170" cy="350" r="5" fill="#3B82F6" /><circle cx="190" cy="440" r="4" fill="#8B5CF6" /></svg></View>{}<View style={{ perspective: "1000px" }} className="z-10"><View initial={{ rotateY: -15, rotateX: 6, rotateZ: -1 }} whileHover={{ rotateY: 0, rotateX: 0, rotateZ: 0, scale: 1.02 }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ transformStyle: "preserve-3d" }} className="relative w-[240px] h-[480px] rounded-[44px] border-[5px] border-white/10 bg-[#070811]/95 shadow-[-20px_32px_80px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-4">{}<View className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent -translate-x-full transition-transform duration-1000 pointer-events-none" />{}<View className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-black rounded-full flex items-center justify-center"><View className="w-1 h-1 rounded-full bg-white/20" /></View>{}<View className="mt-4 flex items-center justify-between"><View className="flex items-center gap-1.5"><Text className="text-[10px] font-black text-white tracking-tight">DébrouillePro
                  </Text></View><View className="flex items-center gap-1"><Text className="text-[7px] text-white/50">Live</Text><View className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /></View></View>{}<View className="mt-3.5 px-2 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2"><Search size={10} className="text-white/40" /><Text className="text-[9px] text-white/30">Rechercher...</Text></View>{}<View className="mt-4 flex-1 flex flex-col overflow-hidden relative"><View><View key={currentScreen.id} initial={{ x: "100%", opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: "-100%", opacity: 0 }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="flex-1 flex flex-col justify-between"><View className="space-y-4">{}<View className="flex items-center gap-2"><View className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/10" style={{ backgroundColor: `${currentScreen.color}15` }}><CurrentScreenIcon size={14} /></View><Text className="text-[9px] font-black tracking-wider uppercase" style={{ color: currentScreen.color }}>{currentScreen.module}</Text></View>{}<View className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden shadow-inner flex flex-col"><Image className="w-full h-24 object-cover border-b border-white/5 opacity-80" source={{ uri: currentScreen.image }} accessibilityLabel={currentScreen.title} /><View className="p-3 space-y-1"><Text className="text-[11px] text-white font-black leading-tight">{currentScreen.title}</Text><Text className="text-[9px] text-white/40 font-medium">{currentScreen.detail}</Text></View></View></View>{}<View className="w-full py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center gap-1.5"><Text className="text-[9px] font-bold text-violet-300">Découvrir le module
                      </Text><ArrowRight size={10} className="text-violet-300" /></View></View></View></View></View></View>{}<View className="absolute top-1/2 -translate-y-1/2 -right-16 z-30 w-60"><View><View key={activeNotification} initial={{ opacity: 0, y: 15, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -15, scale: 0.95 }} transition={{ duration: 0.5, ease: "easeOut" }} className="p-3.5 rounded-2xl border border-white/10 bg-[#070914]/90 backdrop-blur-xl flex items-start gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">{}<Image className="w-8 h-8 rounded-xl object-cover border border-white/5 opacity-85" source={{ uri: currentNotif.image }} accessibilityLabel={currentNotif.title} /><View className="flex-1 space-y-0.5"><View className="flex justify-between items-center"><Text className="text-[10px] font-bold text-white">{currentNotif.title}</Text><Text className="text-[7px] text-white/30">1s</Text></View><Text className="text-[9px] text-white/50 leading-relaxed font-medium">{currentNotif.message}</Text></View></View></View></View>{}{}<View animate={{
              y: [0, -8, 0],
              rotate: [-0.5, 0.5, -0.5],
            }} transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-8 -left-12 z-30 p-3 rounded-2xl border border-white/[0.08] bg-[#070914]/85 backdrop-blur-md flex items-center gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors"><View className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20"><Home size={16} className="text-violet-400" /></View><View><Text className="text-xs font-bold text-white">Immobilier [2]</Text><Text className="text-[9px] text-white/40 font-semibold">Logements certifiés [2]
              </Text></View></View>{}<View animate={{
              y: [0, -5, 0],
              rotate: [0.5, -0.5, 0.5],
            }} transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }} className="absolute top-16 -right-16 z-30 p-3 rounded-2xl border border-white/[0.08] bg-[#070914]/85 backdrop-blur-md flex items-center gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors"><View className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20"><Briefcase size={16} className="text-violet-400" /></View><View><Text className="text-xs font-bold text-white">Emplois [2]</Text><Text className="text-[9px] text-white/40 font-semibold">Carrières vérifiées [2]
              </Text></View></View>{}<View animate={{
              y: [0, -7, 0],
              rotate: [-0.5, 0.5, -0.5],
            }} transition={{
              duration: 5.2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.8,
            }} className="absolute bottom-12 -left-14 z-30 p-3 rounded-2xl border border-white/[0.08] bg-[#070914]/85 backdrop-blur-md flex items-center gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors"><View className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20"><Heart size={16} className="text-violet-400" /></View><View><Text className="text-xs font-bold text-white">Santé [2]</Text><Text className="text-[9px] text-white/40 font-semibold">Praticiens agréés [2]
              </Text></View></View>{}<View animate={{
              y: [0, -4, 0],
              rotate: [0.5, -0.5, 0.5],
            }} transition={{
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }} className="absolute bottom-16 -right-16 z-30 p-3 rounded-2xl border border-white/[0.08] bg-[#070914]/85 backdrop-blur-md flex items-center gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.5)] transition-colors"><View className="w-9 h-9 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20"><ShoppingBag size={16} className="text-violet-400" /></View><View><Text className="text-xs font-bold text-white">Marketplace [2]</Text><Text className="text-[9px] text-white/40 font-semibold">Boutiques de confiance [2]
              </Text></View></View></View>{}<View className="space-y-4"><View initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex items-center gap-8 border-t border-white/5 pt-8"><View className="flex items-center gap-2.5 text-white/40"><CheckCircle2 size={14} className="text-violet-500" /><Text className="text-xs font-semibold">Gratuit & sans commission [2]
              </Text></View><View className="flex items-center gap-2.5 text-white/40"><ShieldCheck size={14} className="text-violet-500" /><Text className="text-xs font-semibold">Données hautement sécurisées [2]
              </Text></View><View className="flex items-center gap-2.5 text-white/40"><Coins size={14} className="text-violet-500" /><Text className="text-xs font-semibold">Paiements sécurisés [2]
              </Text></View></View></View></View>{}<View className="w-full lg:w-[44%] flex items-center justify-center p-6 relative z-10"><View initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-[430px] flex flex-col items-center gap-6">{}<View className="text-center lg:hidden space-y-3"><View className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02] backdrop-blur-md shadow-inner"><Globe size={14} className="text-violet-400 animate-[spin_8s_linear_infinite]" /><Text className="text-[10px] font-black text-white/70 tracking-widest uppercase">La Super-App Africaine [2]
              </Text></View><Text className="text-4xl font-black text-white tracking-tight">Débrouille<Text className="text-violet-400">Pro</Text></Text><Text className="text-white/50 text-sm max-w-sm mx-auto leading-relaxed">La première Super-App panafricaine qui réunit toute votre vie
              numérique [2].
            </Text></View>{}<View className="text-left w-full hidden lg:block space-y-2.5 pl-2"><View className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/20 bg-violet-500/10 text-violet-400 text-[10px] font-bold uppercase tracking-wider"><Sparkles size={11} /><Text>Super-App [2]</Text></View><Text className="text-3xl font-black text-white leading-tight tracking-tight max-w-sm">Une seule application.{" "}<Text className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">Des dizaines de possibilités. [2]
              </Text></Text></View>{}<View className="w-full rounded-[32px] p-8 md:p-10 relative overflow-hidden" style={{ backgroundColor: "rgba(255, 255, 255, 0.03)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.09)", borderStyle: "solid", boxShadow: "0 30px 100px rgba(0, 0, 0, 0.55)" }}>{}<View className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/35 to-transparent" />{}<View className="mb-8"><Text className="text-2xl font-bold text-white tracking-tight mb-1.5">{title}</Text>{subtitle && (
                <Text className="text-white/40 text-xs font-semibold">{subtitle}</Text>
              )}</View>{}<View className="space-y-6">{children}</View></View>{}<View className="lg:hidden flex items-center justify-center gap-4 text-[10px] text-white/30 font-semibold mt-2"><Text>✓ Gratuit & sans frais [2]</Text><Text>✓ Sécurisé [2]</Text><Text>✓ Mobile Money [2]</Text></View></View></View></View>
  );
}
