import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import TransportDetailPage from "@/features/transport/pages/TransportDetailPage";

/**
 * Écran Expo Router `/transport/[id]`.
 *
 * Pas de Stack imbriqué : un Stack sous `app/transport` reproduit le bug
 * Android déjà vu sur Services (conteneur natif d'environ 1 px, écran noir).
 * Le fond opaque et `flex: 1` évitent que la fenêtre `#050812` reste visible
 * quand le contenu n'a pas encore de hauteur.
 */
export default function TransportTripScreen() {
  return (
    <View style={styles.screen}>
      <TransportScreenBoundary>
        <TransportDetailPage />
      </TransportScreenBoundary>
    </View>
  );
}

class TransportScreenBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[transport] rendu du trajet interrompu", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return <TransportCrashFallback />;
    }
    return this.props.children;
  }
}

function TransportCrashFallback() {
  const router = useRouter();

  return (
    <View style={styles.fallback}>
      <Pressable
        onPress={() => router.back()}
        style={styles.back}
        accessibilityRole="button"
      >
        <ArrowLeft size={18} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.fallbackTitle}>Affichage du trajet impossible</Text>
      <Text style={styles.fallbackBody}>
        Revenez à la liste et ouvrez le trajet à nouveau.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#020412",
  },
  fallback: {
    flex: 1,
    backgroundColor: "#020412",
    paddingHorizontal: 24,
    paddingTop: 56,
    gap: 12,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  fallbackTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  fallbackBody: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 20,
  },
});
