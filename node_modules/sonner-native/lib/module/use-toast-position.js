"use strict";

import { useMemo } from 'react';
import { useDerivedValue, withTiming } from 'react-native-reanimated';
import { STACKING_ANIMATION_DURATION } from "./animations.js";
import { easeOutQuartFn } from "./easings.js";
import { calculateToastPosition } from "./position-utils.js";
export const useToastPosition = ({
  id,
  index,
  numberOfToasts,
  enableStacking,
  position,
  allToastHeights,
  gap,
  orderedToastIds,
  isExpanded,
  stackGap,
  toastHeightsVersion
}) => {
  const orderedIdsKey = useMemo(() => orderedToastIds.join(','), [orderedToastIds]);
  const yPosition = useDerivedValue(() => {
    'worklet';

    const calculatedPosition = calculateToastPosition({
      index,
      numberOfToasts,
      enableStacking,
      position,
      allToastHeights,
      gap,
      orderedToastIds,
      isExpanded,
      stackGap
    });
    return withTiming(calculatedPosition, {
      duration: STACKING_ANIMATION_DURATION,
      easing: easeOutQuartFn
    });
  }, [id, index, numberOfToasts, enableStacking, position, toastHeightsVersion, gap, orderedIdsKey, isExpanded, stackGap]);
  return yPosition;
};
//# sourceMappingURL=use-toast-position.js.map