import { View, TextInput } from "react-native";

// src/features/community/components/CreatePost/CreatePostSheet.tsx
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { useCreatePost } from "../../hooks/useCreatePost";
import { PostHeader } from "./PostHeader";
import { PostTypeSelector } from "./PostTypeSelector";
import { PostEditor } from "./PostEditor";
import { PostAttachments } from "./PostAttachments";
import { PostLocation } from "./PostLocation";
import { PostSchedule } from "./PostSchedule";
import { PostAudience } from "./PostAudience";
import { PostTags } from "./PostTags";
import { PostPoll } from "./PostPoll";
import { PostEmojiPicker } from "./PostEmojiPicker";
import { PostGiphyPicker } from "./PostGiphyPicker";
import { PostMentions } from "./PostMentions";
import { PostHashtags } from "./PostHashtags";
import { PostMoodSelector } from "./PostMoodSelector";
import { PostSubmit } from "./PostSubmit";
import type {
  LocalPostType,
  PostMeta,
  Mood,
  PostAttachment,
} from "../../types";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreatePostSheet({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useFirebaseAuth();
  const { publish, saveDraft, deleteDraft, uploadAttachment, isUploading } =
    useCreatePost();

  const draft = useQuery(api.community.getDraft, {});

  const [postType, setPostType] = useState<LocalPostType>("text");
  const [postEmoji, setPostEmoji] = useState("💬");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postTags, setPostTags] = useState<string[]>([]);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [attachments, setAttachments] = useState<PostAttachment[]>([]);
  const [location, setLocation] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [audience, setAudience] = useState<"public" | "friends" | "private">(
    "public",
  );
  const [mood, setMood] = useState<Mood | undefined>(undefined);
  const [mentions, setMentions] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGiphy, setShowGiphy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (isOpen && user && draft && typeof draft === "object" && draft._id) {
      try {
        setDraftId(draft._id);
        setPostTitle(draft.title || "");
        setPostContent(draft.description || "");
        setPostTags(Array.isArray(draft.tags) ? draft.tags : []);
        setLocation(draft.location || "");
        setScheduleDate(draft.scheduleDate || "");
        setAudience(draft.audience || "public");
        setMood((draft.mood as Mood) || undefined);
      } catch (error) {
        console.warn("Erreur chargement brouillon:", error);
      }
    }
  }, [isOpen, user, draft]);

  const autoSave = async () => {
    if (!user) return;
    try {
      await saveDraft({
        title: postTitle,
        description: postContent,
        tags: postTags,
        meta: JSON.stringify({ postType, emoji: postEmoji, pollOptions }),
        location,
        scheduleDate,
        audience,
        mood,
      });
    } catch (error) {
      console.error("Erreur auto-save:", error);
    }
  };

  useEffect(() => {
    if (!isOpen || !user) return;
    const interval = setInterval(autoSave, 3000);
    return () => clearInterval(interval);
  }, [
    postTitle,
    postContent,
    postTags,
    location,
    scheduleDate,
    audience,
    mood,
    isOpen,
    user,
  ]);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Connectez-vous pour publier");
      return;
    }
    if (postType !== "poll" && !postContent.trim()) {
      toast.error("Veuillez écrire un contenu");
      return;
    }
    if (postType === "poll") {
      const validOptions = pollOptions.filter((o) => o.trim());
      if (validOptions.length < 2) {
        toast.error("Ajoutez au moins 2 options");
        return;
      }
      if (!postTitle.trim()) {
        toast.error("Donnez un titre au sondage");
        return;
      }
    }

    // Construction du meta (infos textuelles)
    const meta: PostMeta = {
      postType: postType as any,
      emoji: postEmoji,
      location: location || undefined,
      scheduleDate: scheduleDate || undefined,
      audience,
      mood,
      mentions: Array.isArray(mentions) ? mentions : [],
      pollOptions:
        postType === "poll"
          ? pollOptions
              .filter((o) => o.trim())
              .map((text, idx) => ({
                id: `opt-${idx}`,
                text,
                votes: 0,
              }))
          : undefined,
    };

    // Récupération des storageId depuis les attachments
    const imageStorageIds = (attachments || [])
      .filter((a) => (a.type === "image" || a.type === "gif") && a.storageId)
      .map((a) => a.storageId) as Id<"_storage">[];

    const videoStorageIds = (attachments || [])
      .filter((a) => a.type === "video" && a.storageId)
      .map((a) => a.storageId) as Id<"_storage">[];

    const audioStorageIds = (attachments || [])
      .filter((a) => a.type === "audio" && a.storageId)
      .map((a) => a.storageId) as Id<"_storage">[];

    setIsSubmitting(true);
    try {
      await publish({
        title: postTitle || (postType === "poll" ? "Sondage" : ""),
        description: postContent,
        tags: Array.isArray(postTags) ? postTags : [],
        meta: JSON.stringify(meta),
        images: imageStorageIds,
        videos: videoStorageIds,
        audio: audioStorageIds,
        location: location || undefined,
        scheduleDate: scheduleDate || undefined,
        audience,
        mood,
      });
      toast.success("Post publié !");
      if (draftId) await deleteDraft();
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erreur publication:", error);
      toast.error("Erreur lors de la publication");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPostType("text");
    setPostEmoji("💬");
    setPostTitle("");
    setPostContent("");
    setPostTags([]);
    setPollOptions(["", ""]);
    setAttachments([]);
    setLocation("");
    setScheduleDate("");
    setAudience("public");
    setMood(undefined);
    setMentions([]);
    setShowEmojiPicker(false);
    setShowGiphy(false);
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden flex flex-col" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          <PostHeader onClose={onClose} />

          <View className="flex-1 overflow-y-auto px-5 pt-4 pb-32 flex flex-col gap-3" style={{  }}><PostAudience audience={audience} onChange={setAudience} /><PostTypeSelector value={postType} onChange={setPostType} /><View className="flex items-start gap-3"><PostEmojiPicker emoji={postEmoji} onChange={setPostEmoji} show={showEmojiPicker} onToggle={() => setShowEmojiPicker(!showEmojiPicker)} /><TextInput value={postTitle} onChangeText={(value) => setPostTitle(value)} placeholder={postType === "question"
                    ? "Votre question..."
                    : postType === "poll"
                      ? "Titre du sondage..."
                      : "Titre (optionnel)"} className="flex-1 bg-transparent text-white placeholder:text-white/25 font-bold text-base outline-none pt-2" /></View><PostEditor value={postContent} onChange={setPostContent} placeholder="Partagez quelque chose avec la communauté..." onMention={(user) => setMentions((prev) => [...prev, user])} onHashtag={(tag) => setPostTags((prev) => [...prev, tag])} />{postType === "poll" && (
              <PostPoll
                options={pollOptions}
                onChange={setPollOptions}
                color="#8B5CF6"
              />
            )}<PostAttachments attachments={attachments} onChange={setAttachments} onUpload={uploadAttachment} isUploading={isUploading} onGiphyToggle={() => setShowGiphy(!showGiphy)} />{showGiphy && (
              <PostGiphyPicker
                onSelect={(gif) =>
                  setAttachments((prev) => [
                    ...prev,
                    {
                      type: "gif",
                      previewUrl: gif,
                      storageId: undefined,
                      name: "GIF",
                    },
                  ])
                }
              />
            )}<PostLocation location={location} onChange={setLocation} /><PostSchedule value={scheduleDate} onChange={setScheduleDate} /><PostMoodSelector value={mood} onChange={setMood} /><PostTags tags={postTags} onChange={setPostTags} /><PostHashtags content={postContent} onSelect={(tags) => setPostTags((prev) => [...prev, ...tags])} /><PostMentions content={postContent} onSelect={(user) => setMentions((prev) => [...prev, user])} /></View>

          <View className="sticky bottom-0 z-20 bg-[#11111f] border-t border-white/10 p-4">
            <PostSubmit
              onPress={handleSubmit}
              disabled={
                isSubmitting ||
                (postType !== "poll"
                  ? !postContent.trim()
                  : pollOptions.filter((o) => o.trim()).length < 2)
              }
              loading={isSubmitting}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
