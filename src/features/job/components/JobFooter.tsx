import { Pressable, GestureResponderEvent } from "react-native";
import { JobMeta } from "./JobMeta";
import { JobActions } from "./JobActions";

interface Props {
  city: string;
  remote: boolean;
  contractLabel: string;
  contractColor: string;
  deadline: string | null;
  status: string;
  likeCount: number;
  commentCount: number;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onBookmark: () => void;
  onApply: (e: GestureResponderEvent) => void;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function JobFooter({
  city,
  remote,
  contractLabel,
  contractColor,
  deadline,
  status,
  likeCount,
  commentCount,
  onLike,
  onComment,
  onShare,
  onBookmark,
  onApply,
  isLiked,
  isBookmarked,
}: Props) {
  return (
    <>
      <JobMeta
        city={city}
        remote={remote}
        contractLabel={contractLabel}
        contractColor={contractColor}
        deadline={deadline}
        status={status}
      />

      <JobActions
        likeCount={likeCount}
        commentCount={commentCount}
        onLike={onLike}
        onComment={onComment}
        onShare={onShare}
        onBookmark={onBookmark}
        isLiked={isLiked}
        isBookmarked={isBookmarked}
      />

      <Pressable onPress={onApply} className="w-full mt-2 py-2.5 rounded-2xl text-xs font-bold text-white active:scale-95 transition-transform" style={{  }}>
        Postuler
      </Pressable>
    </>
  );
}
