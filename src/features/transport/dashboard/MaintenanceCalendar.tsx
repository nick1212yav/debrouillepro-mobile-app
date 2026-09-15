import { View, Text } from "react-native";

// src/features/transport/dashboard/MaintenanceCalendar.tsx
import {
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react-native";

interface MaintenanceTask {
  id: string;
  vehicleModel: string;
  plate: string;
  taskType:
    | "Vidange d'huile"
    | "Pneumatiques"
    | "Freins"
    | "Contrôle technique";
  dueDate: string;
  status: "urgent" | "scheduled" | "completed";
}

export function MaintenanceCalendar() {
  const tasks: MaintenanceTask[] = [
    {
      id: "1",
      vehicleModel: "Toyota Corolla",
      plate: "5678AB01",
      taskType: "Vidange d'huile",
      dueDate: "Aujourd'hui",
      status: "urgent",
    },
    {
      id: "2",
      vehicleModel: "Minibus Toyota HiAce",
      plate: "9012CD02",
      taskType: "Freins",
      dueDate: "Dans 3 jours",
      status: "urgent",
    },
    {
      id: "3",
      vehicleModel: "Honda CG125",
      plate: "3456EF03",
      taskType: "Pneumatiques",
      dueDate: "Le 12 Août",
      status: "scheduled",
    },
    {
      id: "4",
      vehicleModel: "Hyundai Accent",
      plate: "7890GH04",
      taskType: "Contrôle technique",
      dueDate: "Le 18 Août",
      status: "completed",
    },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 text-white"><View className="flex items-center gap-2"><Calendar size={16} className="text-violet-400" /><Text className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Planning d'Entretien Flotte [2]
        </Text></View><View className="space-y-3">{tasks.map((task) => (
          <View key={task.id} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] flex items-center justify-between gap-4 transition-colors"><View className="flex items-center gap-3"><View className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  task.status === "urgent"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse"
                    : task.status === "scheduled"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>{task.status === "urgent" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <Wrench size={15} />
                )}</View><View><Text className="text-xs font-bold text-white">{task.vehicleModel}({task.plate})
                </Text><Text className="text-[10px] text-white/40 mt-0.5">{task.taskType}• Échéance : {task.dueDate}</Text></View></View><View className="flex items-center gap-1.5 text-[10px] font-bold">{task.status === "completed" ? (
                <Text className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Fait [2]
                </Text>
              ) : (
                <Text className={
                    task.status === "urgent" ? "text-red-400" : "text-amber-400"
                  }>
                  À faire [2]
                </Text>
              )}<ChevronRight size={12} className="text-white/20" /></View></View>
        ))}</View></View>
  );
}
