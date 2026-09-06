import type { AutoWiggle, ToastPosition, ToastSwipeDirection, ToastTheme, ToastVariant } from './types';
export declare const ESTIMATED_TOAST_HEIGHT = 70;
export declare const CLOSE_BUTTON_HIT_AREA = 60;
export declare const OUTSIDE_PRESS_PADDING = 20;
export declare const toastDefaultValues: {
    duration: number;
    position: ToastPosition;
    offset: number;
    swipeToDismissDirection: ToastSwipeDirection;
    variant: ToastVariant;
    visibleToasts: number;
    closeButton: boolean;
    dismissible: boolean;
    unstyled: boolean;
    invert: boolean;
    pauseWhenPageIsHidden: boolean;
    gap: number;
    theme: ToastTheme;
    autoWiggleOnUpdate: AutoWiggle;
    richColors: boolean;
    enableStacking: boolean;
    stackGap: number;
    allowFontScaling: boolean;
};
//# sourceMappingURL=constants.d.ts.map