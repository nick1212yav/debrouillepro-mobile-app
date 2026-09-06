import { View } from "react-native";

export function ServiceVideo({ url }: { url?: string }) {
  if (!url) return null;
  return (
    <View className="rounded-2xl overflow-hidden aspect-video bg-black/20">
      <View src={url} controls className="w-full h-full object-cover" />
    </View>
  );
}
