import { View, Pressable, Text } from "react-native";

// src/features/sante/components/CreateHealthSheet.tsx
import { useState } from "react";
import {
  X,
  ArrowLeft,
  Stethoscope,
  Hospital,
  Pill,
  Ambulance,
  Microscope,
  Syringe,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// ✅ Importer les formulaires
import { DoctorForm } from "../forms/DoctorForm";
import { HospitalForm } from "../forms/HospitalForm";
import { ClinicForm } from "../forms/ClinicForm";
import { PharmacyForm } from "../forms/PharmacyForm";
import { LaboratoryForm } from "../forms/LaboratoryForm";
import { AmbulanceForm } from "../forms/AmbulanceForm";
import { VaccinationForm } from "../forms/VaccinationForm";

interface CreateHealthSheetProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type HealthTab =
  | "doctor"
  | "hospital"
  | "clinic"
  | "pharmacy"
  | "laboratory"
  | "ambulance"
  | "vaccination";

const TABS: {
  id: HealthTab;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "doctor", label: "Médecin", icon: Stethoscope },
  { id: "hospital", label: "Hôpital", icon: Hospital },
  { id: "clinic", label: "Clinique", icon: Hospital },
  { id: "pharmacy", label: "Pharmacie", icon: Pill },
  { id: "laboratory", label: "Laboratoire", icon: Microscope },
  { id: "ambulance", label: "Ambulance", icon: Ambulance },
  { id: "vaccination", label: "Vaccination", icon: Syringe },
];

export function CreateHealthSheet({
  onClose,
  onSuccess,
}: CreateHealthSheetProps) {
  const [activeTab, setActiveTab] = useState<HealthTab>("doctor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Utiliser la mutation générique createPublication
  const createPublication = useMutation(api.publications.createPublication);

  // Gestionnaire de soumission pour tous les types
  const handleSubmit = async (data: any, label: string) => {
    setIsSubmitting(true);
    try {
      // Construire les métadonnées pour le type "sante"
      const meta = {
        ...data,
        entityType: activeTab, // "doctor", "hospital", etc.
        // Ajouter ici d'autres champs nécessaires
      };

      await createPublication({
        type: "sante", // Le type de publication
        title: data.name || data.title || `${label} non nommé`,
        description: data.bio || data.description || "",
        price: data.fees ? String(data.fees) : undefined,
        location: data.address ? `${data.address}, ${data.city}` : undefined,
        category: data.specialty || data.category || activeTab,
        tags: [activeTab, data.specialty].filter(Boolean),
        images: data.images || [],
        meta: JSON.stringify(meta),
      });

      toast.success(`${label} créé avec succès !`);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(`Erreur lors de la création du ${label}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex flex-col gap-4">{}<View className="flex items-center gap-3 flex-shrink-0"><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><ArrowLeft size={16} className="text-white" /></Pressable><Text className="text-white font-bold text-base flex-1">Santé</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={16} className="text-white/60" /></Pressable></View>{}<View className="flex flex-wrap gap-2 flex-shrink-0">{TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all cursor-pointer",
                isActive
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10",
              )}><Icon size={16} />{tab.label}</Pressable>
          );
        })}</View>{}<View className="flex-1"><View><View key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>{activeTab === "doctor" && (
              <DoctorForm
                onSubmit={(data) => handleSubmit(data, "médecin")}
                submitLabel="Créer le médecin"
                isLoading={isSubmitting}
              />
            )}{activeTab === "hospital" && (
              <HospitalForm
                onSubmit={(data) => handleSubmit(data, "hôpital")}
                submitLabel="Créer l'hôpital"
                isLoading={isSubmitting}
              />
            )}{activeTab === "clinic" && (
              <ClinicForm
                onSubmit={(data) => handleSubmit(data, "clinique")}
                submitLabel="Créer la clinique"
                isLoading={isSubmitting}
              />
            )}{activeTab === "pharmacy" && (
              <PharmacyForm
                onSubmit={(data) => handleSubmit(data, "pharmacie")}
                submitLabel="Créer la pharmacie"
                isLoading={isSubmitting}
              />
            )}{activeTab === "laboratory" && (
              <LaboratoryForm
                onSubmit={(data) => handleSubmit(data, "laboratoire")}
                submitLabel="Créer le laboratoire"
                isLoading={isSubmitting}
              />
            )}{activeTab === "ambulance" && (
              <AmbulanceForm
                onSubmit={(data) => handleSubmit(data, "ambulance")}
                submitLabel="Créer l'ambulance"
                isLoading={isSubmitting}
              />
            )}{activeTab === "vaccination" && (
              <VaccinationForm
                onSubmit={(data) => handleSubmit(data, "vaccination")}
                submitLabel="Créer la vaccination"
                isLoading={isSubmitting}
              />
            )}</View></View></View></View>
  );
}
