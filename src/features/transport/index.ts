// src/features/transport/index.ts
export { default as TransportPage } from "./pages/TransportPage"; // ✅ Import résolu
export { default as TransportDetailPage } from "./pages/TransportDetailPage";
export { TransportForm } from "./forms/TransportForm";
export {
  transportRouteSchema,
  type TransportRouteFormValues,
} from "./validators/transport.validator"; // ✅ Export réaligné
export { registerTransportModule } from "./register";
export { manifest } from "./manifest";

// Export des hooks
export { useTransport, useTransportMutations } from "./hooks/useTransport";
export { useTracking } from "./hooks/useTracking";

// Export des composants unitaires
export { LiveTrackingMap } from "./components/LiveTrackingMap";
export { TransportDriver } from "./components/TransportDriver";
export { TransportRoute } from "./components/TransportRoute";
export { StickyBookingBar } from "./components/StickyBookingBar";

// Export des types
export * from "./types";
