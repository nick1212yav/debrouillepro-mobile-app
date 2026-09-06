import { View, Text, Pressable } from "react-native";
// src/features/messages/polls/hooks/PollMessage.tsx

import { useState } from "react";

import {
  BarChart3,
  Check,
  Clock3,
  Loader2,
  MoreVertical,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

import { usePoll } from "../hooks/usePolls";

import { PollResults } from "./PollResults";

interface PollMessageProps {
  pollId: Id<"polls">;
  isOwn?: boolean;
  showActions?: boolean;
  onDeleted?: () => void;
}

interface PollResult {
  id: string;
  text: string;
  voteCount: number;
  percentage: number;
}

export function PollMessage({
  pollId,
  isOwn = false,
  showActions = true,
  onDeleted,
}: PollMessageProps) {
  const {
    poll,
    isLoading,
    vote,
    removeVote,
    closePoll,
    reopenPoll,
    deletePoll,
  } = usePoll(pollId);

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (isLoading) {
    return (
      <View className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white/40">
        <Loader2 size={16} className="animate-spin" />
        <Text>Chargement du sondage...</Text></View>
    );
  }

  if (!poll) {
    return (
      <View className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
        <Text>Ce sondage n'est plus disponible.</Text></View>
    );
  }

  const currentUserVotes = poll.currentUserVotes ?? [];

  const expired =
    poll.expired ||
    (!!poll.expiresAt && new Date(poll.expiresAt).getTime() <= Date.now());

  const closed = poll.closed || expired;

  const toggleOption = (optionId: string) => {
    if (closed || isVoting) return;

    if (poll.multipleChoice) {
      setSelectedOptions((current) =>
        current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      );

      return;
    }

    setSelectedOptions([optionId]);
  };

  const submitVote = async () => {
    if (selectedOptions.length === 0 || closed || isVoting) {
      return;
    }

    setIsVoting(true);

    try {
      await vote(selectedOptions);
      setSelectedOptions([]);
    } finally {
      setIsVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    if (isVoting) return;

    setIsVoting(true);

    try {
      await removeVote();
    } finally {
      setIsVoting(false);
    }
  };

  const handleClose = async () => {
    await closePoll();
    setShowMenu(false);
  };

  const handleReopen = async () => {
    await reopenPoll();
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await deletePoll();
    setShowMenu(false);
    onDeleted?.();
  };

  return (
    <View
      className={[
        "relative w-full max-w-md rounded-2xl border p-4",
        isOwn
          ? "border-violet-500/20 bg-violet-500/5"
          : "border-white/10 bg-white/5",
      ].join(" ")}
    >
      <View className="flex items-start gap-3">
        <View className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
          <BarChart3 size={19} className="text-violet-400" />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex items-start justify-between gap-2">
            <Text className="font-semibold leading-snug text-white">
              {poll.question}
            </Text>

            {showActions && isOwn && (
              <View className="relative">
                <Pressable
                 
                  onPress={() => setShowMenu((current) => !current)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40"
                  accessibilityLabel="Actions du sondage"
                >
                  <MoreVertical size={16} />
                </Pressable>

                {showMenu && (
                  <View className="absolute right-0 top-9 z-20 min-w-44 rounded-xl border border-white/10 bg-[#111827] p-1 shadow-2xl">
                    {!poll.closed && !expired && (
                      <Pressable
                       
                        onPress={handleClose}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70"
                      >
                        <XCircle size={14} />
                        <Text>Fermer le sondage</Text></Pressable>
                    )}

                    {poll.closed && !expired && (
                      <Pressable
                       
                        onPress={handleReopen}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-white/70"
                      >
                        <RotateCcw size={14} />
                        <Text>Rouvrir le sondage</Text></Pressable>
                    )}

                    <Pressable
                     
                      onPress={handleDelete}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-red-400"
                    >
                      <Trash2 size={14} />
                      <Text>Supprimer</Text></Pressable>
                  </View>
                )}
              </View>
            )}
          </View>

          <View className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/35">
            {poll.multipleChoice && <Text><Text>Plusieurs réponses</Text></Text>}

            {poll.anonymous && <Text><Text>• Anonyme</Text></Text>}

            {poll.expiresAt && !expired && (
              <Text className="flex items-center gap-1">
                <Clock3 size={11} />
                <Text>Expire le</Text>{new Date(poll.expiresAt).toLocaleString("fr-FR")}
              </Text>
            )}

            {expired && <Text className="text-amber-400/70"><Text>Expiré</Text></Text>}
          </View>
        </View>
      </View>

      <PollResults
        results={poll.results.map((result: PollResult) => ({
          optionId: result.id,
          text: result.text,
          votes: result.voteCount,
          percentage: result.percentage,
        }))}
        totalVotes={poll.totalVotes}
        currentUserVotes={currentUserVotes}
        multipleChoice={poll.multipleChoice}
        anonymous={poll.anonymous}
        closed={closed}
        disabled={isVoting}
        onVote={toggleOption}
      />

      {!closed &&
        selectedOptions.length > 0 &&
        selectedOptions.some((id) => !currentUserVotes.includes(id)) && (
          <Pressable
            type="button"
            onPress={submitVote}
            disabled={isVoting}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isVoting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            <Text>Voter</Text></Pressable>
        )}

      {currentUserVotes.length > 0 && !closed && (
        <Pressable
          type="button"
          onPress={handleRemoveVote}
          disabled={isVoting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white/50 disabled:opacity-50"
        >
          <RotateCcw size={13} />
          <Text>Retirer mon vote</Text></Pressable>
      )}
    </View>
  );
}

export default PollMessage;
