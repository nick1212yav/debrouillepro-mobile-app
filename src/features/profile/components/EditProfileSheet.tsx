// src/features/profile/components/EditProfileSheet.tsx

import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Camera, Save, X } from "lucide-react-native";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import UserAvatar from "@/components/ui/user-avatar";

interface EditProfileSheetProps {
  onClose: () => void;
  accentHex: string;
}

function showError(message: string) {
  Alert.alert("Erreur", message);
}

function showSuccess(message: string) {
  Alert.alert("Succès", message);
}

export function EditProfileSheet({
  onClose,
  accentHex,
}: EditProfileSheetProps) {
  const user = useCurrentUser();
  const { user: firebaseUser } = useFirebaseAuth();

  const email = firebaseUser?.email ?? undefined;

  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.users.generateUserAvatarUploadUrl);

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  /*
   * Prévu pour le branchement du picker natif.
   *
   * Sur React Native, <input type="file"> et useRef<HTMLInputElement>
   * ne sont pas disponibles. La sélection d'image doit passer par
   * expo-image-picker.
   */
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name ?? "");
    setBio(user.bio ?? "");
  }, [user?._id, user?.name, user?.bio]);

  const handleAvatarPress = async () => {
    if (uploading) {
      return;
    }

    Alert.alert(
      "Modifier la photo",
      "La sélection native de photo sera branchée avec expo-image-picker.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Compris",
          style: "default",
        },
      ],
    );
  };

  /*
   * Cette fonction est prête pour recevoir un URI natif provenant de
   * expo-image-picker ou expo-document-picker.
   *
   * Elle conserve le flux Convex existant :
   *
   * 1. generate upload URL
   * 2. POST du fichier vers Convex Storage
   * 3. récupération du storageId
   * 4. updateProfile
   */
  const uploadAvatar = async (
    uri: string,
    mimeType = "image/jpeg",
  ): Promise<void> => {
    if (!email) {
      showError("Utilisateur non connecté");
      return;
    }

    setUploading(true);

    try {
      const uploadUrl = await generateUploadUrl();

      const response = await fetch(uri);

      if (!response.ok) {
        throw new Error("Impossible de lire l'image sélectionnée");
      }

      const blob = await response.blob();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": mimeType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors du téléversement");
      }

      const result = (await uploadResponse.json()) as {
        storageId?: string;
      };

      if (!result.storageId) {
        throw new Error(
          "Le serveur n'a pas retourné d'identifiant de stockage",
        );
      }

      await updateProfile({
        email,
        storageId: result.storageId,
      });

      if (isMountedRef.current) {
        showSuccess("Photo de profil mise à jour !");
      }
    } catch (error) {
      console.error(
        "[EditProfileSheet] Impossible de téléverser l'image:",
        error,
      );

      if (isMountedRef.current) {
        showError("Impossible de téléverser l'image");
      }
    } finally {
      if (isMountedRef.current) {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    const normalizedName = name.trim();
    const normalizedBio = bio.trim();

    if (!normalizedName) {
      showError("Le nom ne peut pas être vide");
      return;
    }

    if (!email) {
      showError("Utilisateur non connecté");
      return;
    }

    if (saving || uploading) {
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        email,
        name: normalizedName,
        bio: normalizedBio,
      });

      if (!isMountedRef.current) {
        return;
      }

      showSuccess("Profil mis à jour !");
      onClose();
    } catch (error) {
      console.error("[EditProfileSheet] Erreur lors de la mise à jour:", error);

      if (isMountedRef.current) {
        showError("Erreur lors de la mise à jour du profil");
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/75">
        {/* Overlay */}
        <Pressable
          className="absolute inset-0"
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer la modification du profil"
        />

        {/* Bottom Sheet */}
        <View
          className="w-full overflow-hidden rounded-t-[32px] border border-white/10 bg-[#0A0A1A]"
          style={{
            maxHeight: "92%",
          }}
        >
          {/* Handle */}
          <View className="items-center pb-1 pt-3">
            <View className="h-1 w-10 rounded-full bg-white/20" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <Text className="text-lg font-black text-white">
              Modifier le profil
            </Text>

            <Pressable
              onPress={onClose}
              disabled={saving || uploading}
              className="h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08] active:bg-white/[0.15] disabled:opacity-50"
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={17} color="rgba(255,255,255,0.65)" />
            </Pressable>
          </View>

          <View className="gap-5 px-5 py-5">
            {/* ======================================================== */}
            {/* AVATAR                                                   */}
            {/* ======================================================== */}

            <View className="flex-row items-center gap-4">
              <Pressable
                onPress={() => {
                  void handleAvatarPress();
                }}
                disabled={uploading || saving}
                className="relative h-16 w-16 overflow-hidden rounded-full"
                accessibilityRole="button"
                accessibilityLabel="Modifier la photo de profil"
              >
                <UserAvatar user={user} size="w-16 h-16" />

                <View className="absolute inset-0 items-center justify-center bg-black/45">
                  {uploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Camera size={19} color="#FFFFFF" />
                  )}
                </View>
              </Pressable>

              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-white"
                >
                  {getDisplayName(user)}
                </Text>

                <Text className="mt-1 text-xs text-white/40">
                  Appuyez sur la photo pour la remplacer
                </Text>
              </View>
            </View>

            {/* ======================================================== */}
            {/* NAME                                                     */}
            {/* ======================================================== */}

            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Nom affiché
              </Text>

              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Votre nom"
                placeholderTextColor="rgba(255,255,255,0.28)"
                maxLength={60}
                editable={!saving && !uploading}
                className="rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 py-3 text-sm text-white"
                style={{
                  color: "#FFFFFF",
                }}
              />

              <Text className="mt-1.5 text-right text-[10px] text-white/25">
                {name.length}/60
              </Text>
            </View>

            {/* ======================================================== */}
            {/* BIO                                                      */}
            {/* ======================================================== */}

            <View>
              <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                Bio
              </Text>

              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Parlez de vous en quelques mots..."
                placeholderTextColor="rgba(255,255,255,0.28)"
                maxLength={160}
                multiline
                textAlignVertical="top"
                editable={!saving && !uploading}
                className="min-h-[100px] rounded-2xl border border-white/[0.12] bg-white/[0.07] px-4 py-3 text-sm text-white"
                style={{
                  color: "#FFFFFF",
                }}
              />

              <Text className="mt-1.5 text-right text-xs text-white/25">
                {bio.length}/160
              </Text>
            </View>

            {/* ======================================================== */}
            {/* SAVE                                                      */}
            {/* ======================================================== */}

            <Pressable
              onPress={() => {
                void handleSave();
              }}
              disabled={saving || uploading}
              className="mt-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 active:opacity-85 disabled:opacity-50"
              style={{
                backgroundColor: accentHex,
              }}
              accessibilityRole="button"
              accessibilityLabel="Enregistrer le profil"
            >
              {saving ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />

                  <Text className="text-sm font-bold text-white">
                    Enregistrement...
                  </Text>
                </>
              ) : uploading ? (
                <>
                  <ActivityIndicator color="#FFFFFF" size="small" />

                  <Text className="text-sm font-bold text-white">
                    Téléversement...
                  </Text>
                </>
              ) : (
                <>
                  <Save size={17} color="#FFFFFF" />

                  <Text className="text-sm font-bold text-white">
                    Enregistrer
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default EditProfileSheet;
