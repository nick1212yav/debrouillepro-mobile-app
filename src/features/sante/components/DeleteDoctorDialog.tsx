import { UIService } from "@/core/sdk/ui/UIService";

// src/features/sante/components/DeleteDoctorDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AlertTriangle } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface DeleteDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctorId: Id<"medicalProfessionals">;
  doctorName: string;
  onSuccess?: () => void;
}

export function DeleteDoctorDialog({
  open,
  onOpenChange,
  doctorId,
  doctorName,
  onSuccess,
}: DeleteDoctorDialogProps) {
  const deleteDoctor = useMutation(api.health.deleteProfessional);

  const handleDelete = async () => {
    try {
      await deleteDoctor({ id: doctorId });
      UIService.openToast("Médecin supprimé", "success");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Erreur lors de la suppression";
      UIService.openToast(message, "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        style={{ backgroundColor: "#0d0d20", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="text-red-400" size={20} />
            Confirmer la suppression
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Êtes-vous sûr de vouloir supprimer{" "}
            <strong className="text-white">{doctorName}</strong> ? Cette action
            est irréversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onPress={() => onOpenChange(false)}
            className="border-white/10 text-white/60"
          >
            Annuler
          </Button>
          <Button
            onPress={handleDelete}
            className="bg-red-500 text-white"
          >
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
