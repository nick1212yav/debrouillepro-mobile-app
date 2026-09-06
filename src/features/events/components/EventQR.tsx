import { View, Text } from "react-native";

// src/features/events/components/EventQR.tsx
import { QrCode, Ticket, CheckCircle } from "lucide-react-native";

interface Props {
  ticketNumber: string;
  eventTitle: string;
  isValid?: boolean;
}

export function EventQR({ ticketNumber, eventTitle, isValid = true }: Props) {
  return (
    <View
      className="rounded-2xl p-5 text-center"
      style={{ borderWidth: 1, borderColor: "rgba(167,139,250,0.25)", borderStyle: "solid" }}
    >
      <View className="flex items-center justify-between mb-4">
        <View className="flex items-center gap-2">
          <Ticket size={16} className="text-purple-400" />
          <Text className="text-white/60 text-xs font-mono">
            {ticketNumber}
          </Text>
        </View>
        {isValid ? (
          <Text className="text-green-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle size={12} /> Valide
          </Text>
        ) : (
          <Text className="text-red-400 text-xs font-bold">Invalide</Text>
        )}
      </View>

      <View className="flex justify-center mb-3">
        <View
          className="w-40 h-40 rounded-2xl flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: "white" }}
        >
          {/* QR Code simulé */}
          <View
            className="w-32 h-32"
            style={{ gap: 2 }}
          >
            {Array.from({ length: 100 }).map((_, i) => {
              const isCorner = [
                0, 1, 2, 10, 11, 12, 20, 21, 22, 7, 8, 9, 17, 18, 19, 27, 28,
                29, 70, 71, 72, 80, 81, 82, 90, 91, 92,
              ].includes(i);
              const isDark = isCorner || Math.sin(i * 137.5) > 0.2;
              return (
                <View
                  key={i}
                  className="rounded-sm"
                  style={{ backgroundColor: isDark ? "#1a0a2e" : "white", aspectRatio: "1" }}
                />
              );
            })}
          </View>
          <View className="absolute inset-0 flex items-center justify-center">
            <View
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{  }}
            >
              <QrCode size={14} className="text-white" />
            </View>
          </View>
        </View>
      </View>

      <Text className="text-white/40 text-[10px]">
        {isValid ? "Présentez ce QR Code à l'entrée" : "Billet non valide"}
      </Text>
    </View>
  );
}
