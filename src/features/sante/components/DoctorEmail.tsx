import { Pressable, Linking } from "react-native";

// src/features/sante/components/DoctorEmail.tsx
import { Mail } from "lucide-react-native";

interface DoctorEmailProps {
  email?: string;
  onEmail?: () => void;
}

export function DoctorEmail({ email, onEmail }: DoctorEmailProps) {
  const handleClick = () => {
    if (onEmail) {
      onEmail();
    } else if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  return (
    <Pressable onPress={handleClick} disabled={!email} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-colors bg-blue-500/20 text-blue-400 border border-blue-500/20 disabled:opacity-40">
      <Mail size={14} />
      Email
    </Pressable>
  );
}
