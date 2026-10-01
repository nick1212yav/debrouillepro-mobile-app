import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Camera, Check, ImagePlus, Trash2, X } from "lucide-react-native";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel.js";
import { api } from "@/convex/_generated/api.js";
import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user.ts";
import { UserAvatar } from "@/components/ui/user-avatar.tsx";

interface EditProfileSheetProps {
  onClose: () => void;
  accentHex: string;
}

interface UploadResponse {
  storageId: Id<"_storage">;
}

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 160;
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

function isSupportedImageType(mimeType: string | null | undefined): boolean {
  if (!mimeType) {
    return false;
  }

  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "image/heic" ||
    mimeType === "image/heif"
  );
}

function isValidUploadResponse(value: unknown): value is UploadResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.storageId === "string" && record.storageId.length > 0;
}

function validatePickedAsset(
  asset: ImagePicker.ImagePickerAsset,
): string | null {
  const mimeType = asset.mimeType ?? "image/jpeg";

  if (!isSupportedImageType(mimeType)) {
    return "Format non pris en charge. Utilisez JPG, PNG ou WebP.";
  }

  if (asset.fileSize !== undefined && asset.fileSize > MAX_IMAGE_SIZE_BYTES) {
    return "L'image ne doit pas dépasser 10 Mo.";
  }

  return null;
}

