import { View, Pressable, Text } from "react-native";

// src/features/events/components/TicketScanner.tsx
import { useState } from "react";
import { QrCode, Camera, CheckCircle, XCircle } from "lucide-react-native";

interface Props {
  onScan: (ticketId: string) => Promise<{ valid: boolean; message?: string }>;
}

export function TicketScanner({ onScan }: Props) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{
    valid: boolean;
    message?: string;
  } | null>(null);

  const handleScan = async () => {
    setScanning(true);
    try {
      // Simulation de scan
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const res = await onScan("TICKET-DEMO-12345");
      setResult(res);
    } catch {
      setResult({ valid: false, message: "Erreur de scan" });
    } finally {
      setScanning(false);
    }
  };

  return (
    <View className="rounded-2xl p-5 text-center bg-white/5 border border-white/5"><View className="flex items-center justify-between mb-4"><Text className="text-white font-bold text-sm">Scanner un billet</Text><QrCode size={16} className="text-purple-400" /></View><Pressable onPress={handleScan} disabled={scanning} className="w-full py-3 rounded-xl flex items-center justify-center gap-2 text-white font-medium disabled:opacity-50" style={{  }}><Camera size={16} />{scanning ? "Scan en cours..." : "Scanner"}</Pressable>{result && (
        <View initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-3 rounded-xl flex items-center gap-2" style={{ backgroundColor: result.valid
                      ? "rgba(16,185,129,0.1)"
                      : "rgba(239,68,68,0.1)" }}>
          {result.valid ? (
            <CheckCircle size={16} className="text-green-400" />
          ) : (
            <XCircle size={16} className="text-red-400" />
          )}
          <Text className="text-sm" style={{ color: result.valid ? "#10B981" : "#EF4444" }}>
            {result.valid
              ? "Billet valide !"
              : result.message || "Billet invalide"}
          </Text>
        </View>
      )}</View>
  );
}
