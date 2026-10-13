import { Stack } from "expo-router";

export default function ServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0D1117" },
      }}
    />
  );
}
