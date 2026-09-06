import type { ViewStyle } from 'react-native';
import type { ToastPosition } from './types';
export declare const getContainerStyle: (position: ToastPosition) => ViewStyle;
export declare const getInsetValues: ({ position, offset, safeAreaInsets, }: {
    position: ToastPosition;
    offset?: number;
    safeAreaInsets?: {
        top: number;
        bottom: number;
    };
}) => {
    top?: number;
    bottom?: number;
};
export declare const calculateOutsidePressableArea: ({ position, toastHeights, gap, visibleToasts, insetValues, }: {
    position: ToastPosition;
    toastHeights: Record<string | number, number>;
    gap: number;
    visibleToasts: number;
    insetValues: {
        top?: number;
        bottom?: number;
    };
}) => ViewStyle;
//# sourceMappingURL=positioner-utils.d.ts.map