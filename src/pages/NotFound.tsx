// src/pages/NotFound.tsx
import React, { useEffect } from "react";
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
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.code}>404</Text>
          <Text style={styles.title}>Page Not Found</Text>
        </View>
        <Text style={styles.body}>This page does not exist.</Text>
        <View style={styles.buttonWrapper}>
          <Button onPress={() => router.push("/")}>Return to Home</Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    width: "100%",
    maxWidth: 400,
  },
  headerBlock: {
    alignItems: "center",
    gap: 8,
  },
  code: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 60,
    fontWeight: "700",
    lineHeight: 68,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
  },
  body: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  buttonWrapper: {
    paddingTop: 16,
  },
});
