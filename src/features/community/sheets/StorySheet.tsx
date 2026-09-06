// src/features/community/sheets/StorySheet.tsx

import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  X,
  Upload,
  Loader2,
  Video,
  Image as ImageIcon,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useCommunityStories } from "../hooks/useCommunityStories";

type StoryMediaType = "image" | "video";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function showMessage(title: string, message: string) {
  Alert.alert(title, message);
}

export function StorySheet({ isOpen, onClose, onSuccess }: Props) {
  const { createStory } = useCommunityStories();

  const [mediaType, setMediaType] = useState<StoryMediaType>("image");

  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  const [caption, setCaption] = useState("");

  const [isUploading, setIsUploading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setMediaUrl(null);
    setMediaType("image");
    setCaption("");
    setIsUploading(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isUploading || isSubmitting) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleMediaSelect = async () => {
    if (isUploading || isSubmitting) {
      return;
    }

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showMessage(
          "Autorisation requise",
          "L'accès à votre galerie est nécessaire pour ajouter une image ou une vidéo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        quality: 0.9,
        exif: false,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      if (
        asset.fileSize !== null &&
        asset.fileSize !== undefined &&
        asset.fileSize > MAX_FILE_SIZE
      ) {
        showMessage(
          "Fichier trop volumineux",
          "La taille maximale autorisée est de 10 MB.",
        );
        return;
      }

      setIsUploading(true);

      const nextMediaType: StoryMediaType =
        asset.type === "video" ? "video" : "image";

      setMediaUrl(asset.uri);
      setMediaType(nextMediaType);

      showMessage("Fichier chargé", "Votre média est prêt à être publié.");
    } catch (error) {
      console.error("Erreur lors de la sélection du média:", error);

      showMessage("Erreur", "Impossible de charger ce fichier.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    if (isUploading || isSubmitting) {
      return;
    }

    setMediaUrl(null);
    setMediaType("image");
  };

  const handleSubmit = async () => {
    if (!mediaUrl) {
      showMessage(
        "Média requis",
        "Veuillez sélectionner une image ou une vidéo.",
      );
      return;
    }

    if (isUploading || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createStory({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
        duration: mediaType === "video" ? 15 : 5,
      });

      showMessage("Story publiée", "Votre story a été publiée avec succès.");

      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error("Erreur publication story:", error);

      showMessage("Erreur", "Impossible de publier la story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isUploading || isSubmitting;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end bg-black/70">
        <Pressable
          className="absolute inset-0"
          onPress={handleClose}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Fermer la story"
        />

        <View className="max-h-[90%] w-full overflow-hidden rounded-t-3xl border border-white/10 bg-[#0F0F1E]">
          <View className="flex-row items-center justify-between border-b border-white/10 px-5 py-4">
            <Text className="text-lg font-bold text-white">Nouvelle story</Text>

            <Pressable
              onPress={handleClose}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              <X size={20} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-grow"
            contentContainerClassName="gap-4 px-5 pb-5 pt-4"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              onPress={handleMediaSelect}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Importer une image ou une vidéo"
              className="relative aspect-[9/16] w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/20 bg-white/5"
              style={{
                opacity: isBusy ? 0.6 : 1,
              }}
            >
              {mediaUrl ? (
                <>
                  {mediaType === "image" ? (
                    <Image
                      source={{
                        uri: mediaUrl,
                      }}
                      className="h-full w-full"
                      resizeMode="cover"
                      accessibilityLabel="Aperçu de la story"
                    />
                  ) : (
                    <View className="h-full w-full items-center justify-center bg-black/30">
                      <Video size={56} color="rgba(255,255,255,0.8)" />

                      <Text className="mt-3 text-sm font-medium text-white">
                        Vidéo sélectionnée
                      </Text>

                      <Text className="mt-1 text-center text-xs text-white/50">
                        La vidéo sera disponible dans votre story après
                        publication.
                      </Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleRemoveMedia}
                    disabled={isBusy}
                    accessibilityRole="button"
                    accessibilityLabel="Supprimer le média"
                    className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-black/60"
                  >
                    <X size={16} color="#FFFFFF" />
                  </Pressable>
                </>
              ) : (
                <View className="items-center px-6">
                  {isUploading ? (
                    <>
                      <Loader2 size={32} color="rgba(255,255,255,0.7)" />

                      <Text className="mt-3 text-sm text-white/60">
                        Chargement...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Upload size={32} color="rgba(255,255,255,0.5)" />

                      <Text className="mt-3 text-sm text-white/60">
                        Touchez pour importer
                      </Text>

                      <Text className="mt-1 text-xs text-white/40">
                        Image ou vidéo
                      </Text>

                      <Text className="mt-1 text-xs text-white/30">
                        Taille maximale : 10 MB
                      </Text>
                    </>
                  )}
                </View>
              )}
            </Pressable>

            {mediaUrl && (
              <View className="flex-row items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                {mediaType === "image" ? (
                  <ImageIcon size={16} color="rgba(255,255,255,0.6)" />
                ) : (
                  <Video size={16} color="rgba(255,255,255,0.6)" />
                )}

                <Text className="text-xs text-white/60">
                  {mediaType === "image"
                    ? "Image sélectionnée"
                    : "Vidéo sélectionnée"}
                </Text>
              </View>
            )}

            <TextInput
              value={caption}
              onChangeText={setCaption}
              placeholder="Légende (optionnelle)"
              placeholderTextColor="rgba(255,255,255,0.25)"
              editable={!isBusy}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="min-h-[90px] w-full rounded-xl bg-white/5 px-4 py-3 text-sm leading-relaxed text-white"
              accessibilityLabel="Légende de la story"
            />
          </ScrollView>

          <View className="px-5 pb-5 pt-2">
            <Pressable
              onPress={handleSubmit}
              disabled={!mediaUrl || isBusy}
              accessibilityRole="button"
              accessibilityLabel="Publier la story"
              className="w-full items-center justify-center rounded-2xl bg-[#7C3AED] py-4"
              style={{
                opacity: !mediaUrl || isBusy ? 0.4 : 1,
              }}
            >
              {isSubmitting ? (
                <View className="flex-row items-center gap-2">
                  <Loader2 size={16} color="#FFFFFF" />

                  <Text className="text-sm font-bold text-white">
                    Publication...
                  </Text>
                </View>
              ) : (
                <Text className="text-sm font-bold text-white">
                  Publier la story
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
