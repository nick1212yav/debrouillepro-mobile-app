// src/features/messages/polls/components/PollComposer.tsx

import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

interface PollOption {
  id: string;
  text: string;
}

function createOptionId(): string {
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

  const [options, setOptions] = useState<PollOption[]>([
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
    if (options.length >= 20) {
      return;
    }

    setOptions((current) => [
      ...current,
      {
        id: createOptionId(),
        text: "",
      },
    ]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      return;
    }

    setOptions((current) => current.filter((option) => option.id !== id));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

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
          hasExpiration && expiresAt.trim()
            ? new Date(expiresAt.trim()).toISOString()
            : undefined,
      });

      onCreated?.(result);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Vote size={20} color="#a78bfa" />
        </View>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Créer un sondage</Text>

          <Text style={styles.headerSubtitle}>
            Pose une question à la conversation
          </Text>
        </View>
      </View>

      {/* Question */}
      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder="Pose ta question..."
        placeholderTextColor="rgba(255,255,255,0.30)"
        maxLength={500}
        multiline
        textAlignVertical="top"
        editable={!isSubmitting}
        accessibilityLabel="Question du sondage"
        style={styles.questionInput}
      />

      {/* Options */}
      <View style={styles.options}>
        {options.map((option, index) => (
          <View key={option.id} style={styles.optionRow}>
            <TextInput
              value={option.text}
              onChangeText={(value) => updateOption(option.id, value)}
              placeholder={`Choix ${index + 1}`}
              placeholderTextColor="rgba(255,255,255,0.30)"
              maxLength={200}
              editable={!isSubmitting}
              accessibilityLabel={`Choix ${index + 1}`}
              style={styles.optionInput}
            />

            {options.length > 2 ? (
              <Pressable
                onPress={() => removeOption(option.id)}
                disabled={isSubmitting}
                accessibilityRole="button"
                accessibilityLabel={`Supprimer le choix ${index + 1}`}
                accessibilityState={{
                  disabled: isSubmitting,
                }}
                hitSlop={6}
                style={({ pressed }) => [
                  styles.removeButton,
                  pressed && !isSubmitting && styles.pressed,
                ]}
              >
                <Trash2 size={16} color="rgba(255,255,255,0.45)" />
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {/* Add option */}
      {options.length < 20 ? (
        <Pressable
          onPress={addOption}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Ajouter un choix"
          accessibilityState={{
            disabled: isSubmitting,
          }}
          style={({ pressed }) => [
            styles.addOptionButton,
            pressed && !isSubmitting && styles.pressed,
          ]}
        >
          <Plus size={15} color="#a78bfa" />

          <Text style={styles.addOptionText}>Ajouter un choix</Text>
        </Pressable>
      ) : null}

      <View style={styles.separator} />

      {/* Settings */}
      <View style={styles.settings}>
        <PollSetting
          title="Plusieurs réponses"
          description="Autoriser plusieurs choix"
          checked={multipleChoice}
          disabled={isSubmitting}
          onToggle={() => setMultipleChoice((current) => !current)}
        />

        <PollSetting
          title="Vote anonyme"
          description="Ne pas afficher qui a voté"
          checked={anonymous}
          disabled={isSubmitting}
          onToggle={() => setAnonymous((current) => !current)}
        />

        <View style={styles.settingBlock}>
          <View style={styles.settingMain}>
            <View style={styles.settingIcon}>
              <Clock3 size={16} color="rgba(255,255,255,0.45)" />
            </View>

            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Date d'expiration</Text>

              <Text style={styles.settingDescription}>
                Fermer automatiquement après cette date
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => setHasExpiration((current) => !current)}
            disabled={isSubmitting}
            accessibilityRole="checkbox"
            accessibilityLabel="Activer la date d'expiration"
            accessibilityState={{
              checked: hasExpiration,
              disabled: isSubmitting,
            }}
            style={[styles.checkbox, hasExpiration && styles.checkboxChecked]}
          >
            {hasExpiration ? (
              <Check size={13} color="#ffffff" strokeWidth={3} />
            ) : null}
          </Pressable>
        </View>

        {hasExpiration ? (
          <TextInput
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder="Date et heure d'expiration"
            placeholderTextColor="rgba(255,255,255,0.30)"
            editable={!isSubmitting}
            accessibilityLabel="Date et heure d'expiration"
            style={styles.expirationInput}
          />
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {onCancel ? (
          <Pressable
            onPress={onCancel}
            disabled={isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Annuler"
            accessibilityState={{
              disabled: isSubmitting,
            }}
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && !isSubmitting && styles.pressed,
            ]}
          >
            <Text style={styles.cancelText}>Annuler</Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          accessibilityLabel="Créer le sondage"
          accessibilityState={{
            disabled: !canSubmit,
            busy: isSubmitting,
          }}
          style={({ pressed }) => [
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
            pressed && canSubmit && styles.submitButtonPressed,
          ]}
        >
          {isSubmitting ? (
            <Text style={styles.submitText}>Création...</Text>
          ) : (
            <>
              <Check size={16} color="#ffffff" />

              <Text style={styles.submitText}>Créer le sondage</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

interface PollSettingProps {
  title: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}

function PollSetting({
  title,
  description,
  checked,
  disabled,
  onToggle,
}: PollSettingProps) {
  return (
    <View style={styles.settingBlock}>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>

        <Text style={styles.settingDescription}>{description}</Text>
      </View>

      <Pressable
        onPress={onToggle}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityLabel={title}
        accessibilityState={{
          checked,
          disabled,
        }}
        style={[styles.checkbox, checked && styles.checkboxChecked]}
      >
        {checked ? <Check size={13} color="#ffffff" strokeWidth={3} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 512,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "#111827",
    padding: 16,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },

  headerIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(139,92,246,0.15)",
  },

  headerContent: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.40)",
  },

  questionInput: {
    width: "100%",
    minHeight: 84,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    lineHeight: 20,
    color: "#ffffff",
  },

  options: {
    gap: 8,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  optionInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 42,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#ffffff",
  },

  removeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  addOptionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 4,
  },

  addOptionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#a78bfa",
  },

  separator: {
    height: 1,
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  settings: {
    gap: 14,
  },

  settingBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  settingMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },

  settingIcon: {
    width: 20,
    alignItems: "center",
  },

  settingContent: {
    flex: 1,
    minWidth: 0,
  },

  settingTitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
  },

  settingDescription: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.35)",
  },

  checkbox: {
    width: 20,
    height: 20,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  checkboxChecked: {
    borderColor: "#7c3aed",
    backgroundColor: "#7c3aed",
  },

  expirationInput: {
    width: "100%",
    minHeight: 42,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#ffffff",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },

  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 16,
  },

  cancelText: {
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.60)",
  },

  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
    paddingHorizontal: 16,
  },

  submitButtonDisabled: {
    opacity: 0.4,
  },

  submitButtonPressed: {
    opacity: 0.8,
  },

  submitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },

  pressed: {
    opacity: 0.65,
  },
});

export default PollComposer;
