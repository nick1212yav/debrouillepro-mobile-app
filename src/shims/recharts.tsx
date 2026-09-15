// src/shims/recharts.tsx
/**
 * Shim `recharts` pour React Native.
 *
 * Recharts est web-only (SVG, DOM). Ce shim expose tous les composants
 * utilisés par shadcn/ui et Dashboards mais les rend comme no-op.
 *
 * ⚠️ Les graphiques ne s'afficheront PAS. Le reste de la page fonctionne.
 *    Pour de vrais graphiques RN, utiliser `victory-native` ou `react-native-svg-charts`.
 */
import * as React from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";

// ── Container ────────────────────────────────────────────────────────────
interface ResponsiveContainerProps extends ViewProps {
  width?: number | string;
  height?: number | string;
  children?: React.ReactNode;
}

export const ResponsiveContainer = ({
  width = "100%",
  height = 200,
  children,
  style,
}: ResponsiveContainerProps) => {
  const heightNum = typeof height === "number" ? height : 200;
  return (
    <View
      style={[styles.container, { height: heightNum }, style]}
      accessibilityLabel="Graphique (non disponible en mobile)"
    >
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>📊</Text>
        <Text style={styles.placeholderSubtext}>
          Graphique disponible sur web uniquement
        </Text>
      </View>
      {children}
    </View>
  );
};

// ── Charts : tous no-op ──────────────────────────────────────────────────
const noop = (_props: any) => null;

export const AreaChart = noop;
export const BarChart = noop;
export const RadialBarChart = noop;
export const LineChart = noop;
export const PieChart = noop;
export const ComposedChart = noop;
export const ScatterChart = noop;
export const RadarChart = noop;
export const Treemap = noop;
export const Sankey = noop;
export const SunburstChart = noop;
export const FunnelChart = noop;

// ── Data components ──────────────────────────────────────────────────────
export const Area = noop;
export const Bar = noop;
export const Line = noop;
export const Pie = noop;
export const RadialBar = noop;
export const Scatter = noop;
export const Radar = noop;
export const RadialBarChart2 = noop;
export const Cell = noop;
export const Curve = noop;
export const ErrorBar = noop;
export const ReferenceLine = noop;
export const ReferenceArea = noop;
export const ReferenceDot = noop;

// ── Axes ─────────────────────────────────────────────────────────────────
export const XAxis = noop;
export const YAxis = noop;
export const ZAxis = noop;
export const PolarAngleAxis = noop;
export const PolarGrid = noop;
export const PolarRadiusAxis = noop;

// ── UI ───────────────────────────────────────────────────────────────────
export const Tooltip = noop;
export const Legend = noop;
export const CartesianGrid = noop;
export const PolarGrid2 = noop;
export const Brush = noop;
export const Label = noop;
export const LabelList = noop;

// ── Helpers ──────────────────────────────────────────────────────────────
export const ResponsiveContainerWrapper = ResponsiveContainer;
export const Surface = noop;
export const Layer = noop;
export const Text2 = noop;
export const Customized = noop;

// ── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  placeholderText: {
    fontSize: 28,
  },
  placeholderSubtext: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 10,
    textAlign: "center",
    paddingHorizontal: 16,
  },
});

export default {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  RadialBarChart,
  LineChart,
  PieChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Area,
  Bar,
  Line,
  Pie,
  RadialBar,
};
