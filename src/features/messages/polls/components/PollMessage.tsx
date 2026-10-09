// src/features/messages/polls/components/PollMessage.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Message } from "../../chat/services/chat.service";

interface PollMessageProps {
  message: Message;
  own?: boolean;
}

export function PollMessage({ message, own = false }: PollMessageProps) {
  const title = message.text?.trim() || "Nouveau sondage";

  return (
    <View
      style={[
        styles.container,
        own ? styles.containerOwn : styles.containerOther,
      ]}
    >
      {/* Header */}
      <View
        style={[styles.header, own ? styles.headerOwn : styles.headerOther]}
      >
        <View
          style={[
            styles.iconWrapper,
            own ? styles.iconWrapperOwn : styles.iconWrapperOther,
          ]}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          <Text style={styles.icon}>📊</Text>
        </View>

        <View style={styles.headerContent}>
          <Text
            style={[styles.label, own ? styles.labelOwn : styles.labelOther]}
          >
            Sondage
          </Text>

          <Text
            style={[styles.title, own ? styles.titleOwn : styles.titleOther]}
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
      </View>

      {/* Poll content */}
      <View style={styles.content}>
        <View
          style={[
            styles.optionCard,
            own ? styles.optionCardOwn : styles.optionCardOther,
          ]}
        >
          <View style={styles.optionHeader}>
            <Text
              style={[
                styles.optionLabel,
                own ? styles.optionLabelOwn : styles.optionLabelOther,
              ]}
            >
              Options du sondage
            </Text>

            <Text
              style={[
                styles.voteCount,
                own ? styles.voteCountOwn : styles.voteCountOther,
              ]}
            >
              0 vote
            </Text>
          </View>

          <View
            style={[
              styles.progressTrack,
              own ? styles.progressTrackOwn : styles.progressTrackOther,
            ]}
          >
            <View
              style={[
                styles.progressFill,
                own ? styles.progressFillOwn : styles.progressFillOther,
              ]}
            />
          </View>
        </View>

        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityLabel="Voter au sondage"
          accessibilityState={{ disabled: true }}
          style={[
            styles.voteButton,
            own ? styles.voteButtonOwn : styles.voteButtonOther,
          ]}
        >
          <Text
            style={[
              styles.voteText,
              own ? styles.voteTextOwn : styles.voteTextOther,
            ]}
          >
            Voter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 250,
    maxWidth: 380,
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 16,
  },

  containerOwn: {
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(0,0,0,0.04)",
  },

  containerOther: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  headerOwn: {
    borderBottomColor: "rgba(0,0,0,0.10)",
  },

  headerOther: {
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  iconWrapper: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  iconWrapperOwn: {
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  iconWrapperOther: {
    backgroundColor: "rgba(6,182,212,0.10)",
  },

  icon: {
    fontSize: 18,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  labelOwn: {
    color: "rgba(0,0,0,0.40)",
  },

  labelOther: {
    color: "rgba(103,232,249,0.70)",
  },

  title: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
  },

  titleOwn: {
    color: "#000000",
  },

  titleOther: {
    color: "#ffffff",
  },

  content: {
    gap: 8,
    padding: 12,
  },

  optionCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  optionCardOwn: {
    borderColor: "rgba(0,0,0,0.10)",
    backgroundColor: "rgba(0,0,0,0.025)",
  },

  optionCardOther: {
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },

  optionLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
  },

  optionLabelOwn: {
    color: "rgba(0,0,0,0.70)",
  },

  optionLabelOther: {
    color: "rgba(255,255,255,0.70)",
  },

  voteCount: {
    flexShrink: 0,
    fontSize: 10,
  },

  voteCountOwn: {
    color: "rgba(0,0,0,0.35)",
  },

  voteCountOther: {
    color: "rgba(255,255,255,0.30)",
  },

  progressTrack: {
    height: 8,
    overflow: "hidden",
    borderRadius: 999,
  },

  progressTrackOwn: {
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  progressTrackOther: {
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  progressFill: {
    width: "0%",
    height: "100%",
    borderRadius: 999,
  },

  progressFillOwn: {
    backgroundColor: "rgba(0,0,0,0.20)",
  },

  progressFillOther: {
    backgroundColor: "rgba(34,211,238,0.30)",
  },

  voteButton: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  voteButtonOwn: {
    backgroundColor: "rgba(0,0,0,0.10)",
  },

  voteButtonOther: {
    backgroundColor: "rgba(6,182,212,0.10)",
  },

  voteText: {
    fontSize: 12,
    fontWeight: "600",
  },

  voteTextOwn: {
    color: "rgba(0,0,0,0.35)",
  },

  voteTextOther: {
    color: "rgba(103,232,249,0.40)",
  },
});

export default PollMessage;
