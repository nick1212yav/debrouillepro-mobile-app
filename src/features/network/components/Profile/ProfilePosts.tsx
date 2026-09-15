import { View, Pressable, Text } from "react-native";

// src/features/network/components/Profile/ProfilePosts.tsx
import {
  FileText,
  Image as ImageIcon,
  Video,
  Link2,
  Calendar,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Post {
  _id: string;
  type: "text" | "image" | "video" | "link";
  content: string;
  media?: string[];
  link?: string;
  createdAt: string;
  likes: number;
  comments: number;
}

interface ProfilePostsProps {
  posts?: Post[];
  editable?: boolean;
  onPostClick?: (postId: string) => void;
  isLoading?: boolean;
  className?: string;
  maxDisplay?: number;
}

function PostItem({ post, onClick }: { post: Post; onClick?: () => void }) {
  const date = new Date(post.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });

  const getIcon = () => {
    switch (post.type) {
      case "image":
        return <ImageIcon size={14} className="text-blue-400" />;
      case "video":
        return <Video size={14} className="text-red-400" />;
      case "link":
        return <Link2 size={14} className="text-purple-400" />;
      default:
        return <FileText size={14} className="text-white/40" />;
    }
  };

  return (
    <Pressable onPress={onClick} className="w-full p-3 rounded-xl text-left bg-white/5 border border-white/5 transition-colors"><View className="flex items-start gap-2"><View className="mt-0.5 flex-shrink-0">{getIcon()}</View><View className="flex-1 min-w-0"><Text className="text-white/80 text-sm">{post.content}</Text><View className="flex items-center gap-3 mt-1.5 text-xs text-white/30"><Text className="flex items-center gap-1"><Calendar size={10} />{date}</Text><Text>{post.likes}❤️</Text><Text>{post.comments}💬</Text></View></View></View></Pressable>
  );
}

export function ProfilePosts({
  posts = [],
  editable = false,
  onPostClick,
  isLoading = false,
  className,
  maxDisplay = 3,
}: ProfilePostsProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></View>
    );
  }

  const hasPosts = posts.length > 0;
  const displayItems = posts.slice(0, maxDisplay);
  const hasMore = posts.length > maxDisplay;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center gap-2 mb-4"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/10 text-white/40"><FileText size={15} /></View><Text className="text-white font-bold text-sm">Publications</Text><Text className="text-white/30 text-xs">({posts.length})</Text></View>

      {hasPosts ? (
        <View className="space-y-2">
          {displayItems.map((post) => (
            <PostItem
              key={post._id}
              post={post}
              onPress={() => onPostClick?.(post._id)}
            />
          ))}
          {hasMore && (
            <Pressable className="text-xs text-white/40 transition-colors">
              Voir les {posts.length} publications
            </Pressable>
          )}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable ? "Partagez vos actualités" : "Aucune publication"}
        </Text>
      )}
    </View>
  );
}
