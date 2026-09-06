"use strict";

import * as React from 'react';
export const ToastContext = /*#__PURE__*/React.createContext(null);
export const DynamicToastContext = /*#__PURE__*/React.createContext(null);
export const useToastContext = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};
export const useDynamicToastContext = () => {
  const context = React.useContext(DynamicToastContext);
  if (!context) {
    throw new Error('useDynamicToastContext must be used within a ToastProvider');
  }
  return context;
};
//# sourceMappingURL=context.js.map