"use strict";

import { useReducedMotion, withTiming } from 'react-native-reanimated';
import { getEnteringTranslateY, getExitingTranslateY } from "./animation-utils.js";
import { toastDefaultValues } from "./constants.js";
import { useToastContext } from "./context.js";
import { easeInOutCubic, easeOutQuartFn } from "./easings.js";
export const ENTERING_ANIMATION_DURATION = 300;
export const STACKING_ANIMATION_DURATION = 600;
export const resolveAnimationField = (toastValue, toasterValue, defaultValue) => {
  const resolved = toastValue !== undefined ? toastValue : toasterValue;
  if (resolved === undefined || resolved === 'default') {
    return defaultValue;
  }
  return resolved;
};
export const useToastLayoutAnimations = (positionProp, animationProp, isHiddenByLimit, numberOfToasts) => {
  const {
    position: positionCtx,
    gap,
    animation: animationCtx
  } = useToastContext();
  const position = positionProp || positionCtx;
  const stackGap = gap ?? toastDefaultValues.stackGap;
  const reducedMotion = useReducedMotion();
  if (reducedMotion) {
    return {
      entering: undefined,
      exiting: undefined
    };
  }
  const defaultEntering = () => {
    'worklet';

    return getToastEntering({
      position
    });
  };
  const defaultExiting = () => {
    'worklet';

    return getToastExiting({
      position,
      isHiddenByLimit,
      numberOfToasts,
      stackGap
    });
  };
  const entering = resolveAnimationField(animationProp?.enter, animationCtx?.enter, defaultEntering);

  // Overflow-cull (isHiddenByLimit) always uses the library fade exit.
  // User-supplied custom exits would look wrong on a buried toast.
  const exiting = isHiddenByLimit ? defaultExiting : resolveAnimationField(animationProp?.exit, animationCtx?.exit, defaultExiting);
  return {
    entering,
    exiting
  };
};
const getToastEntering = ({
  position
}) => {
  'worklet';

  const animations = {
    opacity: withTiming(1, {
      easing: easeOutQuartFn,
      duration: ENTERING_ANIMATION_DURATION
    }),
    transform: [{
      translateY: withTiming(0, {
        easing: easeOutQuartFn,
        duration: ENTERING_ANIMATION_DURATION
      })
    }]
  };
  const translateY = getEnteringTranslateY(position);
  const initialValues = {
    opacity: 0,
    transform: [{
      translateY
    }]
  };
  return {
    initialValues,
    animations
  };
};
const getToastExiting = ({
  position,
  isHiddenByLimit,
  numberOfToasts,
  stackGap = 8
}) => {
  'worklet';

  if (isHiddenByLimit) {
    const animations = {
      opacity: withTiming(0, {
        easing: easeInOutCubic,
        duration: ENTERING_ANIMATION_DURATION
      })
    };
    const initialValues = {
      opacity: 1
    };
    return {
      initialValues,
      animations
    };
  }
  const translateY = getExitingTranslateY({
    position,
    isHiddenByLimit,
    numberOfToasts,
    stackGap
  });
  const animations = {
    opacity: withTiming(0, {
      easing: easeInOutCubic
    }),
    transform: [{
      translateY: withTiming(translateY, {
        easing: easeInOutCubic
      })
    }]
  };
  const initialValues = {
    opacity: 1,
    transform: [{
      translateY: 0
    }]
  };
  return {
    initialValues,
    animations
  };
};
//# sourceMappingURL=animations.js.map