"use strict";

import * as React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, LinearTransition, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useToastContext } from "./context.js";
import { easeInOutCircFn } from "./easings.js";
import { jsx as _jsx } from "react/jsx-runtime";
export const ToastSwipeHandler = ({
  children,
  onRemove,
  style,
  onBegin,
  onFinalize,
  enabled,
  unstyled,
  important,
  position: positionProps,
  onPress
}) => {
  const {
    width: windowWidth
  } = useWindowDimensions();
  const translate = useSharedValue(0);
  const {
    swipeToDismissDirection: direction,
    position: positionCtx
  } = useToastContext();
  const position = positionProps || positionCtx;
  const pan = Gesture.Pan().onBegin(() => {
    'worklet';

    if (!enabled) {
      return;
    }
    runOnJS(onBegin)();
  }).onChange(event => {
    'worklet';

    if (!enabled) {
      return;
    }
    if (direction === 'left' && event.translationX < 0) {
      translate.value = event.translationX;
    } else if (direction === 'up') {
      const isBottomPosition = position === 'bottom-center';
      const rawTranslation = event.translationY * (isBottomPosition ? -1 : 1);

      // Define correct and wrong directions based on position
      const isCorrectDirection = rawTranslation < 0; // negative means correct dismissal direction
      const isWrongDirection = rawTranslation > 0; // positive means wrong direction

      if (isCorrectDirection) {
        // Allow full movement in correct direction
        translate.value = rawTranslation;
      } else if (isWrongDirection) {
        translate.value = elasticResistance(rawTranslation);
      }
    }
  }).onFinalize(() => {
    'worklet';

    if (!enabled) {
      return;
    }
    if (direction === 'left') {
      const threshold = -windowWidth * 0.25;
      const shouldDismiss = translate.value < threshold;
      if (Math.abs(translate.value) < 16) {
        translate.value = withTiming(0, {
          easing: Easing.elastic(0.8)
        });
        return;
      }
      if (shouldDismiss) {
        translate.value = withTiming(-windowWidth, {
          easing: Easing.inOut(Easing.ease)
        }, isDone => {
          if (isDone) {
            runOnJS(onRemove)();
          }
        });
      } else {
        translate.value = withTiming(0, {
          easing: Easing.elastic(0.8)
        });
      }
    } else if (direction === 'up') {
      const threshold = -16;
      const shouldDismiss = translate.value < threshold;
      const isWrongDirection = translate.value > 0;

      // If dragged in wrong direction, always spring back
      if (isWrongDirection) {
        translate.value = withTiming(0, {
          easing: Easing.elastic(0.8),
          duration: 400
        });
      } else if (Math.abs(translate.value) < 16) {
        translate.value = withTiming(0, {
          easing: Easing.elastic(0.8)
        });
      } else if (shouldDismiss) {
        translate.value = withTiming(-windowWidth, {
          easing: Easing.inOut(Easing.ease)
        }, isDone => {
          if (isDone) {
            runOnJS(onRemove)();
          }
        });
      } else {
        translate.value = withTiming(0, {
          easing: Easing.elastic(0.8)
        });
      }
    }
    runOnJS(onFinalize)();
  });
  const tap = Gesture.Tap().onEnd(event => {
    'worklet';

    if (onPress) {
      runOnJS(onPress)({
        x: event.x,
        y: event.y
      });
    }
  });
  const isAndroid = Platform.OS === 'android';
  const animatedStyle = useAnimatedStyle(() => {
    const aStyle = {
      transform: [direction === 'left' ? {
        translateX: translate.value
      } : {
        translateY: translate.value * (position === 'bottom-center' ? -1 : 1)
      }]
    };
    if (isAndroid) {
      aStyle.opacity = 1;
    } else {
      aStyle.opacity = interpolate(translate.value, [0, direction === 'left' ? -windowWidth : -60], [1, 0]);
    }
    return aStyle;
  }, [direction, translate, windowWidth]);
  return /*#__PURE__*/_jsx(GestureDetector, {
    gesture: Gesture.Race(tap, pan),
    children: /*#__PURE__*/_jsx(Animated.View, {
      style: [animatedStyle, unstyled ? undefined : {
        justifyContent: 'center'
      }, {
        width: '100%'
      }, Platform.OS === 'android' ? {
        opacity: 1
      } : {}, style],
      layout: LinearTransition.easing(easeInOutCircFn),
      "aria-live": important ? 'assertive' : 'polite' // https://reactnative.dev/docs/accessibility#aria-live-android
      ,
      children: children
    })
  });
};

// Apply progressive elastic resistance (Apple-style)
// This function provides diminishing returns as the drag distance increases
function elasticResistance(distance) {
  'worklet';

  // Base resistance factor
  const baseResistance = 0.4;
  // Progressive dampening - the further you drag, the more resistance
  const progressiveFactor = 1 / (1 + distance * 0.02);
  return distance * baseResistance * progressiveFactor;
}
//# sourceMappingURL=gestures.js.map