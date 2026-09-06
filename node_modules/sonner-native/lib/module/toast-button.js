"use strict";

import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { jsx as _jsx } from "react/jsx-runtime";
// A labeled action/cancel button rendered from a ToastAction.
export const ToastButton = ({
  action,
  onPress,
  allowFontScaling,
  maxFontSizeMultiplier,
  style,
  textStyle
}) => {
  return /*#__PURE__*/_jsx(Pressable, {
    onPress: onPress,
    style: style,
    children: /*#__PURE__*/_jsx(Text, {
      numberOfLines: 1,
      allowFontScaling: allowFontScaling,
      maxFontSizeMultiplier: maxFontSizeMultiplier,
      style: textStyle,
      children: action.label
    })
  });
};
//# sourceMappingURL=toast-button.js.map