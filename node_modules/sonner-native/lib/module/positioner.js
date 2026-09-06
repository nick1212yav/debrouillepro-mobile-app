"use strict";

import React, { useContext } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { SafeAreaInsetsContext, initialWindowMetrics } from 'react-native-safe-area-context';
import { useDynamicToastContext, useToastContext } from "./context.js";
import { calculateOutsidePressableArea, getContainerStyle, getInsetValues } from "./positioner-utils.js";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
const fallbackInsets = initialWindowMetrics?.insets ?? {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0
};
const useInsets = () => {
  return useContext(SafeAreaInsetsContext) ?? fallbackInsets;
};
export const Positioner = ({
  children,
  position,
  style,
  ...props
}) => {
  const {
    offset,
    gap,
    visibleToasts
  } = useToastContext();
  const {
    isExpanded,
    collapse,
    toastHeights
  } = useDynamicToastContext();
  const {
    top,
    bottom
  } = useInsets();
  const resolvedPosition = position || 'bottom-center';
  const containerStyle = React.useMemo(() => getContainerStyle(resolvedPosition), [resolvedPosition]);
  const insetValues = React.useMemo(() => getInsetValues({
    position: resolvedPosition,
    offset,
    safeAreaInsets: {
      top,
      bottom
    }
  }), [resolvedPosition, offset, top, bottom]);
  const handleOutsidePress = React.useCallback(() => {
    if (isExpanded) {
      collapse();
    }
  }, [isExpanded, collapse]);

  // Don't show expand/collapse for center position
  const shouldAllowCollapse = resolvedPosition !== 'center' && isExpanded;

  // Only rendered while expanded, so gate (rather than memoize) the
  // computation: toast height writes in the common collapsed state would
  // otherwise recompute it on every write for a value never used.
  const outsidePressableStyle = shouldAllowCollapse ? calculateOutsidePressableArea({
    position: resolvedPosition,
    toastHeights,
    gap,
    visibleToasts: visibleToasts || 3,
    insetValues
  }) : null;
  const hasChildren = React.Children.count(children) > 0;
  return /*#__PURE__*/_jsxs(_Fragment, {
    children: [shouldAllowCollapse && /*#__PURE__*/_jsx(Pressable, {
      style: [outsidePressableStyle, androidElevationStyle],
      onPress: handleOutsidePress
    }), /*#__PURE__*/_jsx(View, {
      style: [containerStyle, androidElevationStyle, insetValues, style],
      pointerEvents: Platform.OS === 'android' && !hasChildren ? 'none' : 'box-none',
      ...props,
      children: children
    })]
  });
};

// Without elevation, the positioner can render behind sibling react-native-screens
// surfaces (native-stack, bottom-tabs) on Android, hiding toasts entirely.
const androidElevationStyle = Platform.OS === 'android' ? {
  elevation: 9999
} : null;
//# sourceMappingURL=positioner.js.map