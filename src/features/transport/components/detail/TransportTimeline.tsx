import { View, Text } from "react-native";

interface TransportTimelineProps {
  origin: string;
  destination: string;
}

export function TransportTimeline({
  origin,
  destination,
}: TransportTimelineProps) {
  const steps = [
    { name: origin, desc: "Départ initial", active: true },
    {
      name: "Checkpoint Bas-Congo",
      desc: "Contrôle technique & Péage",
      active: true,
    },
    {
      name: "Station Route 1",
      desc: "Pause rafraîchissement (10 min)",
      active: false,
    },
    { name: destination, desc: "Arrivée finale", active: false },
  ];

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4">
      <Text className="text-[10px] font-black text-white/40 uppercase tracking-widest">
        Chronologie du trajet
      </Text>
      <View className="relative pl-6 space-y-6">
        <View className="absolute left-1.5 top-1 bottom-1 w-[2px] bg-white/5" />
        {steps.map((step, i) => (
          <View key={step.name} className="relative">
            <View
              className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-[#020412] flex items-center justify-center transition-all ${
                step.active
                  ? "bg-violet-500 shadow-md shadow-violet-500/20"
                  : "bg-white/10"
              }`}
            />
            <View>
              <Text
                className={`text-xs font-black ${step.active ? "text-white" : "text-white/40"}`}
              >
                {step.name}
              </Text>
              <Text className="text-[10px] text-white/40 mt-0.5">{step.desc}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
