// src/shims/react-native-clipboard.ts
import * as ExpoClipboard from "expo-clipboard";

export const Clipboard = {
  setString: (text: string) => {
    ExpoClipboard.setStringAsync(text).catch(() => {});
  },
  getString: () => ExpoClipboard.getStringAsync(),
  setStrings: (texts: string[]) => {
    if (texts.length > 0) {
      ExpoClipboard.setStringAsync(texts[0]).catch(() => {});
    }
  },
  hasString: () => ExpoClipboard.hasStringAsync(),
  clear: () => Promise.resolve(),
};

export default Clipboard;
