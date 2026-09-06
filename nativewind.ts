/**
 * ============================================================================
 * DEBROUILLEPRO — NativeWind / Expo Image bridge
 * ============================================================================
 *
 * NativeWind global compatibility setup.
 *
 * This file is intentionally located at the native project root because
 * app/_layout.tsx imports it with:
 *
 *   import "../nativewind";
 *
 * It registers NativeWind's `className` prop on expo-image by forwarding it
 * to the native `style` prop.
 * ============================================================================
 */

import { cssInterop } from "react-native-css-interop";
import { Image } from "expo-image";

cssInterop(Image, {
  className: {
    target: "style",
  },
});
