// src/features/community/hooks/useCommunityLive.ts
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";

export function useCommunityLive() {
  const [isLive, setIsLive] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);

  const startLiveMutation = useMutation(api.community.startLive);
  const endLiveMutation = useMutation(api.community.endLive);
  const getLiveStatus = useQuery(api.community.getLiveStatus, {});

  useEffect(() => {
    if (getLiveStatus) {
      setIsLive(getLiveStatus.isLive);
      setStreamUrl(getLiveStatus.streamUrl || null);
    }
  }, [getLiveStatus]);

  const startLive = async (title: string, description?: string) => {
    try {
      const result = await startLiveMutation({ title, description });
      setIsLive(true);
      setStreamUrl(result.streamUrl);
      toast.success("Live démarré !");
      return result;
    } catch (error) {
      toast.error("Erreur lors du démarrage du live");
      throw error;
    }
  };

  const endLive = async () => {
    try {
      await endLiveMutation({});
      setIsLive(false);
      setStreamUrl(null);
      toast.success("Live terminé");
    } catch (error) {
      toast.error("Erreur lors de l'arrêt du live");
      throw error;
    }
  };

  return {
    isLive,
    streamUrl,
    startLive,
    endLive,
    isLoading: getLiveStatus === undefined,
  };
}
