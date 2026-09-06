import type { EntryExitAnimationFunction } from 'react-native-reanimated';
import type { ToastAnimation, ToastEntryExitAnimation, ToastPosition } from './types';
export declare const ENTERING_ANIMATION_DURATION = 300;
export declare const STACKING_ANIMATION_DURATION = 600;
type ResolvedAnimation = Exclude<ToastEntryExitAnimation, 'default'>;
export declare const resolveAnimationField: (toastValue: ToastEntryExitAnimation | undefined, toasterValue: ToastEntryExitAnimation | undefined, defaultValue: EntryExitAnimationFunction) => ResolvedAnimation;
export declare const useToastLayoutAnimations: (positionProp: ToastPosition | undefined, animationProp: ToastAnimation | undefined, isHiddenByLimit?: boolean, numberOfToasts?: number) => {
    entering: undefined;
    exiting: undefined;
} | {
    entering: ResolvedAnimation;
    exiting: ((targetValues: import("react-native-reanimated").EntryAnimationsValues) => import("react-native-reanimated").LayoutAnimation) | ((targetValues: import("react-native-reanimated").ExitAnimationsValues) => import("react-native-reanimated").LayoutAnimation) | import("react-native-reanimated").BaseAnimationBuilder | import("react-native-reanimated").ReanimatedKeyframe;
};
export {};
//# sourceMappingURL=animations.d.ts.map