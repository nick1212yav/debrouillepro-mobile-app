import { View, Pressable, Text } from "react-native";

// src/features/network/components/Network/ConnectionRequests.tsx
import React, { useState } from "react";
import { Check, X, User, Clock, Loader2 } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { NetworkAvatar } from "../common/NetworkAvatar";

export interface ConnectionRequest {
  _id: Id<"networkConnectionRequests">; // ✅ Correction : Table de schéma réelle [1]
  senderId: Id<"users">;
  receiverId: Id<"users">;
  message?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  sender?: { name: string; avatar?: string | null } | null;
}

interface ConnectionRequestsProps {
  requests?: ConnectionRequest[];
  isLoading: boolean;
  onAccept?: (requestId: Id<"networkConnectionRequests">) => void; // ✅ Correction
  onDecline?: (requestId: Id<"networkConnectionRequests">) => void; // ✅ Correction
}

export function ConnectionRequests({
  requests = [],
  isLoading,
  onAccept,
  onDecline,
}: ConnectionRequestsProps) {
  const [processingId, setProcessingId] =
    useState<Id<"networkConnectionRequests"> | null>(null); // ✅ Correction

  const handleAccept = async (requestId: Id<"networkConnectionRequests">) => {
    // ✅ Correction
    if (processingId) return;
    setProcessingId(requestId);
    try {
      await onAccept?.(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requestId: Id<"networkConnectionRequests">) => {
    // ✅ Correction
    if (processingId) return;
    setProcessingId(requestId);
    try {
      await onDecline?.(requestId);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <View className="flex justify-center py-8">
        <Loader2 size={24} className="text-indigo-500 animate-spin" />
      </View>
    );
  }

  if (requests.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-12 text-center">
        <User size={36} className="text-white/10 mb-3" />
        <Text className="text-white/40 text-xs">
          Aucune demande de connexion en attente
        </Text>
      </View>
    );
  }

  return (
    <View className="flex flex-col gap-3">
      <>
        {requests.map((req) => (
          <View
            key={req._id}
            className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-3"
          >
            <View className="flex items-start justify-between gap-3">
              <View className="flex items-center gap-3 min-w-0">
                <NetworkAvatar
                  name={req.sender?.name}
                  avatar={req.sender?.avatar}
                  size={40}
                />
                <View className="min-w-0">
                  <Text className="text-white font-bold text-xs truncate leading-none">
                    {req.sender?.name || "Professionnel"}
                  </Text>
                  <View className="flex items-center gap-1.5 text-white/40 text-[9px] mt-1.5">
                    <Clock size={10} />
                    <Text>
                      Reçu le{" "}
                      {new Date(req.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Boutons d'actions rapides */}
              <View className="flex items-center gap-1.5">
                <Pressable
                  onPress={() => handleAccept(req._id)}
                  disabled={processingId !== null}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/15 disabled:opacity-40"
                >
                  {processingId === req._id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                </Pressable>
                <Pressable
                  onPress={() => handleDecline(req._id)}
                  disabled={processingId !== null}
                  className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400 border border-red-500/15 disabled:opacity-40"
                >
                  {processingId === req._id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                </Pressable>
              </View>
            </View>

            {req.message && (
              <Text className="px-3.5 py-2.5 rounded-2xl bg-white/[0.01] border border-white/5 text-[10px] text-white/60 leading-relaxed italic">
                <Text>"</Text>{req.message}<Text>"</Text></Text>
            )}
          </View>
        ))}
      </>
    </View>
  );
}
