import { useState, useEffect, useCallback } from "react";

export type Level = "Bronze" | "Argent" | "Or" | "Diamant";

export interface PointEvent {
  id: string;
  action: string;
  module: string;
  emoji: string;
  points: number;
  timestamp: string; // ISO
}

interface PointsState {
  total: number;
  history: PointEvent[];
  claimedRewards: string[];
}

const STORAGE_KEY = "debrouille_points_v1";

const LEVEL_THRESHOLDS: Record<Level, number> = {
  Bronze: 0,
  Argent: 500,
  Or: 1500,
  Diamant: 4000,
};

export const LEVEL_ORDER: Level[] = ["Bronze", "Argent", "Or", "Diamant"];

export function getLevel(points: number): Level {
  let level: Level = "Bronze";
  for (const l of LEVEL_ORDER) {
    if (points >= LEVEL_THRESHOLDS[l]) level = l;
  }
  return level;
}

export function getLevelProgress(points: number): { level: Level; nextLevel: Level | null; progress: number; pointsToNext: number } {
  const level = getLevel(points);
  const idx = LEVEL_ORDER.indexOf(level);
  const nextLevel: Level | null = LEVEL_ORDER[idx + 1] ?? null;
  if (!nextLevel) return { level, nextLevel: null, progress: 100, pointsToNext: 0 };
  const current = LEVEL_THRESHOLDS[level];
  const next = LEVEL_THRESHOLDS[nextLevel];
  const progress = Math.round(((points - current) / (next - current)) * 100);
  return { level, nextLevel, progress, pointsToNext: next - points };
}

const DEFAULT_EVENTS: PointEvent[] = [
  { id: "e1", action: "Compte créé", module: "Profil", emoji: "🎉", points: 100, timestamp: new Date(Date.now() - 7 * 86400000).toISOString() },
  { id: "e2", action: "Premier paiement", module: "Paiement", emoji: "💳", points: 50, timestamp: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "e3", action: "Immobilier consulté", module: "Immobilier", emoji: "🏠", points: 10, timestamp: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: "e4", action: "Offre d'emploi postulée", module: "Jobs", emoji: "💼", points: 25, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "e5", action: "Parrainage actif", module: "Parrainage", emoji: "🤝", points: 150, timestamp: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "e6", action: "Transport réservé", module: "Transport", emoji: "🚗", points: 20, timestamp: new Date(Date.now() - 43200000).toISOString() },
];

const DEFAULT_STATE: PointsState = {
  total: 355,
  history: DEFAULT_EVENTS,
  claimedRewards: [],
};

function load(): PointsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PointsState;
  } catch {
    // ignore
  }
  return DEFAULT_STATE;
}

function save(state: PointsState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function usePoints() {
  const [state, setState] = useState<PointsState>(load);

  useEffect(() => {
    save(state);
  }, [state]);

  const addPoints = useCallback((event: Omit<PointEvent, "id" | "timestamp">) => {
    setState(prev => {
      const newEvent: PointEvent = {
        ...event,
        id: `e_${Date.now()}`,
        timestamp: new Date().toISOString(),
      };
      return {
        ...prev,
        total: prev.total + event.points,
        history: [newEvent, ...prev.history],
      };
    });
  }, []);

  const claimReward = useCallback((rewardId: string, cost: number): boolean => {
    let success = false;
    setState(prev => {
      if (prev.total < cost || prev.claimedRewards.includes(rewardId)) return prev;
      success = true;
      return {
        ...prev,
        total: prev.total - cost,
        claimedRewards: [...prev.claimedRewards, rewardId],
      };
    });
    return success;
  }, []);

  return { total: state.total, history: state.history, claimedRewards: state.claimedRewards, addPoints, claimReward };
}
