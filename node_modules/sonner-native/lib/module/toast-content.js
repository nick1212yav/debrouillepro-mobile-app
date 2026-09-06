"use strict";

import * as React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { CloseButton } from "./close-button.js";
import { useToastContext } from "./context.js";
import { ToastButton } from "./toast-button.js";
import { ToastIcon } from "./toast-icon.js";
import { isToastAction } from "./types.js";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// The visual innards of a standard (non-jsx) toast: icon, title/description,
// action/cancel buttons, and close button. All `props ?? context` resolution
// happens in the parent; this component only reads context for Toaster-level
// toastOptions styles and icon overrides.
export const ToastContent = ({
  id,
  title,
  description,
  icon,
  variant,
  action,
  cancel,
  close,
  closeButton,
  dismissible,
  onDismiss,
  promiseOptions,
  actionButtonStyle,
  actionButtonTextStyle,
  cancelButtonStyle,
  cancelButtonTextStyle,
  invert,
  richColors,
  unstyled,
  allowFontScaling,
  maxFontSizeMultiplier,
  mergedStyles,
  defaultStyles,
  contentContainerStyle
}) => {
  const {
    icons,
    toastOptions: {
      actionButtonStyle: actionButtonStyleCtx,
      actionButtonTextStyle: actionButtonTextStyleCtx,
      cancelButtonStyle: cancelButtonStyleCtx,
      cancelButtonTextStyle: cancelButtonTextStyleCtx,
      toastContentStyle: toastContentStyleCtx,
      textContainerStyle: textContainerStyleCtx,
      titleStyle: titleStyleCtx,
      descriptionStyle: descriptionStyleCtx,
      buttonsStyle: buttonsStyleCtx,
      closeButtonStyle: closeButtonStyleCtx,
      closeButtonIconStyle: closeButtonIconStyleCtx
    }
  } = useToastContext();
  const onCancelPress = React.useCallback(() => {
    if (isToastAction(cancel)) {
      cancel.onClick();
    }
    onDismiss?.(id);
  }, [cancel, onDismiss, id]);
  return /*#__PURE__*/_jsxs(View, {
    style: [defaultStyles.toastContent, toastContentStyleCtx, mergedStyles?.toastContent, contentContainerStyle],
    children: [promiseOptions || variant === 'loading' ? 'loading' in icons ? icons.loading : /*#__PURE__*/_jsx(ActivityIndicator, {}) : icon ? /*#__PURE__*/_jsx(View, {
      children: icon
    }) : variant in icons ? icons[variant] : /*#__PURE__*/_jsx(ToastIcon, {
      variant: variant,
      invert: invert,
      richColors: richColors
    }), /*#__PURE__*/_jsxs(View, {
      style: [{
        flex: 1
      }, textContainerStyleCtx, mergedStyles?.textContainer],
      children: [/*#__PURE__*/_jsx(Text, {
        allowFontScaling: allowFontScaling,
        maxFontSizeMultiplier: maxFontSizeMultiplier,
        style: [defaultStyles.title, titleStyleCtx, mergedStyles?.title],
        children: title
      }), description ? /*#__PURE__*/_jsx(Text, {
        allowFontScaling: allowFontScaling,
        maxFontSizeMultiplier: maxFontSizeMultiplier,
        style: [defaultStyles.description, descriptionStyleCtx, mergedStyles?.description],
        children: description
      }) : null, /*#__PURE__*/_jsxs(View, {
        style: [unstyled || !action && !cancel ? undefined : defaultStyles.buttons, buttonsStyleCtx, mergedStyles?.buttons],
        children: [isToastAction(action) ? /*#__PURE__*/_jsx(ToastButton, {
          action: action,
          onPress: action.onClick,
          allowFontScaling: allowFontScaling,
          maxFontSizeMultiplier: maxFontSizeMultiplier,
          style: [defaultStyles.actionButton, actionButtonStyleCtx, actionButtonStyle],
          textStyle: [defaultStyles.actionButtonText, actionButtonTextStyleCtx, actionButtonTextStyle]
        }) : action || undefined, isToastAction(cancel) ? /*#__PURE__*/_jsx(ToastButton, {
          action: cancel,
          onPress: onCancelPress,
          allowFontScaling: allowFontScaling,
          maxFontSizeMultiplier: maxFontSizeMultiplier,
          style: [defaultStyles.cancelButton, cancelButtonStyleCtx, cancelButtonStyle],
          textStyle: [defaultStyles.cancelButtonText, cancelButtonTextStyleCtx, cancelButtonTextStyle]
        }) : cancel || undefined]
      })]
    }), /*#__PURE__*/_jsx(CloseButton, {
      dismissible: dismissible,
      close: close,
      closeButton: closeButton,
      onDismiss: onDismiss,
      id: id,
      closeButtonStyle: [closeButtonStyleCtx, mergedStyles?.closeButton],
      closeButtonIconStyle: [closeButtonIconStyleCtx, mergedStyles?.closeButtonIcon],
      defaultStyles: defaultStyles
    })]
  });
};
//# sourceMappingURL=toast-content.js.map