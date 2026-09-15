import { Text } from "react-native";

interface OpenStatusProps {
  isOpen: boolean;
}

export function OpenStatus({ isOpen }: OpenStatusProps) {
  return (
    <Text className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
        isOpen
          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
      }`}>
      {isOpen ? "Ouvert" : "Fermé"}
    </Text>
  );
}
