// src/shims/leaflet.tsx
/**
 * Shim `leaflet` pour React Native.
 * L'objet `L` est utilisé pour créer des icônes (divIcon, Icon.Default).
 * On fournit un stub no-op qui évite les crashes.
 */

type IconOptions = {
  className?: string;
  html?: string;
  iconSize?: [number, number];
  iconAnchor?: [number, number];
  popupAnchor?: [number, number];
  iconRetinaUrl?: string;
  iconUrl?: string;
  shadowUrl?: string;
};

const L = {
  Icon: {
    Default: {
      prototype: {},
      mergeOptions: (_opts: IconOptions) => undefined,
    },
  },
  divIcon: (_opts: IconOptions) => ({}),
  icon: (_opts: IconOptions) => ({}),
  map: () => ({
    setView: () => undefined,
    flyTo: () => undefined,
    on: () => undefined,
    off: () => undefined,
  }),
  tileLayer: () => ({}),
  marker: () => ({}),
};

export default L;
export { L };
