import * as React from 'react';
import type { ToastProps, ToastRef } from './types';
type ToastTimer = {
    timeout: ReturnType<typeof setTimeout>;
    startTime: number;
    remainingTime: number;
    isPaused: boolean;
};
type ToastStoreState = {
    toasts: ToastProps[];
    toastsById: Map<string | number, ToastProps>;
    toastsCounter: number;
    toastRefs: Record<string | number, React.RefObject<ToastRef | null>>;
    shouldShowOverlay: Record<string, boolean>;
    toastTimers: Record<string | number, ToastTimer>;
    toastHeights: Record<string | number, number>;
    toastHeightsVersion: number;
    isExpanded: Record<string, boolean>;
};
export declare const DEFAULT_CHANNEL = "";
export declare const channelOf: (toast: {
    toasterId?: string;
}) => string;
export declare const getChannelExpanded: (state: Pick<ToastStoreState, "isExpanded">, channel?: string) => boolean;
export declare const getChannelOverlay: (state: Pick<ToastStoreState, "shouldShowOverlay">, channel?: string) => boolean;
type Subscriber = () => void;
type ToastStoreConfig = {
    autoWiggleOnUpdate?: 'never' | 'toast-change' | 'always';
    visibleToasts?: number;
    duration?: number;
    pauseWhenPageIsHidden?: boolean;
};
declare class ToastStore {
    private state;
    private subscribers;
    private configByChannel;
    private hideOverlayTimeouts;
    private promiseResolvers;
    private mountedByChannel;
    private warnedUnmountedChannels;
    private clearChannelTimeouts;
    private collapseCooldowns;
    private collapseCooldownTimeouts;
    subscribe: (callback: Subscriber) => () => void;
    getSnapshot: () => ToastStoreState;
    setConfig: (config: ToastStoreConfig, channel?: string) => void;
    private configFor;
    private isChannelLive;
    private startAutoClose;
    isChannelExpanded: (channel?: string) => boolean;
    shouldShowOverlayFor: (channel?: string) => boolean;
    registerChannel: (channel: string) => (() => void);
    private warnIfChannelUnmounted;
    private clearChannel;
    private notify;
    private cloneIndex;
    private startTimer;
    private clearTimer;
    pauseTimer: (id: string | number) => void;
    resumeTimer: (id: string | number) => void;
    pauseAllTimers: (channel?: string) => void;
    resumeAllTimers: (channel?: string) => void;
    private handlePromise;
    addToast: (options: Omit<ToastProps, "id" | "numberOfToasts" | "index" | "orderedToastIds"> & {
        id?: string | number;
    }) => string | number;
    dismissToast: (id: string | number | undefined, origin?: "onDismiss" | "onAutoClose") => string | number | undefined;
    private scheduleHideOverlay;
    wiggleToast: (id: string | number) => void;
    getToastRef: (id: string | number) => React.RefObject<ToastRef | null> | undefined;
    setToastHeight: (id: string | number, height: number) => void;
    expand: (channel?: string) => void;
    collapse: (channel?: string) => void;
    toggleExpand: (channel?: string) => void;
}
export declare const toastStore: ToastStore;
export {};
//# sourceMappingURL=toast-store.d.ts.map