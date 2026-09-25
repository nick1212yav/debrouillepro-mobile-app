import { View, Text, Image, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import type { Id } from "@/convex/_generated/dataModel";

// src/features/messages/typing/components/TypingIndicator.tsx

import { useTyping } from "../hooks/useTyping";

interface TypingIndicatorProps {
  conversationId?: Id<"conversations">;
}

function TypingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [delay, opacity]);

  return <Animated.View style={[styles.dot, { opacity }]} />;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { typingUsers, isSomeoneTyping, typingText } =
    useTyping(conversationId);

  if (!isSomeoneTyping) return null;

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityLabel={typingText}
    >
      <View style={styles.bubble}>
        <View style={styles.dotsRow}>
          <TypingDot delay={0} />
          <TypingDot delay={150} />
          <TypingDot delay={300} />
        </View>
        <Text style={styles.text}>{typingText}</Text>
      </View>

      {typingUsers.length > 0 && (
        <View style={styles.avatarsRow}>
          {typingUsers.slice(0, 3).map((user) => (
            <View key={user.userId} style={styles.avatarWrapper}>
              {user.image ? (
                <Image
                  style={styles.avatarImage}
                  source={{ uri: user.image }}
                  accessibilityLabel={user.name}
                />
              ) : (
                <Text style={styles.avatarInitial}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  bubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  text: {
    marginLeft: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  avatarsRow: {
    flexDirection: "row",
    marginLeft: -8,
  },
  avatarWrapper: {
    width: 28,
    height: 28,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#0b1120",
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarInitial: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});

export default TypingIndicator;