"use strict";

import { CLOSE_BUTTON_HIT_AREA } from "./constants.js";

/**
 * Checks if a press event occurred near the close button area.
 * The x coordinate is relative to the gesture handler view.
 */
export const isPressNearCloseButton = ({
  x,
  viewWidth
}) => {
  return x > viewWidth - CLOSE_BUTTON_HIT_AREA;
};
//# sourceMappingURL=press-utils.js.map