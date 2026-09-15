// src/lib/toast.tsx
/**
 * Enriched toast helpers wrapping sonner-native with icons, colors,
 * and inline actions.
 *
 * Usage: import { showToast } from "@/lib/toast";
 *
 * ⚠️ V8.5 : `sonner` (web) remplacé par `sonner-native` — API identique
 *           (à l'exception de la prop `onPress` dans les actions qui reste
 *            `onClick`, comme dans sonner original).
 */
import { toast } from "sonner-native";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
} from "lucide-react-native";

type ToastAction = {
  label: string;
  onClick: () => void;
};

interface ToastOptions {
  description?: string;
  action?: ToastAction;
  duration?: number;
}

export const showToast = {
  success(message: string, opts?: ToastOptions) {
    toast.success(message, {
      description: opts?.description,
      duration: opts?.duration ?? 3500,
      icon: <CheckCircle2 size={18} color="#4ade80" />,
      action: opts?.action
        ? { label: opts.action.label, onClick: opts.action.onClick }
        : undefined,
    });
  },

  error(message: string, opts?: ToastOptions) {
    toast.error(message, {
      description: opts?.description,
      duration: opts?.duration ?? 5000,
      icon: <XCircle size={18} color="#f87171" />,
      action: opts?.action
        ? { label: opts.action.label, onClick: opts.action.onClick }
        : undefined,
    });
  },

  warning(message: string, opts?: ToastOptions) {
    toast.warning(message, {
      description: opts?.description,
      duration: opts?.duration ?? 4000,
      icon: <AlertTriangle size={18} color="#facc15" />,
      action: opts?.action
        ? { label: opts.action.label, onClick: opts.action.onClick }
        : undefined,
    });
  },

  info(message: string, opts?: ToastOptions) {
    toast.info(message, {
      description: opts?.description,
      duration: opts?.duration ?? 3500,
      icon: <Info size={18} color="#60a5fa" />,
      action: opts?.action
        ? { label: opts.action.label, onClick: opts.action.onClick }
        : undefined,
    });
  },

  notification(title: string, opts?: ToastOptions) {
    toast(title, {
      description: opts?.description,
      duration: opts?.duration ?? 4000,
      icon: <Bell size={18} color="#a78bfa" />,
      action: opts?.action
        ? { label: opts.action.label, onClick: opts.action.onClick }
        : undefined,
    });
  },
};
