import { View, Text, Pressable, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

// src/features/profile/components/EditProfileSheet.tsx

import { useState, useEffect, useRef } from "react";
import { X, Save, Camera } from "lucide-react-native";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import UserAvatar from "@/components/ui/user-avatar.tsx";

interface EditProfileSheetProps {
  onClose: () => void;
  accentHex: string;
}

export function EditProfileSheet({
  onClose,
  accentHex,
}: EditProfileSheetProps) {
  const user = useCurrentUser();
  const { user: firebaseUser } = useFirebaseAuth();
  const email = firebaseUser?.email;
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUserAvatarUploadUrl);
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setBio(user.bio ?? "");
    }
  }, [user?._id]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!email) {
      toast.error("Utilisateur non connecté");
      return;
    }

    // Validation simple du type de fichier
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image");
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Téléversement de l'image...");

    try {
      // 1. Obtenir l'URL de téléversement sécurisée
      const uploadUrl = await generateUploadUrl();

      // 2. Envoyer le fichier image à cette URL
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!result.ok) throw new Error("Erreur de téléversement");

      // 3. Récupérer le storageId généré par Convex
      const { storageId } = await result.json();

      // 4. Mettre à jour l'avatar de l'utilisateur avec ce storageId
      await updateProfile({
        email,
        storageId,
      });

      toast.success("Photo de profil mise à jour !", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de téléverser l'image", { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }
    if (!email) {
      toast.error("Utilisateur non connecté");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        email,
        name: name.trim(),
        bio: bio.trim(),
      });
      toast.success("Profil mis à jour !");
      onClose();
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.75)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full rounded-t-3xl flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
        <View className="flex justify-center pt-3 pb-1"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

        <View className="flex items-center justify-between px-5 py-3" style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}><Text className="text-white font-black text-lg">Modifier le profil</Text><Pressable onPress={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}><X size={15} className="text-white/60" /></Pressable></View>

        <View className="px-5 py-5 flex flex-col gap-4">{}<View className="flex items-center gap-4"><View onPress={handleAvatarClick} className="relative group rounded-full overflow-hidden" style={{ opacity: uploading ? 0.6 : 1 }}><UserAvatar user={user} size="w-16 h-16" /><View className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity"><Camera size={18} className="text-white" /></View></View><TextInput ref={fileInputRef} onChangeText={handleFileChange} className="hidden" /><View><Text className="text-sm font-bold text-white">{getDisplayName(user)}</Text><Text className="text-xs text-white/40 mt-0.5">Cliquez sur la photo pour la remplacer
              </Text></View></View><View><Text className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Nom affiché
            </Text><TextInput value={name} onChangeText={(value) => setName(value)} placeholder="Votre nom" maxLength={60} className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} /></View><View><Text className="text-xs font-bold text-white/50 uppercase tracking-wider mb-1.5 block">Bio
            </Text><TextInput value={bio} onChangeText={(value) => setBio(value)} placeholder="Parlez de vous en quelques mots..." maxLength={160} className="w-full px-4 py-3 rounded-2xl text-sm text-white outline-none" style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", borderStyle: "solid" }} multiline textAlignVertical="top" /><Text className="text-xs text-white/25 text-right mt-1">{bio.length}/160
            </Text></View><Pressable onPress={() => void handleSave()} disabled={saving || uploading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold active:scale-95 transition-all disabled:opacity-50" style={{  }}>{saving ? (
              "Enregistrement..."
            ) : (
              <>
                <Save size={15} /> Enregistrer
              </>
            )}</Pressable></View>
      </View>
    </View>
  );
}
