import { UIService } from "@/core/sdk/ui/UIService";

type ToastMessage = unknown;

function toToastMessage(message: ToastMessage): string {
  if (typeof message === "string") {
    return message;
  }

  if (
    typeof message === "number" ||
    typeof message === "boolean" ||
    typeof message === "bigint"
  ) {
    return String(message);
  }

  if (message == null) {
    return "";
  }

  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

type ToastOptions = Record<string, unknown> | undefined;

function openToast(
  message: ToastMessage,
  type: "info" | "success" | "error" | "warning",
  _options?: ToastOptions,
): void {
  UIService.openToast(toToastMessage(message), type);
}

export const toast = Object.assign(
  (message: ToastMessage, options?: ToastOptions): void => {
    openToast(message, "info", options);
  },
  {
    success: (message: ToastMessage, options?: ToastOptions): void => {
      openToast(message, "success", options);
    },
    error: (message: ToastMessage, options?: ToastOptions): void => {
      openToast(message, "error", options);
    },
    info: (message: ToastMessage, options?: ToastOptions): void => {
      openToast(message, "info", options);
    },
    warning: (message: ToastMessage, options?: ToastOptions): void => {
      openToast(message, "warning", options);
    },
    loading: (message: ToastMessage, options?: ToastOptions): void => {
      openToast(message, "info", options);
    },
    dismiss: (_toastId?: unknown): void => {
      // Native toast lifecycle is managed by UIService/UIBridge.
    },
  },
);

export function Toaster(_props: Record<string, unknown> = {}): null {
  // Toast rendering is provided by the native UI bridge.
  return null;
}
