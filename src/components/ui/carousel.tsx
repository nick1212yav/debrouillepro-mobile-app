// src/components/ui/carousel.tsx
import * as React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";
import { ArrowLeft, ArrowRight } from "lucide-react-native";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────
type CarouselOrientation = "horizontal" | "vertical";

export interface CarouselApi {
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: () => boolean;
  canScrollNext: () => boolean;
  selectedIndex: () => number;
  scrollTo: (index: number) => void;
  on: (event: "select" | "reInit", handler: () => void) => void;
  off: (event: "select" | "reInit", handler: () => void) => void;
}

interface CarouselProps extends ViewProps {
  orientation?: CarouselOrientation;
  setApi?: (api: CarouselApi) => void;
  /** Callback appelé au changement de slide (équivalent `onSelect` d'embla). */
  onSelectChange?: (index: number) => void;
}

interface CarouselContextProps {
  orientation: CarouselOrientation;
  scrollViewRef: React.RefObject<ScrollView>;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  currentIndex: number;
  registerItemCount: (count: number) => void;
  registerContainerSize: (size: number) => void;
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

export function useCarousel(): CarouselContextProps {
  const ctx = React.useContext(CarouselContext);
  if (!ctx) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return ctx;
}

// ── Carousel ──────────────────────────────────────────────────────────────
function Carousel({
  orientation = "horizontal",
  setApi,
  onSelectChange,
  style,
  children,
  ...props
}: CarouselProps) {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [itemCount, setItemCount] = React.useState(0);
  const [containerSize, setContainerSize] = React.useState(0);

  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < itemCount - 1;

  const scrollToIndex = React.useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, itemCount - 1));
      if (containerSize > 0 && scrollViewRef.current) {
        if (orientation === "horizontal") {
          scrollViewRef.current.scrollTo({
            x: clamped * containerSize,
            animated: true,
          });
        } else {
          scrollViewRef.current.scrollTo({
            y: clamped * containerSize,
            animated: true,
          });
        }
      }
      setCurrentIndex(clamped);
      onSelectChange?.(clamped);
    },
    [containerSize, itemCount, orientation, onSelectChange],
  );

  const scrollPrev = React.useCallback(() => {
    scrollToIndex(currentIndex - 1);
  }, [currentIndex, scrollToIndex]);

  const scrollNext = React.useCallback(() => {
    scrollToIndex(currentIndex + 1);
  }, [currentIndex, scrollToIndex]);

  // Expose l'API compatible "embla" au consommateur via setApi
  React.useEffect(() => {
    if (!setApi) return;
    const api: CarouselApi = {
      scrollPrev,
      scrollNext,
      canScrollPrev: () => currentIndex > 0,
      canScrollNext: () => currentIndex < itemCount - 1,
      selectedIndex: () => currentIndex,
      scrollTo: scrollToIndex,
      on: () => {
        /* no-op : le suivi se fait via onSelectChange */
      },
      off: () => {
        /* no-op */
      },
    };
    setApi(api);
  }, [setApi, scrollPrev, scrollNext, currentIndex, itemCount, scrollToIndex]);

  const handleContainerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      const size = orientation === "horizontal" ? width : height;
      setContainerSize(size);
    },
    [orientation],
  );

  const handleScroll = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (containerSize === 0) return;
      const { contentOffset } = event.nativeEvent;
      const offset =
        orientation === "horizontal" ? contentOffset.x : contentOffset.y;
      const index = Math.round(offset / containerSize);
      if (index !== currentIndex) {
        setCurrentIndex(index);
        onSelectChange?.(index);
      }
    },
    [containerSize, currentIndex, onSelectChange, orientation],
  );

  const registerItemCount = React.useCallback((count: number) => {
    setItemCount(count);
  }, []);

  const registerContainerSize = React.useCallback((size: number) => {
    setContainerSize(size);
  }, []);

  const contextValue = React.useMemo<CarouselContextProps>(
    () => ({
      orientation,
      scrollViewRef,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
      currentIndex,
      registerItemCount,
      registerContainerSize,
    }),
    [
      orientation,
      scrollPrev,
      scrollNext,
      canScrollPrev,
      canScrollNext,
      currentIndex,
      registerItemCount,
      registerContainerSize,
    ],
  );

  return (
    <CarouselContext.Provider value={contextValue}>
      <View
        onLayout={handleContainerLayout}
        style={[styles.root, style]}
        accessibilityRole="adjustable"
        accessibilityLabel="Carousel"
        {...props}
      >
        {children}
      </View>
    </CarouselContext.Provider>
  );
}

