import { Pressable, View, Text, Image } from "react-native";

// src/features/network/components/Profile/ProfilePortfolio.tsx
import {
  FolderOpen,
  Plus,
  ExternalLink,
  Play,
  File,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface PortfolioItem {
  _id: string;
  title: string;
  description?: string;
  type: "image" | "video" | "document" | "link";
  url: string;
  thumbnail?: string;
}

interface ProfilePortfolioProps {
  items?: PortfolioItem[];
  editable?: boolean;
  onAdd?: () => void;
  onItemClick?: (item: PortfolioItem) => void;
  isLoading?: boolean;
  className?: string;
}

function PortfolioItemCard({
  item,
  editable,
  onClick,
}: {
  item: PortfolioItem;
  editable: boolean;
  onClick?: () => void;
}) {
  const getIcon = () => {
    switch (item.type) {
      case "image":
        return <ImageIcon size={18} className="text-white/40" />;
      case "video":
        return <Play size={18} className="text-white/40" />;
      case "document":
        return <File size={18} className="text-white/40" />;
      case "link":
        return <ExternalLink size={18} className="text-white/40" />;
    }
  };

  const getBgClass = () => {
    switch (item.type) {
      case "image":
        return "bg-blue-500/10";
      case "video":
        return "bg-red-500/10";
      case "document":
        return "bg-amber-500/10";
      case "link":
        return "bg-purple-500/10";
    }
  };

  return (
    <Pressable whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onPress={onClick} className={cn(
        "relative rounded-2xl overflow-hidden aspect-square cursor-pointer",
        "border border-white/10 hover:border-white/20 transition-all",
        "flex items-center justify-center",
      )}>
      {item.thumbnail ? (
        <Image className="w-full h-full object-cover" source={{ uri: item.thumbnail }} accessibilityLabel={item.title} />
      ) : (
        <View className={cn(
            "w-full h-full flex flex-col items-center justify-center gap-2",
            getBgClass(),
          )}>{getIcon()}<Text className="text-white/60 text-xs font-medium px-2 text-center">{item.title}</Text></View>
      )}

      <View className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity"><View className="absolute bottom-2 left-2 right-2"><Text className="text-white text-xs font-medium truncate">{item.title}</Text>{item.description && (
            <Text className="text-white/60 text-[10px] truncate">{item.description}</Text>
          )}</View></View>

      {item.type === "video" && (
        <View className="absolute inset-0 flex items-center justify-center"><View className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20"><Play size={20} className="text-white fill-white" /></View></View>
      )}
    </Pressable>
  );
}

export function ProfilePortfolio({
  items = [],
  editable = false,
  onAdd,
  onItemClick,
  isLoading = false,
  className,
}: ProfilePortfolioProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><View className="gap-2"><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" /><Skeleton className="aspect-square rounded-2xl" /></View></View>
    );
  }

  const hasItems = items.length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-400"><FolderOpen size={15} /></View><Text className="text-white font-bold text-sm">Portfolio</Text><Text className="text-white/30 text-xs">({items.length})</Text></View>{editable && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-indigo-400 transition-colors">
            <Plus size={12} />
            Ajouter
          </Pressable>
        )}</View>

      {hasItems ? (
        <View className="gap-2">
          {items.map((item) => (
            <PortfolioItemCard
              key={item._id}
              item={item}
              editable={editable}
              onPress={() => onItemClick?.(item)}
            />
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez vos projets et réalisations"
            : "Aucun projet dans le portfolio"}
        </Text>
      )}
    </View>
  );
}
