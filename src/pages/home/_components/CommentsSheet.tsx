import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/pages/home/_components/CommentsSheet.tsx
import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SignInButton } from "@/components/ui/signin";
import {
  MessageCircle,
  Send,
  Trash2,
  Reply,
  X,
  Heart,
  MoreHorizontal,
  Smile,
  Sparkles,
  CornerDownRight,
  ShieldCheck,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface CommentsSheetProps {
  open: boolean;
  onClose: () => void;
  publicationId: Id<"publications"> | null;
  publicationTitle?: string;
}

function Avatar({
  name,
  avatar,
  size = 32,
}: {
  name?: string;
  avatar?: string;
  size?: number;
}) {
  if (avatar) {
    return (
      <Image
       
       
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
       source={{ uri: avatar }} accessibilityLabel={name ?? "?"}/>
    );
  }
  const initials = name ? name.slice(0, 2).toUpperCase() : "?";
  return (
    <View
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initials}
    </View>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onDelete,
  onReply,
}: {
  comment: {
    _id: Id<"comments">;
    text: string;
    _creationTime: number;
    authorId: Id<"users">;
    author: { name?: string; avatar?: string } | null;
    parentId?: Id<"comments">;
  };
  currentUserId: Id<"users"> | null;
  onDelete: (id: Id<"comments">) => void;
  onReply: (name: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwn = currentUserId === comment.authorId;
  const timeAgo = formatDistanceToNow(new Date(comment._creationTime), {
    addSuffix: true,
    locale: fr,
  });

  return (
    <View
      className={cn(
        "group flex gap-3",
        comment.parentId && "ml-8 sm:ml-10 pl-3 border-l border-white/10",
      )}
    >
      <View className="relative flex-shrink-0">
        <Avatar
          name={comment.author?.name}
          avatar={comment.author?.avatar}
          size={36}
        />
        {comment.parentId && (
          <View className="absolute -left-4 top-4 text-white/15">
            <CornerDownRight size={12} />
          </View>
        )}
      </View>

      <View className="flex-1 min-w-0">
        <View
          className={cn(
            "relative rounded-2xl rounded-tl-md px-3.5 py-2.5 transition-all",
            "bg-white/[0.045] border border-white/[0.055]",
            "group-hover:bg-white/[0.065] group-hover:border-white/[0.08]",
          )}
        >
          <View className="flex items-center gap-2 mb-1">
            <Text className="text-white text-xs font-bold truncate">
              {comment.author?.name ?? "Utilisateur"}
            </Text>
            <Text className="text-white/25 text-[10px] flex-shrink-0">
              {timeAgo}
            </Text>

            <View className="ml-auto relative flex-shrink-0">
              <Pressable
               
                onPress={() => setMenuOpen((v) => !v)}
                className="opacity-0 p-1 rounded-lg text-white/25"
                accessibilityLabel="Options"
              >
                <MoreHorizontal size={14} />
              </Pressable>

              <>
                {menuOpen && (
                  <View
                    className="absolute right-0 top-7 z-10 min-w-[130px] rounded-xl overflow-hidden p-1"
                    style={{ backgroundColor: "rgba(20,20,35,.98)", borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
                  >
                    {isOwn && (
                      <Pressable
                       
                        onPress={() => {
                          setMenuOpen(false);
                          onDelete(comment._id);
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-red-300/70"
                      >
                        <Trash2 size={12} />
                        <Text>Supprimer</Text></Pressable>
                    )}
                    {!isOwn && (
                      <Pressable
                       
                        onPress={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-white/50"
                      >
                        <Text>Signaler</Text></Pressable>
                    )}
                  </View>
                )}
              </>
            </View>
          </View>

          <Text className="text-white/78 text-[13px] leading-[1.55]">
            {comment.text}
          </Text>
        </View>

        <View className="flex items-center gap-1 mt-1 pl-1">
          <Pressable
           
            onPress={() => setLiked((v) => !v)}
            className={cn(
              "h-7 px-2 rounded-lg flex items-center gap-1.5 text-[10px] transition-all",
              liked
                ? "text-rose-300 bg-rose-500/10"
                : "text-white/28 hover:text-white/55 hover:bg-white/5",
            )}
          >
            <Heart size={11} fill={liked ? "currentColor" : "none"} />
            {liked ? "Aimé" : "J'aime"}
          </Pressable>

          <Pressable
           
            onPress={() => onReply(comment.author?.name ?? "Utilisateur")}
            className="h-7 px-2 rounded-lg flex items-center gap-1.5 text-[10px] text-white/28"
          >
            <Reply size={11} />
            <Text>Répondre</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CommentsSheet({
  open,
  onClose,
  publicationId,
  publicationTitle,
}: CommentsSheetProps) {
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { isAuthenticated } = useFirebaseAuth();

  const comments = useQuery(
    api.comments.listComments,
    publicationId ? { publicationId, limit: 50 } : "skip",
  );

  const currentUser = useQuery(api.users.getCurrentUser, {});
  const addComment = useMutation(api.comments.createComment);
  const removeComment = useMutation(api.comments.remove);

  const handleSend = async () => {
    if (!text.trim() || !publicationId || sending) return;

    setSending(true);
    try {
      await addComment({ publicationId, text: text.trim() });
      setText("");
      setReplyTo(null);
    } catch {
      UIService.openToast("Impossible d'envoyer le commentaire", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (commentId: Id<"comments">) => {
    try {
      await removeComment({ commentId });
      UIService.openToast("Commentaire supprimé", "success");
    } catch {
      UIService.openToast("Impossible de supprimer", "error");
    }
  };

  const handleReply = (name: string) => {
    setReplyTo(name);
    setText(`@${name} `);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const commentCount = comments?.length ?? 0;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="bottom"
        className="rounded-t-[32px] sm:rounded-t-[38px] border-0 flex flex-col overflow-hidden"
        style={{ maxHeight: "min(88vh, 820px)", padding: 0 }}
      >
        {/* Premium top edge + ambient glow */}
        <View
          className="absolute top-0 left-0 right-0 h-px z-20"
          style={{  }}
        />
        <View
          className="absolute -top-28 left-1/2 -translate-x-1/2 h-52 w-[70%] rounded-full"
          style={{ backgroundColor: "rgba(99,102,241,.08)" }}
        />

        {/* Handle */}
        <View className="relative z-10 flex justify-center pt-3 pb-1">
          <View className="w-11 h-1.5 rounded-full bg-white/15" />
        </View>

        {/* Header */}
        <SheetHeader className="relative z-10 px-5 sm:px-6 pt-3 pb-4 border-b border-white/[0.07] flex-shrink-0">
          <View className="flex items-center justify-between gap-4">
            <View className="flex items-center gap-3 min-w-0">
              <View
                className="h-10 w-10 rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.22)", borderStyle: "solid" }}
              >
                <MessageCircle size={18} className="text-indigo-300" />
              </View>

              <View className="min-w-0 text-left">
                <SheetTitle className="text-white font-black text-[17px] flex items-center gap-2">
                  <Text>Discussion</Text>{comments && (
                    <Text
                      key={commentCount}
                      className="inline-flex items-center justify-center min-w-6 h-5 px-1.5 rounded-full bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold"
                    >
                      {commentCount}
                    </Text>
                  )}
                </SheetTitle>

                {publicationTitle && (
                  <Text className="text-white/30 text-[11px] text-left mt-0.5">
                    {publicationTitle}
                  </Text>
                )}
              </View>
            </View>

            <Pressable
             
              onPress={onClose}
              className="h-9 w-9 rounded-xl flex items-center justify-center text-white/40 border border-transparent flex-shrink-0"
              accessibilityLabel="Fermer"
            >
              <X size={17} />
            </Pressable>
          </View>

          <View className="mt-3 flex items-center gap-2 text-[10px] text-white/22">
            <ShieldCheck size={11} className="text-emerald-300/50" />
            <Text>Une conversation respectueuse et utile à tous.</Text>
          </View>
        </SheetHeader>

        {/* Comments list */}
        <View
          className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-5"
          style={{  }}
        >
          {!comments ? (
            <View className="space-y-5">
              {[0, 1, 2, 3].map((i) => (
                <View key={i} className="flex gap-3 animate-pulse">
                  <View className="w-9 h-9 rounded-full bg-white/8 flex-shrink-0" />
                  <View className="flex-1 space-y-2">
                    <View className="h-3 w-28 rounded bg-white/8" />
                    <View className="h-12 w-[82%] rounded-2xl bg-white/[0.045]" />
                  </View>
                </View>
              ))}
            </View>
          ) : commentCount === 0 ? (
            <View
              className="h-full min-h-[300px] flex flex-col items-center justify-center text-center"
            >
              <View
                className="relative mb-5 h-16 w-16 rounded-[22px] flex items-center justify-center"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
              >
                <MessageCircle size={27} className="text-white/22" />
                <Sparkles
                  size={12}
                  className="absolute right-2 top-2 text-indigo-300/50"
                />
              </View>

              <Text className="text-white/65 text-sm font-bold">
                La discussion commence ici
              </Text>
              <Text className="text-white/25 text-xs mt-1.5 max-w-[260px] leading-5">
                Partagez votre avis, posez une question ou apportez une
                information utile.
              </Text>

              {!isAuthenticated && (
                <View className="mt-5">
                  <SignInButton />
                </View>
              )}
            </View>
          ) : (
            <View className="max-w-3xl mx-auto">
              <View className="flex items-center gap-2 mb-5">
                <View className="h-px flex-1 bg-white/[0.06]" />
                <Text className="text-[9px] font-black uppercase tracking-[.16em] text-white/20">
                  {commentCount} contribution{commentCount > 1 ? "s" : ""}
                </Text>
                <View className="h-px flex-1 bg-white/[0.06]" />
              </View>

              <>
                {comments.map((comment) => (
                  <View key={comment._id} className="mb-4 last:mb-0">
                    <CommentItem
                      comment={comment}
                      currentUserId={currentUser?._id ?? null}
                      onDelete={handleDelete}
                      onReply={handleReply}
                    />
                  </View>
                ))}
              </>
            </View>
          )}
        </View>

        {/* Composer */}
        <View
          className="relative z-20 flex-shrink-0 px-4 sm:px-6 py-3.5 border-t border-white/[0.07]"
          style={{  }}
        >
          {isAuthenticated ? (
            <View className="max-w-3xl mx-auto">
              <>
                {replyTo && (
                  <View
                    className="flex items-center gap-2 mb-2.5 px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(99,102,241,.08)", borderWidth: 1, borderColor: "rgba(99,102,241,.15)", borderStyle: "solid" }}
                  >
                    <Reply size={11} className="text-indigo-300" />
                    <Text className="text-[11px] text-indigo-200/75 flex-1">
                      Réponse à <strong>{replyTo}</strong>
                    </Text>
                    <Pressable
                     
                      onPress={() => {
                        setReplyTo(null);
                        setText("");
                      }}
                      className="h-5 w-5 rounded-md flex items-center justify-center text-white/35"
                    >
                      <X size={11} />
                    </Pressable>
                  </View>
                )}
              </>

              <View className="flex items-end gap-2">
                <Avatar
                  name={currentUser?.name}
                  avatar={currentUser?.avatar}
                  size={36}
                />

                <View
                  className={cn(
                    "flex-1 relative rounded-[20px] transition-all",
                    "bg-white/[0.045] border border-white/[0.08]",
                    "focus-within:border-indigo-500/35 focus-within:bg-white/[0.06]",
                  )}
                >
                  <TextInput
                    ref={inputRef}
                    value={text}
                    onChangeText={(text) => setText(text)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        void handleSend();
                      }
                    }}
                    placeholder={
                      replyTo
                        ? `Répondre à ${replyTo}...`
                        : "Écrire un commentaire..."
                    }
                   
                    maxLength={1000}
                    className="w-full bg-transparent px-4 py-3 pr-11 text-[13px] text-white placeholder:text-white/22 outline-none leading-5"
                    style={{  }}
                   multiline textAlignVertical="top"/>

                  <Pressable
                   
                    className="absolute right-2 bottom-2 h-7 w-7 rounded-lg flex items-center justify-center text-white/20"
                    accessibilityLabel="Emoji"
                  >
                    <Smile size={14} />
                  </Pressable>
                </View>

                <Pressable
                  onPress={() => void handleSend()}
                  disabled={!text.trim() || sending}
                  className={cn(
                    "w-10 h-10 rounded-[15px] flex items-center justify-center flex-shrink-0 transition-all",
                    text.trim() && !sending
                      ? "text-white shadow-lg"
                      : "bg-white/7 text-white/20",
                  )}
                  style={
                    text.trim() && !sending
                      ? {  }
                      : undefined
                  }
                  accessibilityLabel="Envoyer"
                >
                  {sending ? (
                    <View className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                </Pressable>
              </View>

              <View className="flex items-center justify-between mt-1.5 pl-11">
                <Text className="text-[9px] text-white/16">
                  <Text>Entrée pour envoyer · Maj + Entrée pour une nouvelle ligne</Text></Text>
                <Text
                  className={cn(
                    "text-[9px]",
                    text.length > 900 ? "text-amber-300/60" : "text-white/16",
                  )}
                >
                  {text.length}<Text>/1000</Text></Text>
              </View>
            </View>
          ) : (
            <View
              className="flex items-center justify-center gap-3 py-1.5"
            >
              <View className="h-8 w-8 rounded-xl bg-white/5 flex items-center justify-center">
                <MessageCircle size={14} className="text-white/30" />
              </View>
              <Text className="text-white/35 text-xs">
                <Text>Connectez-vous pour participer à la discussion</Text></Text>
              <SignInButton />
            </View>
          )}
        </View>
      </SheetContent>
    </Sheet>
  );
}
