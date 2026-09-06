import { Text, View, Pressable } from "react-native";
import { AlertTriangle, Trash2, AlertCircle, Info } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmVariant = "danger" | "warning" | "info";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const VARIANT_CONFIG = {
  danger: {
    icon: Trash2,
    iconBg: "bg-red-500/15",
    iconColor: "text-red-400",
    confirmClass: "bg-red-600 hover:bg-red-700 text-white",
    ringColor: "ring-red-500/20",
  },
  warning: {
    icon: AlertTriangle,
    iconBg: "bg-yellow-500/15",
    iconColor: "text-yellow-400",
    confirmClass: "bg-yellow-600 hover:bg-yellow-700 text-white",
    ringColor: "ring-yellow-500/20",
  },
  info: {
    icon: Info,
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    confirmClass: "bg-blue-600 hover:bg-blue-700 text-white",
    ringColor: "ring-blue-500/20",
  },
} satisfies Record<ConfirmVariant, {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  confirmClass: string;
  ringColor: string;
}>;

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const config = VARIANT_CONFIG[variant];
  const Icon = config.icon;

  return (
    <>
      {open && (
        <>
          {/* Backdrop */}
          <Pressable
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/60"
            onPress={onCancel}
          />

          {/* Dialog */}
          <View
            key="dialog"
            className={cn(
              "fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-sm -translate-x-1/2 -translate-y-1/2",
              "rounded-2xl p-6 shadow-2xl ring-1",
              config.ringColor,
            )}
            style={{ backgroundColor: "rgba(14, 14, 28, 0.96)" }}
          >
            {/* Icon */}
            <View
              className={cn(
                "mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center",
                config.iconBg,
              )}
            >
              <Icon size={26} className={config.iconColor} />
            </View>

            {/* Content */}
            <View className="text-center mb-6">
              <Text className="text-base font-semibold text-white mb-1">{title}</Text>
              {description && (
                <Text className="text-sm text-white/55 leading-relaxed">{description}</Text>
              )}
            </View>

            {/* Actions */}
            <View className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 rounded-xl border border-white/10 text-white/70"
                onPress={onCancel}
                disabled={loading}
              >
                {cancelLabel}
              </Button>
              <Button
                className={cn("flex-1 rounded-xl", config.confirmClass)}
                onPress={onConfirm}
                disabled={loading}
              >
                {loading ? (
                  <Text className="flex items-center gap-2">
                    <Text className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Chargement…
                  </Text>
                ) : confirmLabel}
              </Button>
            </View>
          </View>
        </>
      )}
    </>
  );
}

// Hook for easy usage
import { useState, useCallback } from "react";

interface UseConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
}

export function useConfirm(options: UseConfirmOptions) {
  const [open, setOpen] = useState(false);
  const [resolve, setResolve] = useState<((value: boolean) => void) | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback(() => {
    return new Promise<boolean>((res) => {
      setResolve(() => res);
      setOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    resolve?.(true);
    setLoading(false);
    setOpen(false);
    setResolve(null);
  }, [resolve]);

  const handleCancel = useCallback(() => {
    resolve?.(false);
    setOpen(false);
    setResolve(null);
  }, [resolve]);

  const dialog = (
    <ConfirmDialog
      open={open}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      loading={loading}
      {...options}
    />
  );

  return { confirm, dialog };
}
