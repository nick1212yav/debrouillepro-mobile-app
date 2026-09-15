import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  Send,
  Reply,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  publicationId: Id<"publications">;
  canAsk?: boolean;
  isOwner?: boolean; // true si l'utilisateur connecté est le propriétaire de l'annonce
}

interface Question {
  _id: Id<"publicationQuestions">;
  publicationId: Id<"publications">;
  askerId: Id<"users">;
  askerName: string;
  question: string;
  answer?: string;
  answererId?: Id<"users">;
  answeredAt?: number;
  createdAt: number;
}

export function AnnonceQuestions({
  publicationId,
  canAsk = true,
  isOwner = false,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  const questionsData = useQuery(api.annonceQuestions.listQuestions, {
    publicationId,
  });
  const askQuestion = useMutation(api.annonceQuestions.askQuestion);
  const answerQuestion = useMutation(api.annonceQuestions.answerQuestion);
  const deleteQuestion = useMutation(api.annonceQuestions.deleteQuestion);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
    setReplyTo(null);
  };

  // ✅ Poser une question
  const handleSubmit = async () => {
    if (!newQuestion.trim()) return;
    setIsSubmitting(true);
    try {
      await askQuestion({
        publicationId,
        question: newQuestion.trim(),
      });
      toast.success("Question posée !");
      setNewQuestion("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Répondre à une question (vendeur uniquement)
  const handleReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    setIsReplying(true);
    try {
      await answerQuestion({
        questionId: questionId as Id<"publicationQuestions">,
        answer: replyText.trim(),
      });
      toast.success("Réponse envoyée !");
      setReplyTo(null);
      setReplyText("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de l'envoi",
      );
    } finally {
      setIsReplying(false);
    }
  };

  // ✅ Supprimer une question (pour le propriétaire ou l'auteur)
  const handleDelete = async (questionId: string) => {
    if (!confirm("Supprimer cette question ?")) return;
    try {
      await deleteQuestion({
        questionId: questionId as Id<"publicationQuestions">,
      });
      toast.success("Question supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (questionsData === undefined) {
    return (
      <View className="text-white/40 text-sm"><Text>Chargement des questions...</Text></View>
    );
  }

  const questions: Question[] = questionsData || [];

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><MessageSquare size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Questions / Réponses
        </Text><Text className="text-xs text-white/30">({questions.length})</Text></View>{}<View className="space-y-2 max-h-64 overflow-y-auto pr-1">{questions.length === 0 ? (
          <Text className="text-white/30 text-sm italic">Aucune question pour le moment
          </Text>
        ) : (
          questions.map((q) => (
            <View key={q._id} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden"><Pressable onPress={() => toggleExpand(q._id)} className="w-full flex items-start gap-2 p-3 text-left"><User size={14} className="text-white/30 flex-shrink-0 mt-0.5" /><View className="flex-1 min-w-0"><View className="flex items-center gap-2"><Text className="text-white/70 text-sm font-medium">{q.askerName}</Text><Text className="text-white/20 text-[10px]">{new Date(q.createdAt).toLocaleDateString()}</Text></View><Text className="text-white/80 text-sm mt-1">{q.question}</Text>{expanded === q._id && q.answer && (
                    <View initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-2 p-2 rounded-lg bg-white/5 border border-white/5">
                      <View className="flex items-start gap-2"><Reply size={12} className="text-emerald-400 mt-0.5" /><View><Text className="text-white/60 text-sm">Réponse : {q.answer}</Text><Text className="text-white/20 text-[10px] mt-0.5">{q.answeredAt
                              ? new Date(q.answeredAt).toLocaleDateString()
                              : ""}</Text></View></View>
                    </View>
                  )}</View><View className="flex-shrink-0">{q.answer ? (
                    <Text className="text-xs text-emerald-400/60">
                      ✓ Répondu
                    </Text>
                  ) : (
                    <Text className="text-xs text-amber-400/60">
                      En attente
                    </Text>
                  )}{expanded === q._id ? (
                    <ChevronUp size={16} className="text-white/20" />
                  ) : (
                    <ChevronDown size={16} className="text-white/20" />
                  )}</View></Pressable>{}{expanded === q._id && (
                <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-3 pb-3 space-y-2 border-t border-white/5 pt-2">
                  {/* Si le vendeur peut répondre et que la question n'a pas encore de réponse */}
                  {isOwner && !q.answer && replyTo !== q._id && (
                    <Pressable onPress={() => setReplyTo(q._id)} className="text-xs text-blue-400 transition-colors flex items-center gap-1">
                      <Reply size={12} /> Répondre
                    </Pressable>
                  )}

                  {/* Formulaire de réponse */}
                  {replyTo === q._id && (
                    <View className="flex gap-2">
                      <TextInput value={replyText} onChangeText={(value) => setReplyText(value)} placeholder="Votre réponse..." className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-blue-400 transition-colors placeholder:text-white/30" autoFocus editable={!(isReplying)} />
                      <Pressable onPress={() => handleReply(q._id)} disabled={!replyText.trim() || isReplying} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-500/20 transition-colors disabled:opacity-50">
                        {isReplying ? "..." : "Envoyer"}
                      </Pressable>
                    </View>
                  )}

                  {/* Supprimer (pour l'auteur ou le propriétaire) */}
                  {(isOwner || q.askerId === "current_user") && (
                    <Pressable onPress={() => handleDelete(q._id)} className="text-[10px] text-red-400/60 transition-colors">
                      Supprimer
                    </Pressable>
                  )}
                </View>
              )}</View>
          ))
        )}</View>{}{canAsk && (
        <View className="flex gap-2 pt-2 border-t border-white/5">
          <TextInput value={newQuestion} onChangeText={(value) => setNewQuestion(value)} placeholder="Poser une question au vendeur..." className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-orange-400 transition-colors placeholder:text-white/30" editable={!(isSubmitting)} />
          <Pressable onPress={handleSubmit} disabled={!newQuestion.trim() || isSubmitting} className="px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium text-white disabled:opacity-50 active:scale-95 transition-transform" style={{  }}>
            <Send size={14} /> Envoyer
          </Pressable>
        </View>
      )}</View>
  );
}
