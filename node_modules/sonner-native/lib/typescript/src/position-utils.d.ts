import type { ToastPosition, ToastProps } from './types';
export declare const getOrderedToastIds: (toasts: ToastProps[], position: ToastPosition, enableStacking: boolean) => Array<string | number>;
export declare const calculateToastPosition: ({ index, numberOfToasts, enableStacking, position, allToastHeights, gap, orderedToastIds, isExpanded, stackGap, }: {
    index: number;
    numberOfToasts: number;
    enableStacking: boolean;
    position: ToastPosition;
    allToastHeights: Record<string | number, number>;
    gap: number;
    orderedToastIds: Array<string | number>;
    isExpanded: boolean;
    stackGap: number;
}) => number;
//# sourceMappingURL=position-utils.d.ts.map