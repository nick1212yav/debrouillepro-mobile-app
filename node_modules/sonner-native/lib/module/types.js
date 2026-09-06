"use strict";

export function isToastAction(action) {
  return action?.onClick !== undefined && action?.label !== undefined;
}

/** @deprecated Use StableToastContextType & DynamicToastContextType */
//# sourceMappingURL=types.js.map