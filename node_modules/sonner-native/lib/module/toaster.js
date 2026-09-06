"use strict";

import * as React from 'react';
import { Platform } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { toastDefaultValues } from "./constants.js";
import { DynamicToastContext, ToastContext } from "./context.js";
import { getOrderedToastIds } from "./position-utils.js";
import { Positioner } from "./positioner.js";
import { Toast } from "./toast.js";
import { channelOf, DEFAULT_CHANNEL, getChannelExpanded, getChannelOverlay, toastStore } from "./toast-store.js";
import { jsx as _jsx } from "react/jsx-runtime";
const allPositions = ['top-center', 'bottom-center', 'center'];
const EMPTY_TOAST_OPTIONS = {};
const EMPTY_ICONS = {};
const EMPTY_ANIMATION = {};
function areArrayItemsIdentical(a, b) {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

// Every PositionData field needs a comparator here: adding a field without
// deciding how it participates in cache-entry reuse is a type error, so a new
// field can never be silently served stale from positionsCache.
const positionDataComparators = {
  position: (a, b) => a === b,
  toasts: areArrayItemsIdentical,
  orderedToastIds: areArrayItemsIdentical
};
function arePositionEntriesEqual(a, b) {
  return Object.keys(positionDataComparators).every(key => positionDataComparators[key](a[key], b[key]));
}
function orderToastsFromPosition(currentToasts, position) {
  return position === 'top-center' ? currentToasts.slice().reverse() : currentToasts;
}
export const Toaster = ({
  ToasterOverlayWrapper,
  id,
  fullWindowOverlay = true,
  ...toasterProps
}) => {
  const storeState = React.useSyncExternalStore(toastStore.subscribe, toastStore.getSnapshot, toastStore.getSnapshot);
  const {
    toasts: allToasts,
    toastHeights,
    toastHeightsVersion
  } = storeState;
  const channel = id ?? DEFAULT_CHANNEL;
  // From the SNAPSHOT, not toastStore accessors: under the React Compiler an
  // accessor call is memoized on `channel` alone and never re-reads the store,
  // freezing expansion/overlay at their first-render values on device.
  const shouldShowOverlay = getChannelOverlay(storeState, channel);
  const isExpanded = getChannelExpanded(storeState, channel);

  // Channel lifetime lives HERE, not in ToasterUI: ToasterUI's position in
  // the tree changes when the overlay wrapper mounts/unmounts, so an effect
  // inside it would cycle the channel refcount on every overlay flip.
  React.useEffect(() => toastStore.registerChannel(channel), [channel]);

  // Channel routing, exactly web Sonner's rule: a named Toaster renders only
  // toasts addressed to it; an unnamed one renders only unaddressed toasts.
  const toasts = React.useMemo(() => allToasts.filter(toast => channelOf(toast) === channel), [allToasts, channel]);
  const uiProps = {
    ...toasterProps,
    channel,
    toasts,
    toastHeights,
    isExpanded,
    toastHeightsVersion
  };
  if (!shouldShowOverlay) {
    return /*#__PURE__*/_jsx(ToasterUI, {
      ...uiProps
    });
  }
  if (ToasterOverlayWrapper) {
    return /*#__PURE__*/_jsx(ToasterOverlayWrapper, {
      children: /*#__PURE__*/_jsx(ToasterUI, {
        ...uiProps
      })
    });
  }
  if (Platform.OS === 'ios' && fullWindowOverlay) {
    return /*#__PURE__*/_jsx(FullWindowOverlay, {
      children: /*#__PURE__*/_jsx(ToasterUI, {
        ...uiProps
      })
    });
  }
  return /*#__PURE__*/_jsx(ToasterUI, {
    ...uiProps
  });
};
const ToasterUI = ({
  channel,
  toasts,
  toastHeights,
  isExpanded,
  toastHeightsVersion,
  duration = toastDefaultValues.duration,
  position = toastDefaultValues.position,
  offset = toastDefaultValues.offset,
  visibleToasts = toastDefaultValues.visibleToasts,
  swipeToDismissDirection = toastDefaultValues.swipeToDismissDirection,
  closeButton,
  invert,
  allowFontScaling,
  maxFontSizeMultiplier,
  toastOptions = EMPTY_TOAST_OPTIONS,
  icons,
  pauseWhenPageIsHidden,
  gap,
  theme,
  autoWiggleOnUpdate,
  richColors,
  enableStacking = toastDefaultValues.enableStacking,
  animation,
  ToastWrapper,
  positionerStyle,
  unstyled,
  style,
  styles,
  backgroundComponent
}) => {
  React.useEffect(() => {
    toastStore.setConfig({
      autoWiggleOnUpdate,
      visibleToasts,
      duration,
      pauseWhenPageIsHidden
    }, channel);
  }, [channel, autoWiggleOnUpdate, visibleToasts, duration, pauseWhenPageIsHidden]);
  const addToastInChannel = React.useCallback(
  // The explicit field (not spread order) decides precedence, so a data
  // object carrying a present-but-undefined toasterId key can't unbind the
  // toast from this Toaster's channel.
  data => toastStore.addToast({
    ...data,
    toasterId: data.toasterId ?? (channel || undefined)
  }), [channel]);
  const value = React.useMemo(() => ({
    duration: duration ?? toastDefaultValues.duration,
    position: position ?? toastDefaultValues.position,
    offset: offset ?? toastDefaultValues.offset,
    swipeToDismissDirection: swipeToDismissDirection ?? toastDefaultValues.swipeToDismissDirection,
    closeButton: closeButton ?? toastDefaultValues.closeButton,
    unstyled: toastOptions.unstyled ?? toastDefaultValues.unstyled,
    addToast: addToastInChannel,
    invert: invert ?? toastDefaultValues.invert,
    allowFontScaling: allowFontScaling ?? toastDefaultValues.allowFontScaling,
    maxFontSizeMultiplier,
    icons: icons ?? EMPTY_ICONS,
    pauseWhenPageIsHidden: pauseWhenPageIsHidden ?? toastDefaultValues.pauseWhenPageIsHidden,
    gap: gap ?? toastDefaultValues.gap,
    theme: theme ?? toastDefaultValues.theme,
    toastOptions,
    autoWiggleOnUpdate: autoWiggleOnUpdate ?? toastDefaultValues.autoWiggleOnUpdate,
    richColors: richColors ?? toastDefaultValues.richColors,
    enableStacking: enableStacking ?? toastDefaultValues.enableStacking,
    visibleToasts: visibleToasts ?? toastDefaultValues.visibleToasts,
    animation: animation ?? EMPTY_ANIMATION
  }), [addToastInChannel, duration, position, offset, swipeToDismissDirection, closeButton, toastOptions, invert, allowFontScaling, maxFontSizeMultiplier, icons, pauseWhenPageIsHidden, gap, theme, autoWiggleOnUpdate, richColors, enableStacking, visibleToasts, animation]);

  // Keyed by channel only, so the function identities survive height writes —
  // consumers memoized on them (positioner press handling, swipe props) don't
  // churn every time a toast reports its layout.
  const expand = React.useCallback(() => toastStore.expand(channel), [channel]);
  const collapse = React.useCallback(() => toastStore.collapse(channel), [channel]);
  const toggleExpand = React.useCallback(() => toastStore.toggleExpand(channel), [channel]);
  const dynamicValue = React.useMemo(() => ({
    toastHeights,
    toastHeightsVersion,
    isExpanded,
    expand,
    collapse,
    toggleExpand
  }), [toastHeights, toastHeightsVersion, isExpanded, expand, collapse, toggleExpand]);
  const onDismiss = React.useCallback(id => {
    toastStore.dismissToast(id, 'onDismiss');
  }, []);
  const onAutoClose = React.useCallback(id => {
    toastStore.dismissToast(id, 'onAutoClose');
  }, []);

  // Per-position render data with stable identities: entries (and their
  // toasts/orderedToastIds arrays) are reused from the previous render when
  // their contents are unchanged, so React.memo on Toast can bail out for
  // positions untouched by a store change.
  // useState (not useRef): the react-hooks/refs rule forbids ref reads in
  // render; this Map is a memo table whose writes are render-idempotent.
  const [positionsCache] = React.useState(() => new Map());
  const positionsData = React.useMemo(() => {
    const data = [];
    for (const currentPosition of allPositions) {
      const toastsForPosition = orderToastsFromPosition(toasts.filter(possibleToast => (possibleToast.position ?? position) === currentPosition), currentPosition);
      if (toastsForPosition.length === 0 && position !== currentPosition) {
        // Drop the cached entry so its ToastProps (jsx, closures) don't
        // outlive the dismissed toasts.
        positionsCache.delete(currentPosition);
        continue;
      }
      const orderedToastIds = getOrderedToastIds(toastsForPosition, currentPosition, enableStacking);
      // Read-then-overwrite per key: an interrupted render leaves every
      // entry either previous or freshly computed — both valid baselines
      // for the next render's identity comparison. The map is bounded by
      // allPositions (3 entries) and pruned when a position empties.
      const previousEntry = positionsCache.get(currentPosition);
      const nextEntry = {
        position: currentPosition,
        toasts: toastsForPosition,
        orderedToastIds
      };
      const entry = previousEntry && arePositionEntriesEqual(previousEntry, nextEntry) ? previousEntry : nextEntry;
      positionsCache.set(currentPosition, entry);
      data.push(entry);
    }
    return data;
  }, [positionsCache, toasts, position, enableStacking]);
  return /*#__PURE__*/_jsx(ToastContext.Provider, {
    value: value,
    children: /*#__PURE__*/_jsx(DynamicToastContext.Provider, {
      value: dynamicValue,
      children: positionsData.map(({
        position: currentPosition,
        toasts: toastsForPosition,
        orderedToastIds
      }) => {
        return /*#__PURE__*/_jsx(Positioner, {
          style: positionerStyle,
          position: currentPosition,
          children: toastsForPosition.map((toastToRender, index) => {
            // Toast is React.memo'd on shallow prop identity — pass only
            // the props it consumes, explicitly, so nothing object-valued
            // slips in through a rest-spread and silently defeats memo.
            const ToastToRender = /*#__PURE__*/_jsx(Toast, {
              unstyled: unstyled,
              backgroundComponent: backgroundComponent,
              ...toastToRender,
              parentStyle: style,
              parentStyles: styles,
              onDismiss: onDismiss,
              onAutoClose: onAutoClose,
              index: index,
              ref: toastStore.getToastRef(toastToRender.id),
              numberOfToasts: toastsForPosition.length,
              orderedToastIds: orderedToastIds
            }, toastToRender.id);
            if (ToastWrapper) {
              return /*#__PURE__*/_jsx(ToastWrapper, {
                toastId: toastToRender.id,
                children: ToastToRender
              }, toastToRender.id);
            }
            return ToastToRender;
          })
        }, currentPosition);
      })
    })
  });
};
//# sourceMappingURL=toaster.js.map