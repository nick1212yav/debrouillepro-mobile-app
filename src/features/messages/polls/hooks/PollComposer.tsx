import { View, Text, Pressable, TextInput } from "react-native";
import { useMemo, useState } from "react";

import { Check, Clock3, Plus, Trash2, Vote } from "lucide-react-native";

import type { Id } from "@/convex/_generated/dataModel";

import type { CreatePollInput } from "../services/polls.service";

interface PollComposerProps {
  conversationId: Id<"conversations">;
  messageId?: Id<"messages">;

  onCreate: (input: CreatePollInput) => Promise<unknown>;

  onCreated?: (poll: unknown) => void;

  onCancel?: () => void;
}

function createOptionId() {
  return `option_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function PollComposer({
  conversationId,
  messageId,
  onCreate,
  onCreated,
  onCancel,
}: PollComposerProps) {
  const [question, setQuestion] = useState("");

  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    {
      id: createOptionId(),
      text: "",
    },
    {
      id: createOptionId(),
      text: "",
    },
  ]);

  const [multipleChoice, setMultipleChoice] = useState(false);

  const [anonymous, setAnonymous] = useState(false);

  const [hasExpiration, setHasExpiration] = useState(false);

  const [expiresAt, setExpiresAt] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const validOptions = useMemo(
    () => options.filter((option) => option.text.trim().length > 0),
    [options],
  );

  const canSubmit =
    question.trim().length > 0 && validOptions.length >= 2 && !isSubmitting;

  const updateOption = (id: string, text: string) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === id
          ? {
              ...option,
              text,
            }
          : option,
      ),
    );
  };

  const addOption = () => {
    if (options.length >= 20) return;

    setOptions((current) => [
      ...current,
      {
        id: createOptionId(),
        text: "",
      },
    ]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;

    setOptions((current) => current.filter((option) => option.id !== id));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const result = await onCreate({
        conversationId,
        messageId,

        question: question.trim(),

        options: validOptions.map((option) => ({
          id: option.id,
          text: option.text.trim(),
        })),

        multipleChoice,
        anonymous,

        expiresAt:
          hasExpiration && expiresAt
            ? new Date(expiresAt).toISOString()
            : undefined,
      });

      onCreated?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#111827] p-4 shadow-2xl">
      <View className="mb-4 flex items-center gap-3">
        <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15">
          <Vote size={20} className="text-violet-400" />
        </View>

        <View>
          <Text className="font-semibold text-white">Créer un sondage</Text>

          <Text className="text-xs text-white/40">
            Pose une question à la conversation
          </Text>
        </View>
      </View>

      <TextInput
        value={question}
        onChangeText={(text) => setQuestion(text)}
        placeholder="Pose ta question..."
       
        maxLength={500}
        className="mb-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
       multiline textAlignVertical="top"/>

      <View className="space-y-2">
        {options.map((option, index) => (
          <View key={option.id} className="flex items-center gap-2">
            <TextInput
              value={option.text}
              onChangeText={(text) => updateOption(option.id, text)}
              placeholder={`Choix ${index + 1}`}
              maxLength={200}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30"
            />

            {options.length > 2 && (
              <Pressable
               
                onPress={() => removeOption(option.id)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white/40"
                accessibilityLabel="Supprimer le choix"
              >
                <Trash2 size={16} />
              </Pressable>
            )}
          </View>
        ))}
      </View>

      {options.length < 20 && (
        <Pressable
         
          onPress={addOption}
          className="mt-3 flex items-center gap-2 text-xs font-medium text-violet-400"
        >
          <Plus size={15} />
          <Text>Ajouter un choix</Text></Pressable>
      )}

      <View className="my-4 border-t border-white/10" />

      <View className="space-y-3">
        <Text className="flex items-center justify-between gap-3">
          <View>
            <Text className="text-sm text-white/80">Plusieurs réponses</Text>
            <Text className="text-[11px] text-white/35">
              Autoriser plusieurs choix
            </Text>
          </View>

          <Pressable
           
            checked={multipleChoice}
            onPress={(event) => setMultipleChoice(event.target.checked)}
            className="h-4 w-4"
           accessibilityRole="checkbox" accessibilityState={{ checked: multipleChoice }}/>
        </Text>

        <Text className="flex items-center justify-between gap-3">
          <View>
            <Text className="text-sm text-white/80">Vote anonyme</Text>
            <Text className="text-[11px] text-white/35">
              Ne pas afficher qui a voté
            </Text>
          </View>

          <Pressable
           
            checked={anonymous}
            onPress={(event) => setAnonymous(event.target.checked)}
            className="h-4 w-4"
           accessibilityRole="checkbox" accessibilityState={{ checked: anonymous }}/>
        </Text>

        <Text className="flex items-center justify-between gap-3">
          <View className="flex items-center gap-2">
            <Clock3 size={16} className="text-white/40" />

            <View>
              <Text className="text-sm text-white/80">Date d'expiration</Text>
              <Text className="text-[11px] text-white/35">
                Fermer automatiquement après cette date
              </Text>
            </View>
          </View>

          <Pressable
           
            checked={hasExpiration}
            onPress={(event) => setHasExpiration(event.target.checked)}
            className="h-4 w-4"
           accessibilityRole="checkbox" accessibilityState={{ checked: hasExpiration }}/>
        </Text>

        {hasExpiration && (
          <TextInput
           
            value={expiresAt}
            min={new Date().toISOString().slice(0, 16)}
            onChangeText={(text) => setExpiresAt(text)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none"
          />
        )}
      </View>

      <View className="mt-5 flex gap-2">
        {onCancel && (
          <Pressable
            type="button"
            onPress={onCancel}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-white/60"
          >
            <Text>Annuler</Text></Pressable>
        )}

        <Pressable
          type="button"
          onPress={handleSubmit}
          disabled={!canSubmit}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={16} />
          {isSubmitting ? "Création..." : "Créer le sondage"}
        </Pressable>
      </View>
    </View>
  );
}

export default PollComposer;
