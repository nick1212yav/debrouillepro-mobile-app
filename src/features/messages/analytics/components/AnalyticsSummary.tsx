import { View } from "react-native";
import type { MyAnalytics } from "../services/analytics.service";

import AnalyticsCard from "./AnalyticsCard";

interface AnalyticsSummaryProps {
  analytics: MyAnalytics;
  formatNumber: (value: number) => string;
  formatPercentage: (value: number) => string;
}

export function AnalyticsSummary({
  analytics,
  formatNumber,
  formatPercentage,
}: AnalyticsSummaryProps) {
  return (
    <View className="gap-3">
      <AnalyticsCard
        label="Vues"
        value={formatNumber(analytics.totalViews)}
        icon="👁"
      />

      <AnalyticsCard
        label="J'aime"
        value={formatNumber(analytics.totalLikes)}
        icon="♥"
      />

      <AnalyticsCard
        label="Commentaires"
        value={formatNumber(analytics.totalComments)}
        icon="💬"
      />

      <AnalyticsCard
        label="Abonnés"
        value={formatNumber(analytics.totalFollowers)}
        icon="👥"
      />

      <AnalyticsCard
        label="Publications"
        value={formatNumber(analytics.totalPublications)}
        icon="📝"
      />

      <AnalyticsCard
        label="Engagement"
        value={formatPercentage(analytics.engagementRate)}
        description="J'aime + commentaires / vues"
        icon="📈"
      />

      <AnalyticsCard
        label="Vues cette semaine"
        value={formatNumber(analytics.weekSummary.views)}
        description={analytics.weekSummary.label}
        icon="📊"
      />

      <AnalyticsCard
        label="J'aime cette semaine"
        value={formatNumber(analytics.weekSummary.likes)}
        description={analytics.weekSummary.label}
        icon="❤️"
      />
    </View>
  );
}

export default AnalyticsSummary;
