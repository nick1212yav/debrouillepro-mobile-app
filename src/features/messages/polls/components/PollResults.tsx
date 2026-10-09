// src/features/messages/polls/components/PollResults.tsx

import { CheckCircle2 } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface PollResultOption {
  optionId: string;
  text: string;
  votes: number;
  percentage: number;
}

interface PollResultsProps {
  results: PollResultOption[];
  totalVotes: number;
  currentUserVotes?: string[];
  multipleChoice?: boolean;
  anonymous?: boolean;
  closed?: boolean;
  onVote?: (optionId: string) => void;
  disabled?: boolean;
}

export function PollResults({
  results,
  totalVotes,
  currentUserVotes = [],
  multipleChoice = false,
  anonymous = false,
  closed = false,
  onVote,
  disabled = false,
}: PollResultsProps) {
  const hasVoted = currentUserVotes.length > 0;

  const canVote = !disabled && !closed && (!hasVoted || multipleChoice);

  return (
    <View style={styles.container}>
      <View style={styles.results}>
        {results.map((result) => {
          const selected = currentUserVotes.includes(result.optionId);

          const percentage = Math.max(
            0,
            Math.min(
              100,
              Number.isFinite(result.percentage) ? result.percentage : 0,
            ),
          );

          return (
            <Pressable
              key={result.optionId}
              disabled={!canVote}
              onPress={() => onVote?.(result.optionId)}
              accessibilityRole="button"
              accessibilityLabel={`${result.text}, ${percentage}%`}
              accessibilityState={{
                disabled: !canVote,
                selected,
              }}
              style={({ pressed }) => [
                styles.option,
                selected ? styles.optionSelected : styles.optionDefault,
                pressed && canVote && styles.optionPressed,
              ]}
            >
              {/* Vote percentage background */}
              <View
                pointerEvents="none"
                style={[
                  styles.progress,
                  {
                    width: `${percentage}%`,
                  },
                ]}
              />

              {/* Content */}
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radio,
                    selected ? styles.radioSelected : styles.radioDefault,
                  ]}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {selected ? <CheckCircle2 size={13} color="#ffffff" /> : null}
                </View>

                <Text style={styles.optionText} numberOfLines={2}>
                  {result.text}
                </Text>

                <Text style={styles.percentage}>{percentage}%</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.voteCount}>
          {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
        </Text>

        {anonymous ? <Text style={styles.anonymous}>Vote anonyme</Text> : null}

        {closed ? <Text style={styles.closed}>Sondage fermé</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 12,
  },

  results: {
    gap: 8,
  },

  option: {
    position: "relative",
    width: "100%",
    minHeight: 48,
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: 12,
  },

  optionDefault: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },

  optionSelected: {
    borderColor: "rgba(139,92,246,0.70)",
    backgroundColor: "rgba(139,92,246,0.04)",
  },

  optionPressed: {
    opacity: 0.78,
  },

  progress: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  optionContent: {
    position: "relative",
    zIndex: 1,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  radio: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
  },

  radioDefault: {
    borderColor: "rgba(255,255,255,0.25)",
    backgroundColor: "transparent",
  },

  radioSelected: {
    borderColor: "#a78bfa",
    backgroundColor: "#7c3aed",
  },

  optionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.85)",
  },

  percentage: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.50)",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    paddingTop: 4,
  },

  voteCount: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },

  anonymous: {
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },

  closed: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(251,191,36,0.70)",
  },
});

export default PollResults;
