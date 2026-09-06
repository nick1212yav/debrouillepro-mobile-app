import type { TextStyle, ViewStyle } from 'react-native';
import type { ToastVariant } from './types';
export type DefaultStyles = {
    toast: ViewStyle;
    toastContent: ViewStyle;
    title: TextStyle;
    description: TextStyle;
    buttons: ViewStyle;
    actionButton: ViewStyle;
    actionButtonText: TextStyle;
    cancelButton: ViewStyle;
    cancelButtonText: TextStyle;
    closeButtonColor: string;
    iconColor: string;
};
export declare const useDefaultStyles: ({ invert, richColors, unstyled, description, variant: variantProps, }: {
    invert: boolean;
    richColors: boolean;
    unstyled: boolean | undefined;
    description: string | undefined;
    variant: ToastVariant;
}) => DefaultStyles;
export declare const useIconColor: ({ invert, richColors, variant: variantProps, }: {
    invert: boolean;
    richColors: boolean;
    variant: ToastVariant;
}) => string;
//# sourceMappingURL=use-default-styles.d.ts.map