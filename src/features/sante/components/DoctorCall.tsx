import { Pressable } from "react-native";

// src/features/sante/components/DoctorCall.tsx
import { Phone } from "lucide-react-native";

interface DoctorCallProps {
  onCall: () => void;
  phone?: string;
  disabled?: boolean;
}

export function DoctorCall({
  onCall,
  phone,
  disabled = false,
}: DoctorCallProps) {
  return (
    <Pressable onPress={onCall} disabled={disabled || !phone} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors bg-green-500/20 text-green-400 border border-green-500/20 disabled:opacity-40">
      <Phone size={14} />
      {phone ? "Appeler" : "Numéro indisponible"}
    </Pressable>
  );
}
