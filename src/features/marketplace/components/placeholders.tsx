import { Text, View } from "react-native";

// src/features/marketplace/components/placeholders.tsx
import React from "react";

export const CountdownOffer = (props: any) => (
  <View className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 text-center">
    <Text className="text-orange-400 text-sm font-bold">⏳ Offre limitée</Text>
  </View>
);

export const Cashback = (props: any) => (
  <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
    <Text className="text-green-400 text-sm font-bold">
      💵 Cashback {props.percentage || 0}%
    </Text>
  </View>
);

export const DeliveryEstimator = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">🚚 Estimation de livraison</Text>
  </View>
);

export const DeliveryTimeline = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">📋 Suivi de livraison</Text>
  </View>
);

export const DeliveryTrackingMap = (props: any) => (
  <View className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
    <Text className="text-white/60 text-sm">🗺️ Traçage en temps réel</Text>
  </View>
);

export const DeliveryInsurance = (props: any) => (
  <View className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
    <Text className="text-blue-400 text-sm font-bold">🛡️ Assurance livraison</Text>
  </View>
);

export const ProductLiveChat = (props: any) => (
  <View className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 text-center">
    <Text className="text-purple-400 text-sm font-bold">💬 Chat en direct</Text>
  </View>
);

export const AIShoppingAssistant = (props: any) => (
  <View className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 text-center">
    <Text className="text-indigo-400 text-sm font-bold">🤖 Assistant IA</Text>
  </View>
);

export const AIPriceAdvisor = (props: any) => (
  <View className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 text-center">
    <Text className="text-pink-400 text-sm font-bold">📊 Conseiller prix IA</Text>
  </View>
);

export const AISimilarProducts = (props: any) => (
  <View className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 text-center">
    <Text className="text-teal-400 text-sm font-bold">🔍 Produits similaires IA</Text>
  </View>
);
