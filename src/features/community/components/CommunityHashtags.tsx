import { Pressable, View } from "react-native";
import { useState } from "react";
import { Hash, X, Search } from "lucide-react-native";

interface Props {
  tags: string[];
  onTagClick?: (tag: string) => void;
  maxDisplay?: number;
}

export function CommunityHashtags({
  tags,
  onTagClick,
  maxDisplay = 10,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) return null;

  const displayTags = expanded ? tags : tags.slice(0, maxDisplay);
  const hasMore = tags.length > maxDisplay;

  return (
    <View className="flex flex-wrap gap-1.5">
      {displayTags.map((tag) => (
        <Pressable key={tag} onPress={() => onTagClick?.(tag)} className="flex items-center gap-0.5 px-2.5 py-1 rounded-full text-xs font-medium text-purple-400/80 bg-purple-500/10 transition-colors">
          <Hash size={10} className="opacity-50" />
          {tag.replace(/^#/, "")}
        </Pressable>
      ))}
      {hasMore && !expanded && (
        <Pressable onPress={() => setExpanded(true)} className="px-2.5 py-1 rounded-full text-xs font-medium text-white/40 bg-white/5 transition-colors">
          +{tags.length - maxDisplay}
        </Pressable>
      )}
      {expanded && hasMore && (
        <Pressable onPress={() => setExpanded(false)} className="px-2.5 py-1 rounded-full text-xs font-medium text-white/30 bg-white/5 transition-colors">
          Voir moins
        </Pressable>
      )}
    </View>
  );
}
