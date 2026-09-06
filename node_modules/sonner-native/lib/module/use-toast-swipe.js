"use strict";

import * as React from 'react';
import { useWindowDimensions } from 'react-native';
import { useDynamicToastContext, useToastContext } from "./context.js";
import { isPressNearCloseButton } from "./press-utils.js";
import { toastStore } from "./toast-store.js";
// Swipe/press behavior for a single toast: timer pause/resume around drags,
// expand/collapse and close-button handling on tap, and the memoized prop
// object handed to ToastSwipeHandler.
export const useToastSwipeProps = ({
  id,
  position,
  numberOfToasts,
  dismissible,
  closeButton,
  promiseOptions,
  important,
  unstyled,
  mergedContainerStyle,
  onDismiss,
  onPress
}) => {
  const {
    position: positionCtx,
    enableStacking,
    toastOptions: {
      toastContainerStyle: toastContainerStyleCtx
    }
  } = useToastContext();
  const {
    isExpanded,
    toggleExpand
  } = useDynamicToastContext();
  const {
    width: screenWidth
  } = useWindowDimensions();
  const isDragging = React.useRef(false);
  const onRemove = React.useCallback(() => {
    onDismiss?.(id);
  }, [onDismiss, id]);
  const onSwipeBegin = React.useCallback(() => {
    isDragging.current = true;
    toastStore.pauseTimer(id);
  }, [id]);
  const onSwipeFinalize = React.useCallback(() => {
    isDragging.current = false;
    if (!isExpanded) {
      toastStore.resumeTimer(id);
    }
  }, [id, isExpanded]);
  const onSwipePress = React.useCallback(({
    x
  }) => {
    const pressToastPosition = position || positionCtx;
    if (enableStacking && numberOfToasts > 1 && pressToastPosition !== 'center') {
      if (isPressNearCloseButton({
        x,
        viewWidth: screenWidth
      })) {
        // On Android, the RNGH Tap gesture intercepts the touch before
        // it reaches the native Pressable (close button). Dismiss
        // explicitly when tapping the close button area while expanded.
        if (isExpanded && closeButton && dismissible) {
          onDismiss?.(id);
        }
      } else {
        toggleExpand();
      }
    }
    onPress?.();
  }, [position, positionCtx, enableStacking, numberOfToasts, toggleExpand, onPress, isExpanded, closeButton, dismissible, onDismiss, id, screenWidth]);
  return React.useMemo(() => ({
    onRemove,
    onBegin: onSwipeBegin,
    onFinalize: onSwipeFinalize,
    onPress: onSwipePress,
    enabled: !promiseOptions && dismissible,
    style: [toastContainerStyleCtx, mergedContainerStyle],
    unstyled,
    important,
    position
  }), [onRemove, onSwipeBegin, onSwipeFinalize, onSwipePress, promiseOptions, dismissible, toastContainerStyleCtx, mergedContainerStyle, unstyled, important, position]);
};
//# sourceMappingURL=use-toast-swipe.js.map