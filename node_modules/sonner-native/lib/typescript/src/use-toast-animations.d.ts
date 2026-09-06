import type { SharedValue } from 'react-native-reanimated';
import type { ToastPosition } from './types';
export declare const useToastAnimations: ({ toastPosition, index, numberOfToasts, enableStacking, isExpanded, stackGap, duration, yPosition, }: {
    toastPosition: ToastPosition;
    index: number;
    numberOfToasts: number;
    enableStacking: boolean;
    isExpanded: boolean;
    stackGap: number;
    duration: number;
    yPosition: SharedValue<number>;
}) => {
    absolutePositionStyle: Record<string, unknown>;
    stackZIndex: number;
    wiggleAnimationStyle: {
        transform: {
            scale: number;
        }[];
    };
    wiggleHandler: () => void;
};
//# sourceMappingURL=use-toast-animations.d.ts.map