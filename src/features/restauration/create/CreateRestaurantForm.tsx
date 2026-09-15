import { View } from "react-native";

// src/features/restauration/create/CreateRestaurantForm.tsx
import { useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react-native";
import { StepIndicator } from "./shared/StepIndicator";
import { StepNavigation } from "./shared/StepNavigation";

// Import des étapes
import { RestaurantIdentityStep } from "./steps/RestaurantIdentityStep";
import { RestaurantMediaStep } from "./steps/RestaurantMediaStep";
import { RestaurantLocationStep } from "./steps/RestaurantLocationStep";
import { RestaurantExperienceStep } from "./steps/RestaurantExperienceStep";
import { RestaurantDeliveryStep } from "./steps/RestaurantDeliveryStep";
import { RestaurantPreviewStep } from "./steps/RestaurantPreviewStep";

interface CreateRestaurantFormProps {
  onSubmit: (data: any) => Promise<boolean>;
  isLoading?: boolean;
}

export function CreateRestaurantForm({
  onSubmit,
  isLoading = false,
}: CreateRestaurantFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    cuisine: "",
    location: "",
    priceRange: "",
    deliveryTime: "",
    description: "",
    tags: [],
    images: [],
    openingHours: {},
    deliveryAreas: [],
    hasDelivery: true,
    hasTakeaway: true,
    hasDineIn: true,
    hasReservation: false,
  });

  const totalSteps = 6;

  const updateField = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const nextStep = useCallback(() => {
    if (step < totalSteps) setStep(step + 1);
  }, [step]);

  const prevStep = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const handleSubmit = useCallback(async () => {
    await onSubmit(formData);
  }, [onSubmit, formData]);

  const steps = [
    { id: 1, label: "Identité", icon: "🏷️" },
    { id: 2, label: "Photos", icon: "📸" },
    { id: 3, label: "Localisation", icon: "📍" },
    { id: 4, label: "Expérience", icon: "🍽️" },
    { id: 5, label: "Livraison", icon: "🚚" },
    { id: 6, label: "Aperçu", icon: "✨" },
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <RestaurantIdentityStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <RestaurantMediaStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <RestaurantLocationStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 4:
        return (
          <RestaurantExperienceStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 5:
        return (
          <RestaurantDeliveryStep
            data={formData}
            onChange={updateField}
            onNext={nextStep}
            onBack={prevStep}
          />
        );
      case 6:
        return (
          <RestaurantPreviewStep
            data={formData}
            onSubmit={handleSubmit}
            onBack={prevStep}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View className="flex flex-col"><StepIndicator steps={steps} currentStep={step} /><View className="mt-6"><View><View key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>{renderStep()}</View></View></View></View>
  );
}