async function uploadAssetToStorage(
  uri: string,
  mimeType: string,
  generateUploadUrl: () => Promise<string>,
): Promise<Id<"_storage">> {
  const uploadUrl = await generateUploadUrl();

  const fileResponse = await fetch(uri);
  const blob = await fileResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": mimeType,
    },
    body: blob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Échec du téléversement (${uploadResponse.status}).`);
  }

  const payload: unknown = await uploadResponse.json();

  if (!isValidUploadResponse(payload)) {
    throw new Error("Réponse Storage invalide.");
  }

  return payload.storageId;
}

export function EditProfileSheet({
  onClose,
  accentHex,
}: EditProfileSheetProps) {
  const user = useCurrentUser();

  const updateProfile = useMutation(api.users.updateProfile);
  const generateAvatarUrl = useMutation(api.users.generateUserAvatarUploadUrl);
  const generateCoverUrl = useMutation(api.users.generateUserCoverUploadUrl);
  const updateAvatar = useMutation(api.users.updateAvatar);
  const updateCover = useMutation(api.users.updateCover);
  const removeAvatar = useMutation(api.users.removeAvatar);
  const removeCover = useMutation(api.users.removeCover);

  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | null>(null);
  const [coverPreviewUri, setCoverPreviewUri] = useState<string | null>(null);

  const busy = saving || uploadingAvatar || uploadingCover;

  useEffect(() => {
    if (!user) {
      return;
    }

    setName(user.name ?? "");
    setBio(user.bio ?? "");
  }, [user]);

  const handleClose = () => {
    if (busy) {
      return;
    }

    onClose();
  };

  const currentCoverUri =
    coverPreviewUri ?? (user as { coverUrl?: string | null })?.coverUrl ?? null;

  const currentAvatarUri = avatarPreviewUri ?? user?.avatar ?? null;

  const pickImage = async (
    aspect: [number, number],
  ): Promise<ImagePicker.ImagePickerAsset | null> => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error(
        "L'accès aux photos est nécessaire pour modifier votre image.",
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect,
      quality: 0.9,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const validationError = validatePickedAsset(asset);

    if (validationError) {
      toast.error(validationError);
      return null;
    }

    return asset;
  };

  const handleAvatarPick = async () => {
    if (busy) {
      return;
    }

    try {
      const asset = await pickImage([1, 1]);

      if (!asset) {
        return;
      }

      setAvatarPreviewUri(asset.uri);
      setUploadingAvatar(true);

      const toastId = toast.loading("Téléversement de la photo…");

      try {
        const mimeType = asset.mimeType ?? "image/jpeg";

        const storageId = await uploadAssetToStorage(asset.uri, mimeType, () =>
          generateAvatarUrl({}),
        );

        await updateAvatar({ storageId });

        toast.dismiss(toastId);
        toast.success("Photo de profil mise à jour.");
      } catch (error) {
        toast.dismiss(toastId);
        console.error("EditProfileSheet.avatar:", error);
        setAvatarPreviewUri(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la photo.",
        );
      } finally {
        setUploadingAvatar(false);
      }
    } catch (error) {
      console.error("EditProfileSheet.avatarPicker:", error);
      toast.error("Impossible d'ouvrir votre galerie.");
    }
  };

  const handleCoverPick = async () => {
    if (busy) {
      return;
    }

    try {
      const asset = await pickImage([3, 1]);

      if (!asset) {
        return;
      }

      setCoverPreviewUri(asset.uri);
      setUploadingCover(true);

      const toastId = toast.loading("Téléversement de la couverture…");

      try {
        const mimeType = asset.mimeType ?? "image/jpeg";

        const storageId = await uploadAssetToStorage(asset.uri, mimeType, () =>
          generateCoverUrl({}),
        );

        await updateCover({ storageId });

        toast.dismiss(toastId);
        toast.success("Couverture mise à jour.");
      } catch (error) {
        toast.dismiss(toastId);
        console.error("EditProfileSheet.cover:", error);
        setCoverPreviewUri(null);
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de mettre à jour la couverture.",
        );
      } finally {
        setUploadingCover(false);
      }
    } catch (error) {
      console.error("EditProfileSheet.coverPicker:", error);
      toast.error("Impossible d'ouvrir votre galerie.");
    }
  };

  const handleRemoveAvatar = () => {
    if (busy) {
      return;
    }

    Alert.alert(
      "Retirer la photo de profil",
      "Votre photo de profil sera supprimée.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setUploadingAvatar(true);

              try {
                await removeAvatar({});
                setAvatarPreviewUri(null);
                toast.success("Photo de profil retirée.");
              } catch (error) {
                console.error("EditProfileSheet.removeAvatar:", error);
                toast.error("Impossible de retirer la photo.");
              } finally {
                setUploadingAvatar(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleRemoveCover = () => {
    if (busy) {
      return;
    }

    Alert.alert(
      "Retirer la couverture",
      "Votre image de couverture sera supprimée.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setUploadingCover(true);

              try {
                await removeCover({});
                setCoverPreviewUri(null);
                toast.success("Couverture retirée.");
              } catch (error) {
                console.error("EditProfileSheet.removeCover:", error);
                toast.error("Impossible de retirer la couverture.");
              } finally {
                setUploadingCover(false);
              }
            })();
          },
        },
      ],
    );
  };

  const handleSave = async () => {
    const normalizedName = name.trim();
    const normalizedBio = bio.trim();

    if (!normalizedName) {
      toast.error("Le nom ne peut pas être vide.");
      return;
    }

    if (normalizedName.length > MAX_NAME_LENGTH) {
      toast.error(`Le nom ne peut pas dépasser ${MAX_NAME_LENGTH} caractères.`);
      return;
    }

    if (normalizedBio.length > MAX_BIO_LENGTH) {
      toast.error(`La bio ne peut pas dépasser ${MAX_BIO_LENGTH} caractères.`);
      return;
    }

    if (busy) {
      return;
    }

    setSaving(true);

    try {
      await updateProfile({
        name: normalizedName,
        bio: normalizedBio,
      });

      toast.success("Profil mis à jour.");
      onClose();
    } catch (error) {
      console.error("EditProfileSheet.save:", error);
      toast.error("Impossible de mettre à jour le profil.");
    } finally {
      setSaving(false);
    }
  };

  const displayName = getDisplayName(user);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/75">
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          disabled={busy}
          accessibilityLabel="Fermer"
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="w-full"
        >
          <View
            className="w-full rounded-t-[28px] border border-white/10 bg-[#0c1022]"
            style={{
              borderBottomWidth: 0,
              shadowColor: "#000",
              shadowOpacity: 0.35,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: -8 },
              elevation: 20,
            }}
          >
            <View className="items-center pt-3 pb-2">
              <View className="h-1 w-10 rounded-full bg-white/20" />
            </View>

            <View className="flex-row items-center justify-between border-b border-white/[0.06] px-5 py-3">
              <View className="flex-1">
                <Text className="text-lg font-black text-white">
                  Modifier le profil
                </Text>
                <Text className="mt-0.5 text-xs text-white/40">
                  Personnalisez vos informations publiques
                </Text>
              </View>

              <Pressable
                onPress={handleClose}
                disabled={busy}
                className="h-9 w-9 items-center justify-center rounded-xl bg-white/[0.08]"
                accessibilityRole="button"
                accessibilityLabel="Fermer la modification du profil"
              >
                <X size={17} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 32,
              }}
            >
              {/* =====================================================
                  COUVERTURE
              ====================================================== */}

              <View className="mb-6">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                  Couverture
                </Text>

                <View className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
                  <Pressable
                    onPress={() => {
                      void handleCoverPick();
                    }}
                    disabled={busy}
                    accessibilityRole="button"
                    accessibilityLabel="Modifier la couverture"
                    style={{ opacity: uploadingCover ? 0.65 : 1 }}
                  >
                    {currentCoverUri ? (
                      <Image
                        source={{ uri: currentCoverUri }}
                        className="h-32 w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className="h-32 w-full items-center justify-center"
                        style={{
                          backgroundColor: "rgba(255,255,255,0.03)",
                        }}
                      >
                        <ImagePlus size={26} color="rgba(255,255,255,0.28)" />

                        <Text className="mt-2 text-xs text-white/35">
                          Ajouter une couverture
                        </Text>
                      </View>
                    )}

                    {uploadingCover ? (
                      <View
                        className="absolute inset-0 items-center justify-center"
                        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                      >
                        <ActivityIndicator size="small" color="#ffffff" />
                      </View>
                    ) : null}
                  </Pressable>

                  {currentCoverUri && !uploadingCover ? (
                    <Pressable
                      onPress={handleRemoveCover}
                      disabled={busy}
                      className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                      accessibilityRole="button"
                      accessibilityLabel="Retirer la couverture"
                    >
                      <Trash2 size={14} color="#f87171" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {/* =====================================================
                  AVATAR
              ====================================================== */}

              <View className="items-center">
                <View className="relative">
                  <Pressable
                    onPress={() => {
                      void handleAvatarPick();
                    }}
                    disabled={busy}
                    className="relative"
                    accessibilityRole="button"
                    accessibilityLabel="Modifier la photo de profil"
                  >
                    <View
                      className="h-24 w-24 overflow-hidden rounded-full border-2"
                      style={{
                        borderColor: `${accentHex}99`,
                        opacity: uploadingAvatar ? 0.65 : 1,
                      }}
                    >
                      {currentAvatarUri ? (
                        <Image
                          source={{ uri: currentAvatarUri }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <UserAvatar user={user} size="w-24 h-24" />
                      )}
                    </View>

                    <View
                      className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-[#0c1022]"
                      style={{
                        backgroundColor: accentHex,
                      }}
                    >
                      {uploadingAvatar ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Camera size={16} color="#ffffff" />
                      )}
                    </View>
                  </Pressable>

                  {currentAvatarUri && !uploadingAvatar ? (
                    <Pressable
                      onPress={handleRemoveAvatar}
                      disabled={busy}
                      className="absolute -left-1 top-0 h-7 w-7 items-center justify-center rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
                      accessibilityRole="button"
                      accessibilityLabel="Retirer la photo de profil"
                    >
                      <Trash2 size={12} color="#f87171" />
                    </Pressable>
                  ) : null}
                </View>

                <Text className="mt-3 text-base font-bold text-white">
                  {displayName}
                </Text>

                <Text className="mt-1 text-center text-xs text-white/40">
                  Touchez la photo pour la remplacer
                </Text>
              </View>

              {/* =====================================================
                  NOM
              ====================================================== */}

              <View className="mt-7">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                  Nom affiché
                </Text>

                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Votre nom"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  maxLength={MAX_NAME_LENGTH}
                  editable={!busy}
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  className="rounded-2xl border px-4 py-3.5 text-sm text-white"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                />

                <Text className="mt-1.5 text-right text-[11px] text-white/25">
                  {name.length}/{MAX_NAME_LENGTH}
                </Text>
              </View>

              {/* =====================================================
                  BIO
              ====================================================== */}

              <View className="mt-5">
                <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-white/50">
                  Bio
                </Text>

                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Parlez de vous en quelques mots…"
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  maxLength={MAX_BIO_LENGTH}
                  editable={!busy}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  autoCorrect
                  className="min-h-[120px] rounded-2xl border px-4 py-3.5 text-sm text-white"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderColor: "rgba(255,255,255,0.10)",
                  }}
                />

                <Text className="mt-1.5 text-right text-[11px] text-white/25">
                  {bio.length}/{MAX_BIO_LENGTH}
                </Text>
              </View>

              {/* =====================================================
                  ACTIONS
              ====================================================== */}

              <Pressable
                onPress={() => {
                  void handleSave();
                }}
                disabled={busy}
                className="mt-7 min-h-[54px] flex-row items-center justify-center rounded-2xl px-5"
                style={{
                  backgroundColor: busy ? `${accentHex}80` : accentHex,
                }}
                accessibilityRole="button"
                accessibilityLabel="Enregistrer les modifications"
              >
                {saving ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="ml-2 text-sm font-bold text-white">
                      Enregistrement…
                    </Text>
                  </>
                ) : (
                  <>
                    <Check size={17} color="#ffffff" />
                    <Text className="ml-2 text-sm font-bold text-white">
                      Enregistrer
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={handleClose}
                disabled={busy}
                className="mt-3 min-h-[48px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"
                accessibilityRole="button"
                accessibilityLabel="Annuler"
              >
                <Text className="text-sm font-semibold text-white/65">
                  Annuler
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
