import { type AutoWiggle, type ToastAnimation, type ToastPosition, type ToastSwipeDirection, type ToastTheme } from 'sonner-native';
export type ToasterAnimationKey = 'default' | 'fade' | 'slide';
export declare function useToasterParams(): {
    position: ToastPosition;
    stackingEnabled: boolean;
    theme: ToastTheme;
    swipeDirection: ToastSwipeDirection;
    closeButton: boolean;
    visibleToasts: number;
    autoWiggle: AutoWiggle;
    richColors: boolean;
    invert: boolean;
    gap: number | undefined;
    animationKey: ToasterAnimationKey;
    animation: ToastAnimation | undefined;
    allowFontScaling: boolean;
    maxFontSizeMultiplier: number | undefined;
    setParam: (key: string, value: string) => void;
};
//# sourceMappingURL=useToasterParams.d.ts.map