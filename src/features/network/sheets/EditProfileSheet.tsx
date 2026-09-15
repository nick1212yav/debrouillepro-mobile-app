import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/EditProfileSheet.tsx
import { useState, useEffect } from "react";
import { X, Save, ShieldCheck } from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

interface EditProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  profile: {
    name?: string;
    headline?: string;
    bio?: string;
    city?: string;
    country?: string;
    roles?: string[];
    interests?: string[];
    avatar?: string | null;
    cover?: string | null;
  };
}

export function EditProfileSheet({
  isOpen,
  onClose,
  onSuccess,
  profile,
}: EditProfileSheetProps) {
  const { user: firebaseUser } = useFirebaseAuth();

  const [form, setForm] = useState({
    name: profile.name || "",
    headline: profile.headline || "",
    bio: profile.bio || "",
    city: profile.city || "",
    country: profile.country || "",
    roles: profile.roles || [],
    interests: profile.interests || [],
  });

  const [newInterest, setNewInterest] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const updateProfile = useMutation(api.network.updateProfile); // ✅ Pointera vers votre api de réseau unifiée

  useEffect(() => {
    if (isOpen) {
      setForm({
        name: profile.name || "",
        headline: profile.headline || "",
        bio: profile.bio || "",
        city: profile.city || "",
        country: profile.country || "",
        roles: profile.roles || [],
        interests: profile.interests || [],
      });
    }
  }, [isOpen, profile]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !form.interests.includes(trimmed)) {
      setForm((prev) => ({
        ...prev,
        interests: [...prev.interests, trimmed],
      }));
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setForm((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }));
  };

  const handleAddRole = (role: string) => {
    if (!form.roles.includes(role)) {
      setForm((prev) => ({
        ...prev,
        roles: [...prev.roles, role],
      }));
    }
  };

  const handleRemoveRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r !== role),
    }));
  };

  const handleSubmit = async () => {
    if (!firebaseUser) {
      toast.error("Vous devez être connecté");
      return;
    }

    setIsSaving(true);
    try {
      // ✅ Correction : Transtypé 'as any' et retrait de l'argument d'email résolu côté serveur [1]
      await updateProfile({
        name: form.name,
        headline: form.headline,
        bio: form.bio,
        city: form.city,
        country: form.country,
        roles: form.roles,
        interests: form.interests,
        avatar: profile.avatar || undefined,
        cover: profile.cover || undefined,
      } as any);

      toast.success("Profil mis à jour");
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setIsSaving(false);
    }
  };

  const roleOptions = [
    { value: "particulier", label: "Particulier" },
    { value: "professionnel", label: "Professionnel" },
    { value: "entreprise", label: "Entreprise" },
    { value: "artisan", label: "Artisan" },
    { value: "recruteur", label: "Recruteur" },
    { value: "etudiant", label: "Étudiant" },
    { value: "enseignant", label: "Enseignant" },
    { value: "fonctionnaire", label: "Fonctionnaire" },
    { value: "entrepreneur", label: "Entrepreneur" },
    { value: "freelance", label: "Freelance" },
    { value: "independant", label: "Indépendant" },
    { value: "autre", label: "Autre" },
  ];

  return (
<View>
      {isOpen && (
        <>
          <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onPress={onClose} className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
          <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(100vh - 40px)" }}>
            {/* Handle */}
            <View className="flex justify-center pt-3 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

            {/* Header */}
            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5"><Text className="text-white font-bold text-lg">Modifier le profil
              </Text><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable></View>

            {/* Content */}
            <View className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "calc(100vh - 40px - 140px)" }}><View className="space-y-4">{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Nom complet
                  </Text><TextInput value={form.name} onChangeText={(value) => handleChange("name", value)} placeholder="Votre nom" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Titre professionnel
                  </Text><TextInput value={form.headline} onChangeText={(value) => handleChange("headline", value)} placeholder="Ex: Développeur Full Stack" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Bio
                  </Text><TextInput value={form.bio} onChangeText={(value) => handleChange("bio", value)} placeholder="Parlez de vous..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" multiline textAlignVertical="top" /></View>{}<View className="gap-3"><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Ville
                    </Text><TextInput value={form.city} onChangeText={(value) => handleChange("city", value)} placeholder="Ville" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Pays
                    </Text><TextInput value={form.country} onChangeText={(value) => handleChange("country", value)} placeholder="Pays" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Rôles
                  </Text><View className="flex flex-wrap gap-2 mb-2">{form.roles.map((role) => (
                      <Text key={role} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/20">{roleOptions.find((r) => r.value === role)?.label ||
                          role}<Pressable onPress={() => handleRemoveRole(role)} className="transition"><X size={12} /></Pressable></Text>
                    ))}</View><View className="flex flex-wrap gap-1.5">{roleOptions
                      .filter((r) => !form.roles.includes(r.value))
                      .slice(0, 8)
                      .map((role) => (
                        <Pressable key={role.value} onPress={() => handleAddRole(role.value)} className="px-3 py-1 rounded-full text-xs font-medium text-white/50 bg-white/5 border border-white/10 transition">{role.label}</Pressable>
                      ))}</View></View>{}<View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Compétences
                  </Text><View className="flex flex-wrap gap-2 mb-2">{form.interests.map((interest) => (
                      <Text key={interest} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">{interest}<Pressable onPress={() => handleRemoveInterest(interest)} className="transition"><X size={12} /></Pressable></Text>
                    ))}</View><View className="flex gap-2"><TextInput value={newInterest} onChangeText={(value) => setNewInterest(value)} onKeyPress={(e) =>
                        e.nativeEvent.key === "Enter" && handleAddInterest()} placeholder="Ajouter une compétence..." className="flex-1 rounded-2xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /><Pressable onPress={handleAddInterest} className="px-4 py-2.5 rounded-2xl text-sm font-semibold text-white bg-emerald-500/20 border border-emerald-500/30 transition animate-fadeIn">Ajouter
                    </Pressable></View></View></View></View>

            {/* Footer */}
            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable onPress={onClose} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 transition">
                Annuler
              </Pressable>
              <Pressable onPress={handleSubmit} disabled={isSaving} className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 transition disabled:opacity-50">
                {isSaving ? (
                  <View className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Save size={16} />
                    Enregistrer
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