// ── CarouselContent ───────────────────────────────────────────────────────
interface CarouselContentProps extends ViewProps {
  /** Nombre d'items pour calculer canScrollPrev/Next. */
  itemCount?: number;
}

function CarouselContent({
  itemCount,
  style,
  children,
  ...props
}: CarouselContentProps) {
  const { orientation, scrollViewRef, registerItemCount, currentIndex } =
    useCarousel();

  // Notifie le nombre d'items si fourni par le parent
  React.useEffect(() => {
    if (typeof itemCount === "number") {
      registerItemCount(itemCount);
    }
  }, [itemCount, registerItemCount]);

  // Récupère dynamiquement le nombre d'enfants (fallback)
  const childrenArray = React.Children.toArray(children);

  React.useEffect(() => {
    if (itemCount === undefined && childrenArray.length > 0) {
      registerItemCount(childrenArray.length);
    }
  }, [childrenArray.length, itemCount, registerItemCount]);

  // Auto-scroll au changement programmatique d'index (via scrollPrev/Next)
  // géré par le parent (déjà fait dans scrollToIndex), ici on garde juste la vue.

  return (
    <ScrollView
      ref={scrollViewRef}
      horizontal={orientation === "horizontal"}
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      style={[styles.scrollView, style]}
      contentContainerStyle={styles.scrollContent}
      {...props}
    >
      <View
        style={[
          styles.contentInner,
          orientation === "vertical" && styles.contentInnerVertical,
        ]}
        // trace l'index courant pour d'éventuels consommateurs
        accessibilityValue={{ now: currentIndex }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

// ── CarouselItem ──────────────────────────────────────────────────────────
function CarouselItem({ style, children, ...props }: ViewProps) {
  const { orientation } = useCarousel();

  // Le parent ScrollView a `pagingEnabled` donc chaque item fait la largeur
  // du container. On force width: 100% (ou height pour vertical).
  return (
    <View
      style={[
        orientation === "horizontal"
          ? styles.itemHorizontal
          : styles.itemVertical,
        style,
      ]}
      accessibilityRole="summary"
      {...props}
    >
      {children}
    </View>
  );
}

// ── CarouselPrevious / CarouselNext ──────────────────────────────────────
interface CarouselNavButtonProps extends React.ComponentProps<typeof Button> {
  className?: string;
}

function CarouselPrevious({
  className: _className,
  variant = "outline",
  size = "icon",
  style,
  ...props
}: CarouselNavButtonProps) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      disabled={!canScrollPrev}
      onPress={scrollPrev}
      accessibilityLabel="Previous slide"
      style={[
        styles.navButton,
        orientation === "horizontal"
          ? styles.navButtonHorizontalLeft
          : styles.navButtonVerticalTop,
        style,
      ]}
      {...props}
    >
      <ArrowLeft size={16} color="#FFFFFF" />
      <Text style={styles.srOnly}>Previous slide</Text>
    </Button>
  );
}

function CarouselNext({
  className: _className,
  variant = "outline",
  size = "icon",
  style,
  ...props
}: CarouselNavButtonProps) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      variant={variant}
      size={size}
      disabled={!canScrollNext}
      onPress={scrollNext}
      accessibilityLabel="Next slide"
      style={[
        styles.navButton,
        orientation === "horizontal"
          ? styles.navButtonHorizontalRight
          : styles.navButtonVerticalBottom,
        style,
      ]}
      {...props}
    >
      <ArrowRight size={16} color="#FFFFFF" />
      <Text style={styles.srOnly}>Next slide</Text>
    </Button>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    position: "relative",
    width: "100%",
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentInner: {
    flexDirection: "row",
  },
  contentInnerVertical: {
    flexDirection: "column",
  },
  itemHorizontal: {
    width: "100%",
  },
  itemVertical: {
    height: "100%",
  },
  navButton: {
    position: "absolute",
    zIndex: 10,
  },
  navButtonHorizontalLeft: {
    left: 8,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  navButtonHorizontalRight: {
    right: 8,
    top: "50%",
    transform: [{ translateY: -16 }],
  },
  navButtonVerticalTop: {
    top: 8,
    left: "50%",
    transform: [{ translateX: -16 }, { rotate: "90deg" }],
  },
  navButtonVerticalBottom: {
    bottom: 8,
    left: "50%",
    transform: [{ translateX: -16 }, { rotate: "90deg" }],
  },
  srOnly: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
