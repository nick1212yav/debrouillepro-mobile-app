// src/features/messages/polls/components/PollMessage.tsx

import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../../chat/services/chat.service";
import { usePolls } from "../hooks/usePolls";

interface PollMessageProps {
  message: Message;
  own?: boolean;
}

interface PollResult {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

interface PollData {
  _id: Id<"polls">;
  question: string;
  options: Array<{ id: string; text: string }>;
  multipleChoice: boolean;
  anonymous: boolean;
  closed: boolean;
  expiresAt?: string;
  results: PollResult[];
  totalVotes: number;
  currentUserVotes: string[];
  expired: boolean;
}

export function PollMessage({ message, own = false }: PollMessageProps) {
  const pollId = (message as { pollId?: Id<"polls"> }).pollId;

  const poll = useQuery(
    api.messages.polls.getPoll,
    pollId ? { pollId } : "skip",
  ) as PollData | undefined;

  const { vote } = usePolls(message.conversationId);

  const [pendingOptionId, setPendingOptionId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVote = useCallback(
    async (optionId: string) => {
      if (!pollId || !poll || poll.closed || poll.expired || pendingOptionId) {
        return;
      }

      setErrorMessage(null);
      setPendingOptionId(optionId);

      try {
        const currentVotes = poll.currentUserVotes;

        let nextVotes: string[];

        if (poll.multipleChoice) {
          nextVotes = currentVotes.includes(optionId)
            ? currentVotes.filter((id) => id !== optionId)
            : [...currentVotes, optionId];
        } else {
          nextVotes = currentVotes.includes(optionId) ? [] : [optionId];
        }

        if (nextVotes.length === 0) {
          await vote(pollId, []);
          /* On laisse le backend gérer removeVote via vote([]) côté hook */
        } else {
          await vote(pollId, nextVotes);
        }
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer votre vote.";
        setErrorMessage(msg);
      } finally {
        setPendingOptionId(null);
      }
    },
    [poll, pollId, pendingOptionId, vote],
  );

  const title = poll?.question ?? message.text?.trim() ?? "Sondage";
  const closed = poll?.closed ?? false;
  const expired = poll?.expired ?? false;
  const locked = closed || expired;

  const primaryText = own ? "#000000" : "#FFFFFF";
  const secondaryText = own ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
  const tertiaryText = own ? "rgba(0,0,0,0.40)" : "rgba(255,255,255,0.40)";
  const cardBorder = own ? "rgba(0,0,0,0.10)" : "rgba(255,255,255,0.10)";
  const cardBg = own ? "rgba(0,0,0,0.03)" : "rgba(255,255,255,0.03)";
  const trackBg = own ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  const fillColor = "#06b6d4";
  const selectedBorderColor = "#22d3ee";

  return (
    <View
      style={[
        styles.container,
        { borderColor: cardBorder, backgroundColor: cardBg },
      ]}
      accessibilityLabel={`Sondage : ${title}`}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: cardBorder }]}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: own
                ? "rgba(0,0,0,0.10)"
                : "rgba(6,182,212,0.12)",
            },
          ]}
        >
          <Text style={styles.icon}>📊</Text>
        </View>

        <View style={styles.headerContent}>
          <Text
            style={[styles.label, { color: tertiaryText }]}
            numberOfLines={1}
          >
            {closed ? "SONDAGE FERMÉ" : expired ? "SONDAGE EXPIRÉ" : "SONDAGE"}
          </Text>

          <Text
            style={[styles.title, { color: primaryText }]}
            numberOfLines={3}
          >
            {title}
          </Text>
        </View>
      </View>

      {/* Options */}
      <View style={styles.content}>
        {!poll ? (
          <Text style={[styles.loading, { color: secondaryText }]}>
            Chargement du sondage…
          </Text>
        ) : (
          <>
            {poll.results.map((result) => {
              const selected = poll.currentUserVotes.includes(result.id);
              const isPending = pendingOptionId === result.id;

              return (
                <Pressable
                  key={result.id}
                  onPress={() => void handleVote(result.id)}
                  disabled={locked || isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`${result.text}, ${result.percentage}%`}
                  accessibilityState={{
                    selected,
                    disabled: locked || isPending,
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    {
                      borderColor: selected ? selectedBorderColor : cardBorder,
                      backgroundColor: selected
                        ? own
                          ? "rgba(34,211,238,0.12)"
                          : "rgba(34,211,238,0.10)"
                        : "transparent",
                    },
                    pressed && !locked && styles.pressed,
                    (locked || isPending) && styles.optionDisabled,
                  ]}
                >
                  <View style={styles.optionTop}>
                    <View style={styles.optionCheckbox}>
                      {selected ? (
                        <Check size={14} color="#ffffff" strokeWidth={3} />
                      ) : null}
                    </View>

                    <Text
                      style={[styles.optionText, { color: primaryText }]}
                      numberOfLines={2}
                    >
                      {result.text}
                    </Text>

                    <Text
                      style={[styles.optionPercent, { color: secondaryText }]}
                    >
                      {result.percentage}%
                    </Text>
                  </View>

                  <View
                    style={[styles.progressTrack, { backgroundColor: trackBg }]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${result.percentage}%`,
                          backgroundColor: fillColor,
                        },
                      ]}
                    />
                  </View>
                </Pressable>
              );
            })}

            <View style={styles.footer}>
              <Text style={[styles.footerText, { color: secondaryText }]}>
                {poll.totalVotes === 0
                  ? "Aucun vote"
                  : `${poll.totalVotes} vote${poll.totalVotes > 1 ? "s" : ""}`}
              </Text>

              {poll.multipleChoice ? (
                <Text style={[styles.footerText, { color: tertiaryText }]}>
                  · Choix multiple
                </Text>
              ) : null}
            </View>

            {errorMessage ? (
              <Text style={styles.errorText} numberOfLines={2}>
                {errorMessage}
              </Text>
            ) : null}
          </>
        )}
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

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  iconWrapper: {
    width: 38,
    height: 38,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },

  icon: {
    fontSize: 18,
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },

  title: {
    marginTop: 3,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 19,
  },

  content: {
    gap: 8,
    padding: 12,
  },

  loading: {
    fontSize: 12,
    textAlign: "center",
    paddingVertical: 8,
  },

  optionRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 8,
  },

  optionTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  optionCheckbox: {
    width: 18,
    height: 18,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 5,
    backgroundColor: "rgba(34,211,238,0.35)",
  },

  optionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "600",
  },

  optionPercent: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "700",
  },

  progressTrack: {
    width: "100%",
    height: 6,
    overflow: "hidden",
    borderRadius: 999,
  },

  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 4,
  },

  footerText: {
    fontSize: 11,
  },

  errorText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "#FCA5A5",
    textAlign: "center",
  },

  optionDisabled: {
    opacity: 0.65,
  },

  pressed: {
    opacity: 0.75,
  },
});

export default PollMessage;
