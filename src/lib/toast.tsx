import { UIService } from "@/core/sdk/ui/UIService";
import { Text } from "react-native";
import { CheckCircle2, XCircle, AlertTriangle, Info, Bell } from "lucide-react-native";
import type { ReactNode } from "react";

type ToastAction = {
  label: string;
  onClick: () => void;
};

interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
}

function makeIcon(icon: ReactNode, color: string) {
  return (
    <Text style={{ color }} className="flex-shrink-0 mt-0.5">
      {icon}
    </Text>
  );
}

export const showToast = {
  success(message: string, opts?: ToastOptions) {
    UIService.openToast(message, "success");
  },

  error(message: string, opts?: ToastOptions) {
    UIService.openToast(message, "error");
  },

  warning(message: string, opts?: ToastOptions) {
    UIService.openToast(message, "warning");
  },

  info(message: string, opts?: ToastOptions) {
    UIService.openToast(message, "info");
  },

  notification(title: string, opts?: ToastOptions) {
    UIService.openToast(title, "info");
  },
};
