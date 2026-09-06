import * as React from 'react';
import { type ToastProps, type ToastRef, type ToastStyles } from './types';
export declare const Toast: React.NamedExoticComponent<{
    unstyled?: boolean;
    style?: import("react-native").ViewStyle;
    styles?: ToastStyles;
    backgroundComponent?: React.ReactNode;
} & {
    id: string | number;
    toasterId?: string;
    index: number;
    title: string;
    variant: import("./types").ToastVariant;
    numberOfToasts: number;
    orderedToastIds: Array<string | number>;
    jsx?: React.ReactNode;
    description?: string;
    invert?: boolean;
    important?: boolean;
    duration?: number;
    position?: import("./types").ToastPosition;
    animation?: import("./types").ToastAnimation;
    dismissible?: boolean;
    icon?: React.ReactNode;
    action?: import("./types").ToastAction | React.ReactNode;
    cancel?: import("./types").ToastAction | React.ReactNode;
    close?: React.ReactNode;
    closeButton?: boolean;
    richColors?: boolean;
    onDismiss?: (id: string | number) => void;
    onAutoClose?: (id: string | number) => void;
    promiseOptions?: {
        promise: Promise<unknown>;
        success: (result: unknown) => string;
        error: ((error: unknown) => string) | string;
        loading: string;
        styles?: {
            loading?: ToastStyles;
            success?: ToastStyles;
            error?: ToastStyles;
        };
    };
    actionButtonStyle?: import("react-native").ViewStyle;
    actionButtonTextStyle?: import("react-native").TextStyle;
    cancelButtonStyle?: import("react-native").ViewStyle;
    cancelButtonTextStyle?: import("react-native").TextStyle;
    onPress?: () => void;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
} & {
    parentStyle?: ToastProps["style"];
    parentStyles?: ToastStyles;
} & React.RefAttributes<ToastRef>>;
//# sourceMappingURL=toast.d.ts.map