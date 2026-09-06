/// <reference types="nativewind/types" />

import "react-native";
import "lucide-react-native";

// ─────────────────────────────────────────────────────────────────────────────
// NativeWind — React Native component props
// ─────────────────────────────────────────────────────────────────────────────

declare module "react-native" {
  interface ViewProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface ImageProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
  }

  interface FlatListProps<ItemT> {
    className?: string;
  }

  interface SectionListProps<ItemT, SectionT> {
    className?: string;
  }

  interface SafeAreaViewProps {
    className?: string;
  }

  interface KeyboardAvoidingViewProps {
    className?: string;
  }

  interface TouchableOpacityProps {
    className?: string;
  }

  interface TouchableHighlightProps {
    className?: string;
  }

  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// NativeWind — Lucide React Native
// ─────────────────────────────────────────────────────────────────────────────

declare module "lucide-react-native" {
  interface LucideProps {
    className?: string;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JSX — className support
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  namespace JSX {
    interface IntrinsicAttributes {
      className?: string;
    }
  }
}

export {};
