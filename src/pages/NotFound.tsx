import { Link, usePathname } from "expo-router";
import { View, Text } from "react-native";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = usePathname();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location,
    );
  }, [location]);

  return (
    <View className="min-h-screen flex items-center justify-center bg-background">
      <View className="text-center space-y-6">
        <View className="space-y-2">
          <Text className="text-6xl font-bold text-muted-foreground">404</Text>
          <Text className="text-2xl font-semibold">Page Not Found</Text>
        </View>
        <Text className="text-lg text-muted-foreground max-w-md mx-auto">
          This page does not exist.
        </Text>
        <View className="pt-4">
          <Button asChild>
            <Link href="/"><Text>Return to Home</Text></Link>
          </Button>
        </View>
      </View>
    </View>
  );
}
