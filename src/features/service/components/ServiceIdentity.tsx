import { View, Image } from "react-native";
export function ServiceIdentity({
  name,
  specialty,
  avatar,
}: {
  name: string;
  specialty: string;
  avatar?: string;
}) {
  return (
    <View className="flex items-center gap-3">
      {avatar ? (
        <Image className="w-12 h-12 rounded-full object-cover"  source={{ uri: avatar }}/>
      ) : (
        <View className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl font-bold">
          {name[0]}
        </View>
      )}
      <View>
        <Text className="text-white font-semibold">{name}</Text>
        <Text className="text-white/50 text-xs">{specialty}</Text>
      </View>
    </View>
  );
}
