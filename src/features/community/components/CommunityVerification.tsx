import { View, Text } from "react-native";
import { Shield, CheckCircle, Clock, AlertCircle } from "lucide-react-native";

interface Props {
  isVerified: boolean;
  verificationDate?: number;
  isPending?: boolean;
  isRejected?: boolean;
  rejectionReason?: string;
  onRequestVerification?: () => void;
}

export function CommunityVerification({
  isVerified,
  verificationDate,
  isPending,
  isRejected,
  rejectionReason,
  onRequestVerification,
}: Props) {
  if (isVerified) {
    return (
      <View className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
        <CheckCircle size={16} className="text-green-400" />
        <View className="flex-1">
          <Text className="text-white/80 text-sm font-medium">Compte vérifié</Text>
          {verificationDate && (
            <Text className="text-white/40 text-xs">
              Vérifié le {new Date(verificationDate).toLocaleDateString()}
            </Text>
          )}
        </View>
        <Shield size={14} className="text-green-400" />
      </View>
    );
  }

  if (isPending) {
    return (
      <View className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <Clock size={16} className="text-amber-400" />
        <View className="flex-1">
          <Text className="text-white/80 text-sm font-medium">
            Vérification en cours
          </Text>
          <Text className="text-white/40 text-xs">Nous traitons votre demande</Text>
        </View>
      </View>
    );
  }

  if (isRejected) {
    return (
      <View className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
        <AlertCircle size={16} className="text-red-400" />
        <View className="flex-1">
          <Text className="text-white/80 text-sm font-medium">
            Vérification refusée
          </Text>
          {rejectionReason && (
            <Text className="text-white/40 text-xs">{rejectionReason}</Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
      <Shield size={16} className="text-white/30" />
      <View className="flex-1">
        <Text className="text-white/80 text-sm font-medium"><Text>Non vérifié</Text></Text>
        <Text className="text-white/40 text-xs">
          <Text>Vérifiez votre identité pour plus de confiance</Text></Text>
      </View>
      {onRequestVerification && (
        <Pressable
          onPress={onRequestVerification}
          className="px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 bg-purple-500/10"
        >
          <Text>Demander</Text></Pressable>
      )}
    </View>
  );
}
