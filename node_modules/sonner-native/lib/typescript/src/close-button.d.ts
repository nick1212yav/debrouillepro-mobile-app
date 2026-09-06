import * as React from 'react';
import { type ViewProps } from 'react-native';
import type { ToastProps } from './types';
import type { DefaultStyles } from './use-default-styles';
export declare const CloseButton: React.FC<{
    dismissible: ToastProps['dismissible'];
    close: ToastProps['close'];
    closeButton: ToastProps['closeButton'];
    onDismiss: ToastProps['onDismiss'];
    id: ToastProps['id'];
    closeButtonStyle?: ViewProps['style'];
    closeButtonIconStyle?: ViewProps['style'];
    defaultStyles: DefaultStyles;
}>;
//# sourceMappingURL=close-button.d.ts.map