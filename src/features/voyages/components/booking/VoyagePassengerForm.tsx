import { View, Text, NativeSyntheticEvent, Pressable } from "react-native";

// src/features/voyages/components/booking/VoyagePassengerForm.tsx
import { useState } from "react";
import { User, Mail, Phone, MapPin, Loader2 } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PassengerData {
  name: string;
  email: string;
  phone: string;
  city?: string;
}

interface VoyagePassengerFormProps {
  onSubmit: (data: PassengerData) => void;
  isLoading?: boolean;
}

export function VoyagePassengerForm({
  onSubmit,
  isLoading = false,
}: VoyagePassengerFormProps) {
  const [form, setForm] = useState<PassengerData>({
    name: "",
    email: "",
    phone: "",
    city: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof PassengerData, string>>
  >({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PassengerData, string>> = {};
    if (!form.name.trim()) newErrors.name = "Nom requis";
    if (!form.email.trim()) newErrors.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Email invalide";
    if (!form.phone.trim()) newErrors.phone = "Téléphone requis";
    if (form.phone.length < 8) newErrors.phone = "Téléphone trop court";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(form);
    }
  };

  return (
    <View className="space-y-4"><View className="space-y-1.5"><Label htmlFor="name" className="text-white/70 text-xs uppercase tracking-wider">Nom complet *
        </Label><View className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><Input id="name" type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Votre nom" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25" disabled={isLoading} /></View>{errors.name && <Text className="text-red-400 text-xs">{errors.name}</Text>}</View><View className="space-y-1.5"><Label htmlFor="email" className="text-white/70 text-xs uppercase tracking-wider">Email *
        </Label><View className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><Input id="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="votre@email.com" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25" disabled={isLoading} /></View>{errors.email && <Text className="text-red-400 text-xs">{errors.email}</Text>}</View><View className="space-y-1.5"><Label htmlFor="phone" className="text-white/70 text-xs uppercase tracking-wider">Téléphone *
        </Label><View className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><Input id="phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+243 99 123 4567" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25" disabled={isLoading} /></View>{errors.phone && <Text className="text-red-400 text-xs">{errors.phone}</Text>}</View><View className="space-y-1.5"><Label htmlFor="city" className="text-white/70 text-xs uppercase tracking-wider">Ville de départ (optionnel)
        </Label><View className="relative"><MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" /><Input id="city" type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} placeholder="Votre ville" className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/25" disabled={isLoading} /></View></View><Pressable disabled={isLoading} className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-500 transition disabled:opacity-50 flex items-center justify-center gap-2">{isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Continuer"
        )}</Pressable></View>
  );
}
