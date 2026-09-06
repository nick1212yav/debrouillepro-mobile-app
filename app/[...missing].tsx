import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      pathname,
    );
  }, [pathname]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headingContainer}>
          <Text style={styles.code}>404</Text>
          <Text style={styles.title}>Page Not Found</Text>
        </View>

        <Text style={styles.description}>This page does not exist.</Text>

        <View style={styles.buttonContainer}>
          <Button onPress={() => router.replace("/")}>Return to Home</Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 24,
  },
  content: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },
  headingContainer: {
    alignItems: "center",
    gap: 8,
  },
  code: {
    fontSize: 60,
    lineHeight: 68,
    fontWeight: "700",
    color: "#737373",
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: "#171717",
    textAlign: "center",
  },
  description: {
    marginTop: 24,
    fontSize: 18,
    lineHeight: 28,
    color: "#737373",
    textAlign: "center",
  },
  buttonContainer: {
    marginTop: 28,
  },
});
