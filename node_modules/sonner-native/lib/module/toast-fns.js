"use strict";

import { toastStore } from "./toast-store.js";
export const toast = (title, options) => {
  return toastStore.addToast({
    title,
    variant: 'info',
    ...options
  });
};
toast.success = (title, options = {}) => {
  return toastStore.addToast({
    ...options,
    title,
    variant: 'success'
  });
};
toast.wiggle = id => {
  return toastStore.wiggleToast(id);
};
toast.error = (title, options = {}) => {
  return toastStore.addToast({
    ...options,
    title,
    variant: 'error'
  });
};
toast.warning = (title, options = {}) => {
  return toastStore.addToast({
    ...options,
    title,
    variant: 'warning'
  });
};
toast.info = (title, options = {}) => {
  return toastStore.addToast({
    title,
    ...options,
    variant: 'info'
  });
};
toast.promise = (promise, options) => {
  const {
    loading,
    success,
    error,
    ...restOptions
  } = options;
  return toastStore.addToast({
    ...restOptions,
    title: loading,
    variant: 'info',
    styles: options.styles?.loading,
    promiseOptions: {
      promise: promise,
      loading,
      success: success,
      error,
      styles: options.styles
    }
  });
};
toast.custom = (jsx, options) => {
  return toastStore.addToast({
    title: '',
    variant: 'info',
    jsx,
    ...options
  });
};
toast.loading = (title, options = {}) => {
  return toastStore.addToast({
    title,
    variant: 'loading',
    ...options
  });
};
toast.dismiss = id => {
  return toastStore.dismissToast(id);
};
//# sourceMappingURL=toast-fns.js.map