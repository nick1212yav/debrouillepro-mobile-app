import * as React from 'react';
import type { View } from 'react-native';
import type { ToastProps } from './types';
export type MeasurableToastRef = React.RefObject<(View & {
    getBoundingClientRect?: () => DOMRect;
}) | null>;
export declare const useToastLifecycle: ({ id, toastRef, variant, title, description, jsx, }: {
    id: ToastProps["id"];
    toastRef: MeasurableToastRef;
    variant: ToastProps["variant"];
    title: string;
    description?: string;
    jsx?: React.ReactNode;
}) => void;
//# sourceMappingURL=use-toast-lifecycle.d.ts.map