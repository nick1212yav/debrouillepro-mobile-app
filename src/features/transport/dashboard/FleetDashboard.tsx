import { View, Text } from "react-native";

// src/features/transport/dashboard/FleetDashboard.tsx
import { motion } from "motion/react";
import {
  Car,
  Users,
  TrendingUp,
  Activity,
  Wrench,
  AlertTriangle,
} from "lucide-react-native";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon,
}: MetricCardProps) {
  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] flex items-center justify-between shadow-lg"><View className="space-y-1"><Text className="text-xs text-white/40 font-bold uppercase tracking-wider">{title}</Text><Text className="text-xl font-black text-white">{value}</Text><Text className={`text-[10px] font-bold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>{isPositive ? "↑" : "↓"}{change}ce mois-ci [2]
        </Text></View><View className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-violet-400">{icon}</View></View>
  );
}

export function FleetDashboard() {
  // Données simulées d'évolution des revenus (Kinshasa/Abidjan Coop) [2]
  const monthlyRevenue = [1200000, 1450000, 1300000, 1850000, 2100000, 2450000];
  const maxRevenue = Math.max(...monthlyRevenue);

  return (
    <View className="space-y-6"><View className="flex flex-col gap-1"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Espace Entreprise [2]
        </Text><Text className="text-xl font-black">Suivi de la Flotte Panafricaine [2]
        </Text></View>{}<View className="gap-4"><MetricCard title="Revenus Flotte [2]" value="2 450 000 FCFA" change="18.4%" isPositive={true} icon={<TrendingUp size={18} />} /><MetricCard title="Courses Validées [2]" value="1 280" change="12.1%" isPositive={true} icon={<Car size={18} />} /><MetricCard title="Chauffeurs Actifs [2]" value="45" change="5.4%" isPositive={true} icon={<Users size={18} />} /><MetricCard title="Véhicules en maintenance" value="3" change="1.2%" isPositive={false} icon={<Wrench size={18} />} /></View>{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4"><View className="flex items-center justify-between"><Text className="text-xs font-bold text-white/80">Courbe de revenus mensuels (FCFA) [2]
          </Text><Text className="text-[10px] text-white/40">Derniers 6 mois</Text></View><View className="h-44 w-full relative flex items-end"><svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">{}<defs><linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.25" /><stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" /></linearGradient></defs><path d="M 10,100 L 100,85 L 190,92 L 285,60 L 380,45 L 480,20 L 480,120 L 10,120 Z" fill="url(#chart-grad)" />{}<motion.path d="M 10,100 L 100,85 L 190,92 L 285,60 L 380,45 L 480,20" fill="none" stroke="#8B5CF6" strokeWidth="3.5" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} />{}<circle cx="10" cy="100" r="4" fill="#8B5CF6" /><circle cx="100" cy="85" r="4" fill="#8B5CF6" /><circle cx="190" cy="92" r="4" fill="#8B5CF6" /><circle cx="285" cy="60" r="4" fill="#8B5CF6" /><circle cx="380" cy="45" r="4" fill="#8B5CF6" /><circle cx="480" cy="20" r="5" fill="#10B981" /></svg></View></View>{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-3"><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Alertes de Maintenance IA [2]
        </Text><View className="space-y-2.5"><View className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs"><AlertTriangle className="text-amber-400 flex-shrink-0" size={16} /><Text className="text-white/80"><strong>Toyota Corolla (1234AB01)</strong>: Vidange d'huile et
              révision moteur prévues dans 3 jours [2].
            </Text></View><View className="flex items-center gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs"><AlertTriangle className="text-amber-400 flex-shrink-0" size={16} /><Text className="text-white/80"><strong>Minibus Toyota HiAce</strong>: Usure des freins avant
              détectée par l'assistant IA [2].
            </Text></View></View></View></View>
  );
}
