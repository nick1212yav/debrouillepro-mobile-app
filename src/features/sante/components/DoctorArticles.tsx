import { View, Text, Image } from "react-native";

// src/features/sante/components/DoctorArticles.tsx
import { FileText, Calendar, User, Eye } from "lucide-react-native";
import { Clock } from "lucide-react-native";

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  date: Date;
  author: string;
  image?: string;
  readTime: number; // minutes
  views: number;
  url?: string;
}

interface DoctorArticlesProps {
  articles: Article[];
  onArticleClick?: (article: Article) => void;
}

export function DoctorArticles({
  articles,
  onArticleClick,
}: DoctorArticlesProps) {
  if (!articles || articles.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3"><FileText size={14} />Articles
        </Text><Text className="text-xs text-white/30 text-center py-4">Aucun article publié
        </Text></View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3"><FileText size={14} />Articles ({articles.length})
      </Text><View className="space-y-3 max-h-64 overflow-y-auto" style={{  }}>{articles.map((article) => (
          <View key={article.id} onPress={() => onArticleClick?.(article)} className="p-3 rounded-xl bg-white/5 border border-white/10 transition-colors"><View className="flex gap-3">{article.image && (
                <Image className="w-16 h-16 rounded-xl object-cover flex-shrink-0" source={{ uri: article.image }} accessibilityLabel={article.title} />
              )}<View className="flex-1 min-w-0"><Text className="text-white text-sm font-medium">{article.title}</Text><Text className="text-white/50 text-xs mt-0.5">{article.excerpt}</Text><View className="flex items-center gap-3 mt-1 text-[10px] text-white/30"><Text className="flex items-center gap-1"><Calendar size={10} />{" "}{article.date.toLocaleDateString("fr-FR")}</Text><Text className="flex items-center gap-1"><Eye size={10} />{article.views}</Text><Text className="flex items-center gap-1"><Clock size={10} />{article.readTime}min
                  </Text></View></View></View></View>
        ))}</View></View>
  );
}
