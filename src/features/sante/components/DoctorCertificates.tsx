import { View, Text } from "react-native";

// src/features/sante/components/DoctorCertificates.tsx
import { Award } from "lucide-react-native";

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  year?: string;
}

interface DoctorCertificatesProps {
  certificates: Certificate[];
}

export function DoctorCertificates({ certificates }: DoctorCertificatesProps) {
  if (!certificates || certificates.length === 0) return null;

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-3 flex items-center gap-2"><Award size={14} />Certificats
      </Text><View className="space-y-2">{certificates.map((cert) => (
          <View key={cert.id} className="flex justify-between items-start"><View><Text className="text-white text-sm font-medium">{cert.name}</Text><Text className="text-white/40 text-xs">{cert.issuer}</Text></View>{cert.year && (
              <Text className="text-white/30 text-xs">{cert.year}</Text>
            )}</View>
        ))}</View></View>
  );
}
