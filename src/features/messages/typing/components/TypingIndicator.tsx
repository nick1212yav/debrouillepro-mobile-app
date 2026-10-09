// src/features/messages/typing/components/TypingIndicator.tsx

import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useRef } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useTyping } from "../hooks/useTyping";

interface TypingIndicatorProps {
  conversationId?: Id<"conversations">;
}

interface TypingDotProps {
  delay: number;
}

function TypingDot({ delay }: TypingDotProps) {
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

    return () => {
      animation.stop();
    };
  }, [delay, opacity]);

  return <Animated.View accessible={false} style={[styles.dot, { opacity }]} />;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { typingUsers, isSomeoneTyping, typingText } =
    useTyping(conversationId);

  if (!isSomeoneTyping) {
    return null;
  }

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion="polite"
      accessibilityRole="text"
      accessibilityLabel={typingText}
    >
      <View style={styles.bubble} accessible={false}>
        <View style={styles.dotsRow} accessible={false}>
          <TypingDot delay={0} />
          <TypingDot delay={150} />
          <TypingDot delay={300} />
        </View>

        <Text style={styles.text}>{typingText}</Text>
      </View>

      {typingUsers.length > 0 && (
        <View style={styles.avatarsRow} accessible={false}>
          {typingUsers.slice(0, 3).map((user) => {
            const initial = user.name.trim().charAt(0).toUpperCase();

            return (
              <View
                key={user.userId}
                style={styles.avatarWrapper}
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                {user.image ? (
                  <Image
                    source={{ uri: user.image }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                    accessibilityLabel={user.name}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>{initial || "?"}</Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },

  bubble: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
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
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },

  avatarsRow: {
    flexDirection: "row",
    alignItems: "center",
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
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
  },
});

export default TypingIndicator;
