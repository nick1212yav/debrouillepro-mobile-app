/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],

  presets: [require("nativewind/preset")],

  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        "background-elevated": "var(--color-background-elevated)",

        surface: "var(--color-surface)",
        "surface-muted": "var(--color-surface-muted)",
        "surface-strong": "var(--color-surface-strong)",

        border: "var(--color-border)",
        "border-strong": "var(--color-border-strong)",
        "border-soft": "var(--color-border-soft)",

        foreground: "var(--color-foreground)",
        "foreground-secondary": "var(--color-foreground-secondary)",
        muted: "var(--color-foreground-muted)",
        faint: "var(--color-foreground-faint)",

        primary: "var(--color-primary)",
        "primary-foreground": "var(--color-primary-foreground)",
        "primary-soft": "var(--color-primary-soft)",

        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",

        input: "var(--color-input)",
        "input-border": "var(--color-input-border)",

        overlay: "var(--color-overlay)",
      },
    },
  },

  plugins: [],
};