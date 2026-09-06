import type { ToastPosition } from './types';
export declare const getEnteringTranslateY: (position: ToastPosition) => number;
export declare const getExitingTranslateY: ({ position, isHiddenByLimit, numberOfToasts, stackGap, }: {
    position: ToastPosition;
    isHiddenByLimit?: boolean;
    numberOfToasts?: number;
    stackGap: number;
}) => number;
//# sourceMappingURL=animation-utils.d.ts.map