import { useCallback, useMemo, useState } from "react";

import { usePaginatedQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeFeed
 * ============================================================
 *
 * Feed Home connecté à Convex.
 *
 * Source :
 * api.feed.listPersonalizedFeed
 * ============================================================
 */

const INITIAL_NUM_ITEMS = 12;

const LOAD_MORE_NUM_ITEMS = 12;

export interface UseHomeFeedOptions {
  type?: string;
}

export function useHomeFeed(options: UseHomeFeedOptions = {}) {
  const { type } = options;

  const [refreshing, setRefreshing] = useState(false);

  const { results, status, loadMore } = usePaginatedQuery(
    api.feed.listPersonalizedFeed,
    type
      ? {
          type: type as never,
        }
      : {},
    {
      initialNumItems: INITIAL_NUM_ITEMS,
    },
  );

  const feed = useMemo(() => results ?? [], [results]);

  const loading = status === "LoadingFirstPage";

  const loadingMore = status === "LoadingMore";

  const canLoadMore = status === "CanLoadMore";

  const refreshFeed = useCallback(() => {
    /**
     * Convex usePaginatedQuery se
     * resynchronise automatiquement.
     *
     * On utilise ici un état UI court
     * pour donner le comportement Pull-to-refresh.
     */
    setRefreshing(true);

    requestAnimationFrame(() => {
      setRefreshing(false);
    });
  }, []);

  const loadMoreFeed = useCallback(() => {
    if (!canLoadMore) {
      return;
    }

    loadMore(LOAD_MORE_NUM_ITEMS);
  }, [canLoadMore, loadMore]);

  return {
    feed,

    items: feed,

    loading,

    refreshing,

    loadingMore,

    canLoadMore,

    status,

    refreshFeed,

    refresh: refreshFeed,

    loadMore: loadMoreFeed,

    loadMoreFeed,
  };
}

export default useHomeFeed;
