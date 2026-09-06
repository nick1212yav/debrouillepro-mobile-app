import * as React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { ToastAction } from './types';
export declare const ToastButton: React.FC<{
    action: ToastAction;
    onPress: () => void;
    allowFontScaling?: boolean;
    maxFontSizeMultiplier?: number;
    style: StyleProp<ViewStyle>;
    textStyle: StyleProp<TextStyle>;
}>;
//# sourceMappingURL=toast-button.d.ts.map