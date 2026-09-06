import * as React from 'react';
import type { ViewStyle } from 'react-native';
import type { ToastProps } from './types';
import type { ToastSwipeHandler } from './gestures';
export declare const useToastSwipeProps: ({ id, position, numberOfToasts, dismissible, closeButton, promiseOptions, important, unstyled, mergedContainerStyle, onDismiss, onPress, }: {
    id: ToastProps["id"];
    position: ToastProps["position"];
    numberOfToasts: number;
    dismissible: boolean;
    closeButton?: boolean;
    promiseOptions?: ToastProps["promiseOptions"];
    important?: boolean;
    unstyled?: boolean;
    mergedContainerStyle?: ViewStyle;
    onDismiss?: ToastProps["onDismiss"];
    onPress?: () => void;
}) => React.ComponentProps<typeof ToastSwipeHandler>;
//# sourceMappingURL=use-toast-swipe.d.ts.map