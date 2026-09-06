// src/features/community/hooks/useCommunitySearch.ts
import { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptCommunityPost } from "../adapter";
import type { CommunityPost } from "../types";

export function useCommunitySearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<{
    type?: string;
    tags?: string[];
    dateRange?: { from: number; to: number }; // utilise des timestamps (nombre)
  }>({});

  const searchResults = useQuery(
    api.community.search,
    query ? { query, ...filters } : "skip",
  );

  const posts: CommunityPost[] =
    searchResults?.map((p: any) => adaptCommunityPost(p)) ?? [];

  const search = useCallback((newQuery: string) => {
    setQuery(newQuery);
  }, []);

  const applyFilters = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    query,
    filters,
    posts,
    isLoading: searchResults === undefined,
    isEmpty: searchResults?.length === 0,
    search,
    applyFilters,
    clearFilters,
  };
}
