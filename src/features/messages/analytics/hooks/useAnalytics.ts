import { useMutation, useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import analyticsService, {
  type AnalyticsMetric,
  type AnalyticsPeriod,
} from "../services/analytics.service";

import { useCallback, useMemo, useState } from "react";

export function useAnalytics() {
  const analyticsQuery = useQuery(api.analytics.getMyAnalytics, {});

  const recordProfileViewMutation = useMutation(
    api.analytics.recordProfileView,
  );

  const [period, setPeriod] = useState<AnalyticsPeriod>("30d");

  const [metric, setMetric] = useState<AnalyticsMetric>("views");

  const isLoading = analyticsQuery === undefined;

  const analytics = useMemo(() => {
    if (!analyticsQuery) {
      return null;
    }

    return analyticsQuery;
  }, [analyticsQuery]);

  const chartData = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return analyticsService.getMetricData(analytics, metric, period);
  }, [analytics, metric, period]);

  const recordProfileView = useCallback(
    async (profileId: Id<"users">) => {
      return recordProfileViewMutation({
        profileId,
      });
    },
    [recordProfileViewMutation],
  );

  const refresh = useCallback(() => {
    // Convex réactualise automatiquement
    // la query lorsqu'une donnée dépendante
    // change.
  }, []);

  return {
    analytics,

    isLoading,

    period,
    setPeriod,

    metric,
    setMetric,

    chartData,

    recordProfileView,

    refresh,

    formatNumber: analyticsService.formatNumber,

    formatPercentage: analyticsService.formatPercentage,
  };
}

export default useAnalytics;
