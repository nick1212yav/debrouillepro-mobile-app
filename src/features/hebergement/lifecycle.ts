export const lifecycle = {
  onLoad: () => {
    console.log("[HebergementModule] Module loaded successfully.");
  },
  onBoot: () => {
    console.log("[HebergementModule] Boot strapping finalized.");
  },
  onUnload: () => {
    console.log("[HebergementModule] Unloading module assets.");
  },
};
