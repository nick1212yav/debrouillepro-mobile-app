module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // ✅ Retire UNIQUEMENT les props framer-motion
      // (initial, animate, exit, transition, whileHover, whileTap, layoutId...)
      // Ces props font planter Reanimated sur Fabric natif.
      "./babel-plugin-strip-motion-props.js",

      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            // ── Alias internes ──────────────────────────────────────────
            "@/convex": "./convex",
            "@": "./src",

            // ── Shims web → RN ──────────────────────────────────────────
            "react-router-dom$": "./src/shims/react-router-dom",
            "@react-native-clipboard/clipboard$":
              "./src/shims/react-native-clipboard",
            "motion/react$": "./src/shims/motion-react",
            motion$: "./src/shims/motion-react",
            "framer-motion$": "./src/shims/motion-react",
            "class-variance-authority$": "./src/shims/class-variance-authority",

            // ── Shims cartes ────────────────────────────────────────────
            "react-leaflet$": "./src/shims/react-leaflet",
            leaflet$: "./src/shims/leaflet",
            "leaflet/dist/leaflet.css$": "./src/shims/leaflet",

            // ── Shims graphiques ────────────────────────────────────────
            recharts$: "./src/shims/recharts",

            // ── Shims UI web-only ───────────────────────────────────────
            cmdk$: "./src/shims/cmdk",
            "react-resizable-panels$": "./src/shims/react-resizable-panels",

            // ── Shims @radix-ui/* ───────────────────────────────────────
            "@radix-ui/react-accordion$": "./src/shims/radix",
            "@radix-ui/react-alert-dialog$": "./src/shims/radix",
            "@radix-ui/react-aspect-ratio$": "./src/shims/radix",
            "@radix-ui/react-avatar$": "./src/shims/radix",
            "@radix-ui/react-checkbox$": "./src/shims/radix",
            "@radix-ui/react-collapsible$": "./src/shims/radix",
            "@radix-ui/react-context-menu$": "./src/shims/radix",
            "@radix-ui/react-dialog$": "./src/shims/radix",
            "@radix-ui/react-dropdown-menu$": "./src/shims/radix",
            "@radix-ui/react-hover-card$": "./src/shims/radix",
            "@radix-ui/react-label$": "./src/shims/radix",
            "@radix-ui/react-menubar$": "./src/shims/radix",
            "@radix-ui/react-navigation-menu$": "./src/shims/radix",
            "@radix-ui/react-popover$": "./src/shims/radix",
            "@radix-ui/react-progress$": "./src/shims/radix",
            "@radix-ui/react-radio-group$": "./src/shims/radix",
            "@radix-ui/react-scroll-area$": "./src/shims/radix",
            "@radix-ui/react-select$": "./src/shims/radix",
            "@radix-ui/react-separator$": "./src/shims/radix",
            "@radix-ui/react-slider$": "./src/shims/radix",
            "@radix-ui/react-slot$": "./src/shims/radix",
            "@radix-ui/react-switch$": "./src/shims/radix",
            "@radix-ui/react-tabs$": "./src/shims/radix",
            "@radix-ui/react-toggle$": "./src/shims/radix",
            "@radix-ui/react-toggle-group$": "./src/shims/radix",
          },
          extensions: [
            ".ios.js",
            ".android.js",
            ".js",
            ".jsx",
            ".ts",
            ".tsx",
            ".json",
          ],
        },
      ],

      // ⚠️ DOIT RESTER EN DERNIER — recommandation Reanimated
      "react-native-reanimated/plugin",
    ],
  };
};
