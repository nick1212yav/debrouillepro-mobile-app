import { Text, View } from "react-native";

export function ServiceExperience({
  experience,
  languages,
}: {
  experience?: string;
  languages?: string[];
}) {
  return (
    <View className="space-y-2">
      {experience && (
        <Text className="text-white/70 text-sm">
          <Text className="text-white/40">Expérience :</Text> {experience}
        </Text>
      )}
      {languages && languages.length > 0 && (
        <Text className="text-white/70 text-sm">
          <Text className="text-white/40">Langues :</Text>{" "}
          {languages.join(", ")}
        </Text>
      )}
    </View>
  );
}
