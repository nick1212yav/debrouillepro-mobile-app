import type { ToastPosition } from './types';
export declare const useToastPosition: ({ id, index, numberOfToasts, enableStacking, position, allToastHeights, gap, orderedToastIds, isExpanded, stackGap, toastHeightsVersion, }: {
    id: string | number;
    index: number;
    numberOfToasts: number;
    enableStacking: boolean;
    position: ToastPosition;
    allToastHeights: Record<string | number, number>;
    gap: number;
    orderedToastIds: Array<string | number>;
    isExpanded: boolean;
    stackGap: number;
    toastHeightsVersion: number;
}) => import("react-native-reanimated").DerivedValue<number>;
//# sourceMappingURL=use-toast-position.d.ts.map