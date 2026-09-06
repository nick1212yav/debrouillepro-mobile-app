// src/pages/home/_components/StoryCreator.tsx

import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  ImagePlus,
  Plus,
  Sparkles,
  Type,
  Upload,
  X,
  Zap,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import type { StorySlide } from "./StoryViewer.tsx";

const TEXT_GRADIENTS = [
  ["#667eea", "#764ba2"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#a18cd1", "#fbc2eb"],
  ["#ffecd2", "#fcb69f"],
  ["#0a0a1a", "#1a1a3e"],
] as const;

const TEXT_COLORS = [
  "#ffffff",
  "#ffe566",
  "#ff6b6b",
  "#69ff94",
  "#69b8ff",
  "#e879f9",
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type StepType = "pick" | "text" | "image" | "poll";

interface StoryCreatorProps {
  onClose: () => void;
  onPublish: (
    slide: Omit<
      StorySlide,
      "id" | "authorName" | "authorAvatar" | "authorGradient" | "time"
    >,
  ) => void;
}

interface CreationType {
  type: Exclude<StepType, "pick">;
  label: string;
  description: string;
  icon: typeof Type;
  colors: readonly [string, string];
}

const CREATION_TYPES: CreationType[] = [
  {
    type: "text",
    label: "Story texte",
    description: "Une idée, une annonce ou un message.",
    icon: Type,
    colors: ["#8B5CF6", "#6366F1"],
  },
  {
    type: "image",
    label: "Photo",
    description: "Partagez un moment depuis votre appareil.",
    icon: ImageIcon,
    colors: ["#3B82F6", "#06B6D4"],
  },
  {
    type: "poll",
    label: "Sondage",
    description: "Faites participer votre communauté.",
    icon: BarChart3,
    colors: ["#EC4899", "#8B5CF6"],
  },
];

export default function StoryCreator({
  onClose,
  onPublish,
}: StoryCreatorProps) {
  const [step, setStep] = useState<StepType>("pick");

  const [text, setText] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [backgroundIndex, setBackgroundIndex] = useState(0);

  const [imgStorageId, setImgStorageId] = useState("");
  const [imgPreviewUrl, setImgPreviewUrl] = useState("");
  const [imgCaption, setImgCaption] = useState("");

  const [pollQ, setPollQ] = useState("");
  const [pollOpts, setPollOpts] = useState(["", ""]);

  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const generateUploadUrl = useMutation(api.stories.generateStoryUploadUrl);

  const createStory = useMutation(api.stories.createStory);

  const backgroundColors = TEXT_GRADIENTS[backgroundIndex];

  const validPollOptions = useMemo(
    () => pollOpts.map((option) => option.trim()).filter(Boolean),
    [pollOpts],
  );

  const canPublish = useMemo(() => {
    if (publishing || uploading) {
      return false;
    }

    if (step === "text") {
      return text.trim().length > 0;
    }

    if (step === "image") {
      return imgStorageId.length > 0;
    }

    if (step === "poll") {
      return pollQ.trim().length > 0 && validPollOptions.length >= 2;
    }

    return false;
  }, [
    publishing,
    uploading,
    step,
    text,
    imgStorageId,
    pollQ,
    validPollOptions,
  ]);

  const requestGalleryPermission = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      toast.error("Autorisez l'accès à votre galerie pour choisir une photo.");

      return false;
    }

    return true;
  }, []);

  const validateImage = useCallback(
    (asset: ImagePicker.ImagePickerAsset): boolean => {
      const mimeType = asset.mimeType ?? "";

      if (mimeType && !mimeType.startsWith("image/")) {
        toast.error("Veuillez sélectionner une image valide.");

        return false;
      }

      if (
        typeof asset.fileSize === "number" &&
        asset.fileSize > MAX_IMAGE_SIZE
      ) {
        toast.error("L'image est trop volumineuse. Maximum : 10 Mo.");

        return false;
      }

      return true;
    },
    [],
  );

  const uploadImage = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!validateImage(asset)) {
        return;
      }

      setUploading(true);

      try {
        setImgPreviewUrl(asset.uri);
        setImgStorageId("");

        const uploadUrl = await generateUploadUrl();

        const fileResponse = await fetch(asset.uri);

        if (!fileResponse.ok) {
          throw new Error("Impossible de lire l'image sélectionnée.");
        }

        const blob = await fileResponse.blob();

        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": asset.mimeType ?? blob.type ?? "image/jpeg",
          },
          body: blob,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        const result = (await response.json()) as {
          storageId?: string;
        };

        if (!result.storageId) {
          throw new Error("Convex n'a pas retourné de storageId.");
        }

        setImgStorageId(result.storageId);

        toast.success("Photo prête à publier.");
      } catch (error) {
        console.error("[StoryCreator] image upload error", error);

        setImgStorageId("");
        setImgPreviewUrl("");

        toast.error("Impossible d'envoyer cette photo.");
      } finally {
        setUploading(false);
      }
    },
    [generateUploadUrl, validateImage],
  );

  const pickImage = useCallback(async () => {
    if (uploading || publishing) {
      return;
    }

    const granted = await requestGalleryPermission();

    if (!granted) {
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        selectionLimit: 1,
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0];

      if (!asset) {
        return;
      }

      await uploadImage(asset);
    } catch (error) {
      console.error("[StoryCreator] image picker error", error);

      toast.error("Impossible d'ouvrir votre galerie.");
    }
  }, [publishing, requestGalleryPermission, uploadImage, uploading]);

  const removeImage = useCallback(() => {
    setImgStorageId("");
    setImgPreviewUrl("");
    setImgCaption("");
  }, []);

  const addPollOption = useCallback(() => {
    setPollOpts((current) => {
      if (current.length >= 4) {
        return current;
      }

      return [...current, ""];
    });
  }, []);

  const updatePollOption = useCallback((index: number, value: string) => {
    setPollOpts((current) =>
      current.map((option, optionIndex) =>
        optionIndex === index ? value : option,
      ),
    );
  }, []);

  const removePollOption = useCallback((index: number) => {
    setPollOpts((current) => {
      if (current.length <= 2) {
        return current;
      }

      return current.filter((_, optionIndex) => optionIndex !== index);
    });
  }, []);

  const resetCreator = useCallback(() => {
    setStep("pick");

    setText("");
    setTextColor("#ffffff");
    setBackgroundIndex(0);

    removeImage();

    setPollQ("");
    setPollOpts(["", ""]);

    setPublishing(false);
    setUploading(false);
  }, [removeImage]);

  const publish = useCallback(async () => {
    if (!canPublish) {
      return;
    }

    setPublishing(true);

    try {
      if (step === "text") {
        const cleanText = text.trim();

        const gradientValue = backgroundColors.join(",");

        await createStory({
          mediaUrl: `data:text/${gradientValue}|${cleanText}|${textColor}`,
          mediaType: "image",
          caption: cleanText,
        });

        onPublish({
          type: "text",
          bg: gradientValue,
          text: cleanText,
          textColor,
        });

        toast.success("Story publiée.");

        resetCreator();

        return;
      }

      if (step === "image") {
        if (!imgStorageId) {
          toast.error("Ajoutez une photo avant de publier.");

          return;
        }

        await createStory({
          mediaUrl: imgStorageId,
          mediaType: "image",
          caption: imgCaption.trim() || undefined,
        });

        onPublish({
          type: "image",
          bg: "#000",
          img: imgStorageId,
          text: imgCaption.trim() || undefined,
        });

        toast.success("Story publiée.");

        resetCreator();

        return;
      }

      if (step === "poll") {
        const question = pollQ.trim();

        if (!question || validPollOptions.length < 2) {
          toast.error(
            "Un sondage doit contenir une question et au moins deux options.",
          );

          return;
        }

        await createStory({
          mediaUrl: `poll:${question}`,
          mediaType: "image",
          caption: question,
        });

        onPublish({
          type: "poll",
          bg: TEXT_GRADIENTS[7].join(","),
          pollQuestion: question,
          pollOptions: validPollOptions,
        });

        toast.success("Sondage publié.");

        resetCreator();
      }
    } catch (error) {
      console.error("[StoryCreator] publication error", error);

      toast.error("La publication a échoué.");
    } finally {
      setPublishing(false);
    }
  }, [
    backgroundColors,
    canPublish,
    createStory,
    imgCaption,
    imgStorageId,
    onPublish,
    pollQ,
    resetCreator,
    step,
    text,
    textColor,
    validPollOptions,
  ]);

  const handleClose = useCallback(() => {
    if (uploading || publishing) {
      return;
    }

    onClose();
  }, [onClose, publishing, uploading]);

  const goBack = useCallback(() => {
    if (uploading || publishing) {
      return;
    }

    if (step !== "pick") {
      setStep("pick");
      return;
    }

    handleClose();
  }, [handleClose, publishing, step, uploading]);

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={goBack}
                disabled={uploading || publishing}
                style={[
                  styles.headerButton,
                  uploading || publishing ? styles.disabled : null,
                ]}
                accessibilityRole="button"
                accessibilityLabel={step === "pick" ? "Fermer" : "Retour"}
              >
                {step === "pick" ? (
                  <X size={18} color="#ffffff" />
                ) : (
                  <ChevronLeft size={20} color="#ffffff" />
                )}
              </Pressable>

              <View style={styles.headerTitle}>
                <View style={styles.titleRow}>
                  <Sparkles size={15} color="#a78bfa" />

                  <Text style={styles.title}>Créer une story</Text>
                </View>

                <Text style={styles.subtitle}>Partagez ce qui compte.</Text>
              </View>

              <View style={styles.headerRight}>
                {step !== "pick" && (
                  <Text style={styles.stepLabel}>
                    {step === "text"
                      ? "Texte"
                      : step === "image"
                        ? "Photo"
                        : "Sondage"}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.progressRow}>
              <View
                style={[
                  styles.progressTrack,
                  step === "pick" ? styles.progressActive : null,
                ]}
              >
                {step === "pick" && (
                  <LinearGradient
                    colors={["#6366F1", "#A855F7"]}
                    style={styles.progressFill}
                  />
                )}
              </View>

              <View
                style={[
                  styles.progressTrack,
                  step !== "pick" ? styles.progressActive : null,
                ]}
              >
                {step !== "pick" && (
                  <LinearGradient
                    colors={["#6366F1", "#A855F7"]}
                    style={styles.progressFill}
                  />
                )}
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === "pick" && (
              <View>
                <View style={styles.intro}>
                  <View style={styles.introIcon}>
                    <Zap size={24} color="#a78bfa" />
                  </View>

                  <Text style={styles.introTitle}>
                    Qu'avez-vous envie de partager ?
                  </Text>

                  <Text style={styles.introDescription}>
                    Créez quelque chose qui attire l'attention, raconte une
                    histoire et fait participer votre communauté.
                  </Text>
                </View>

                <View style={styles.creationList}>
                  {CREATION_TYPES.map((option) => {
                    const Icon = option.icon;

                    return (
                      <Pressable
                        key={option.type}
                        onPress={() => setStep(option.type)}
                        style={styles.creationCard}
                      >
                        <LinearGradient
                          colors={option.colors}
                          style={styles.creationIcon}
                        >
                          <Icon size={20} color="#ffffff" />
                        </LinearGradient>

                        <View style={styles.creationText}>
                          <Text style={styles.creationTitle}>
                            {option.label}
                          </Text>

                          <Text style={styles.creationDescription}>
                            {option.description}
                          </Text>
                        </View>

                        <View style={styles.arrowBox}>
                          <ChevronRight
                            size={17}
                            color="rgba(255,255,255,0.45)"
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === "text" && (
              <View style={styles.section}>
                <LinearGradient
                  colors={backgroundColors}
                  style={styles.storyPreview}
                >
                  <View style={styles.textPreviewCenter}>
                    <Text
                      style={[
                        styles.storyText,
                        {
                          color: textColor,
                        },
                      ]}
                    >
                      {text || "Votre idée mérite d'être vue."}
                    </Text>
                  </View>

                  <View style={styles.previewFooter}>
                    <Text style={styles.previewFooterText}>
                      APERÇU DE VOTRE STORY
                    </Text>
                  </View>
                </LinearGradient>

                <FieldLabel>Votre message</FieldLabel>

                <TextInput
                  value={text}
                  onChangeText={setText}
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  placeholder="Écrivez quelque chose qui mérite d'être partagé…"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  style={[styles.input, styles.textArea]}
                />

                <Text style={styles.counter}>{text.length}/500</Text>

                <FieldLabel>Style</FieldLabel>

                <View style={styles.gradientGrid}>
                  {TEXT_GRADIENTS.map((colors, index) => (
                    <Pressable
                      key={index}
                      onPress={() => setBackgroundIndex(index)}
                      style={[
                        styles.colorButton,
                        backgroundIndex === index ? styles.selectedColor : null,
                      ]}
                    >
                      <LinearGradient colors={colors} style={styles.colorFill}>
                        {backgroundIndex === index && (
                          <Check size={14} color="#ffffff" />
                        )}
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>

                <FieldLabel>Couleur du texte</FieldLabel>

                <View style={styles.textColorRow}>
                  {TEXT_COLORS.map((color) => (
                    <Pressable
                      key={color}
                      onPress={() => setTextColor(color)}
                      style={[
                        styles.textColorButton,
                        {
                          backgroundColor: color,
                        },
                        textColor === color ? styles.selectedTextColor : null,
                      ]}
                    >
                      {textColor === color && (
                        <Check
                          size={12}
                          color={color === "#ffffff" ? "#000000" : "#ffffff"}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>

                <PublishButton
                  disabled={!canPublish}
                  loading={publishing}
                  onPress={publish}
                  label="Publier la story"
                  colors={["#8B5CF6", "#6366F1"]}
                />
              </View>
            )}

            {step === "image" && (
              <View style={styles.section}>
                <View style={styles.imagePreview}>
                  {imgPreviewUrl ? (
                    <>
                      <Image
                        source={{
                          uri: imgPreviewUrl,
                        }}
                        style={styles.previewImage}
                        resizeMode="cover"
                      />

                      <LinearGradient
                        colors={["transparent", "rgba(0,0,0,0.85)"]}
                        style={styles.imageCaptionOverlay}
                      >
                        <Text style={styles.imageCaption}>
                          {imgCaption || "Votre story"}
                        </Text>
                      </LinearGradient>

                      <Pressable
                        onPress={removeImage}
                        disabled={uploading || publishing}
                        style={styles.removeImageButton}
                      >
                        <X size={17} color="#ffffff" />
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => void pickImage()}
                      style={styles.emptyImageArea}
                    >
                      <View style={styles.imagePickerIcon}>
                        {uploading ? (
                          <ActivityIndicator color="#60a5fa" />
                        ) : (
                          <ImagePlus size={27} color="#60a5fa" />
                        )}
                      </View>

                      <Text style={styles.emptyImageTitle}>
                        {uploading ? "Envoi sécurisé…" : "Ajouter une photo"}
                      </Text>

                      <Text style={styles.emptyImageDescription}>
                        JPG, PNG, WEBP · 10 Mo max.
                      </Text>
                    </Pressable>
                  )}

                  {uploading && (
                    <View style={styles.uploadOverlay}>
                      <View style={styles.uploadStatus}>
                        <ActivityIndicator size="small" color="#60a5fa" />

                        <Text style={styles.uploadStatusText}>
                          Envoi en cours…
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                <Pressable
                  disabled={uploading || publishing}
                  onPress={() => void pickImage()}
                  style={[
                    styles.galleryButton,
                    uploading || publishing ? styles.disabled : null,
                  ]}
                >
                  <View style={styles.galleryIcon}>
                    {uploading ? (
                      <ActivityIndicator size="small" color="#60a5fa" />
                    ) : (
                      <Upload size={18} color="#60a5fa" />
                    )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.galleryTitle}>
                      {imgPreviewUrl
                        ? "Changer la photo"
                        : "Choisir depuis l'appareil"}
                    </Text>

                    <Text style={styles.galleryDescription}>
                      Votre fichier est envoyé vers le stockage de
                      l'application.
                    </Text>
                  </View>

                  <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
                </Pressable>

                <FieldLabel>Légende</FieldLabel>

                <TextInput
                  value={imgCaption}
                  onChangeText={setImgCaption}
                  maxLength={180}
                  placeholder="Ajoutez un contexte à votre photo…"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  style={styles.input}
                />

                <PublishButton
                  disabled={!canPublish}
                  loading={publishing}
                  onPress={publish}
                  label="Publier la photo"
                  colors={["#3B82F6", "#06B6D4"]}
                />
              </View>
            )}

            {step === "poll" && (
              <View style={styles.section}>
                <LinearGradient
                  colors={TEXT_GRADIENTS[7]}
                  style={styles.pollPreview}
                >
                  <View style={styles.pollIcon}>
                    <BarChart3 size={25} color="#ffffff" />
                  </View>

                  <Text style={styles.pollQuestionPreview}>
                    {pollQ || "Votre question apparaîtra ici"}
                  </Text>

                  <View style={styles.pollPreviewOptions}>
                    {validPollOptions.length > 0 ? (
                      validPollOptions.map((option, index) => (
                        <View
                          key={`${option}-${index}`}
                          style={styles.pollPreviewOption}
                        >
                          <Text style={styles.pollPreviewOptionText}>
                            {option}
                          </Text>
                        </View>
                      ))
                    ) : (
                      <View style={styles.pollEmpty}>
                        <Text style={styles.pollEmptyText}>
                          Ajoutez vos options
                        </Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>

                <FieldLabel>Question</FieldLabel>

                <TextInput
                  value={pollQ}
                  onChangeText={setPollQ}
                  maxLength={180}
                  placeholder="Posez une question à votre communauté…"
                  placeholderTextColor="rgba(255,255,255,0.22)"
                  style={styles.input}
                />

                <View style={styles.optionsHeader}>
                  <FieldLabel>Options</FieldLabel>

                  <Text style={styles.optionsCount}>
                    {validPollOptions.length}
                    /4
                  </Text>
                </View>

                <View style={styles.optionsList}>
                  {pollOpts.map((option, index) => (
                    <View key={index} style={styles.optionRow}>
                      <View style={styles.optionNumber}>
                        <Text style={styles.optionNumberText}>{index + 1}</Text>
                      </View>

                      <TextInput
                        value={option}
                        onChangeText={(value) => updatePollOption(index, value)}
                        maxLength={80}
                        placeholder={`Option ${index + 1}`}
                        placeholderTextColor="rgba(255,255,255,0.22)"
                        style={[styles.input, styles.optionInput]}
                      />

                      {pollOpts.length > 2 && (
                        <Pressable
                          onPress={() => removePollOption(index)}
                          style={styles.deleteOption}
                        >
                          <X size={16} color="#f87171" />
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>

                {pollOpts.length < 4 && (
                  <Pressable onPress={addPollOption} style={styles.addOption}>
                    <Plus size={15} color="#f472b6" />

                    <Text style={styles.addOptionText}>Ajouter une option</Text>
                  </Pressable>
                )}

                <PublishButton
                  disabled={!canPublish}
                  loading={publishing}
                  onPress={publish}
                  label="Publier le sondage"
                  colors={["#EC4899", "#8B5CF6"]}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function PublishButton({
  disabled,
  loading,
  onPress,
  label,
  colors,
}: {
  disabled: boolean;
  loading: boolean;
  onPress: () => void;
  label: string;
  colors: readonly [string, string];
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.publishButtonWrapper,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null,
      ]}
    >
      <LinearGradient colors={colors} style={styles.publishButton}>
        {loading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Sparkles size={16} color="#ffffff" />
        )}

        <Text style={styles.publishButtonText}>
          {loading ? "Publication en cours…" : label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  sheet: {
    width: "100%",
    maxHeight: "94%",
    overflow: "hidden",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#080914",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  headerTitle: {
    flex: 1,
    alignItems: "center",
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
  },

  subtitle: {
    marginTop: 3,
    color: "rgba(255,255,255,0.38)",
    fontSize: 10,
  },

  headerRight: {
    width: 40,
    alignItems: "center",
  },

  stepLabel: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  progressRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 16,
  },

  progressTrack: {
    flex: 1,
    height: 4,
    overflow: "hidden",
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  progressActive: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  progressFill: {
    flex: 1,
    borderRadius: 99,
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },

  intro: {
    alignItems: "center",
    marginBottom: 26,
  },

  introIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  introTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    textAlign: "center",
  },

  introDescription: {
    maxWidth: 330,
    marginTop: 10,
    color: "rgba(255,255,255,0.42)",
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  creationList: {
    gap: 12,
  },

  creationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  creationIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  creationText: {
    flex: 1,
  },

  creationTitle: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "800",
  },

  creationDescription: {
    marginTop: 4,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    lineHeight: 16,
  },

  arrowBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  section: {
    gap: 14,
  },

  storyPreview: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 280,
    aspectRatio: 9 / 14,
    overflow: "hidden",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  textPreviewCenter: {
    flex: 1,
    paddingHorizontal: 26,
    alignItems: "center",
    justifyContent: "center",
  },

  storyText: {
    fontSize: 25,
    fontWeight: "900",
    textAlign: "center",
    lineHeight: 31,
  },

  previewFooter: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  previewFooterText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    textAlign: "center",
  },

  fieldLabel: {
    marginTop: 5,
    color: "rgba(255,255,255,0.42)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  input: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 16,
    color: "#ffffff",
    fontSize: 14,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  counter: {
    marginTop: -8,
    color: "rgba(255,255,255,0.25)",
    fontSize: 10,
    textAlign: "right",
  },

  gradientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  colorButton: {
    width: 38,
    height: 38,
    padding: 2,
    borderRadius: 13,
  },

  selectedColor: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  colorFill: {
    flex: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  textColorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  textColorButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  selectedTextColor: {
    borderWidth: 2,
    borderColor: "#ffffff",
  },

  imagePreview: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 280,
    aspectRatio: 9 / 14,
    overflow: "hidden",
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  imageCaptionOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 18,
    paddingTop: 70,
  },

  imageCaption: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },

  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  emptyImageArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  imagePickerIcon: {
    width: 64,
    height: 64,
    marginBottom: 15,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.1)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.2)",
  },

  emptyImageTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "800",
  },

  emptyImageDescription: {
    marginTop: 6,
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
  },

  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
  },

  uploadStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  uploadStatusText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  galleryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
  },

  galleryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.15)",
  },

  galleryTitle: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "800",
  },

  galleryDescription: {
    marginTop: 3,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    lineHeight: 14,
  },

  pollPreview: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 280,
    aspectRatio: 9 / 14,
    padding: 24,
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  pollIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    marginBottom: 22,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  pollQuestionPreview: {
    marginBottom: 22,
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 25,
    textAlign: "center",
  },

  pollPreviewOptions: {
    gap: 8,
  },

  pollPreviewOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  pollPreviewOptionText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },

  pollEmpty: {
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.18)",
  },

  pollEmptyText: {
    color: "rgba(255,255,255,0.32)",
    fontSize: 10,
    textAlign: "center",
  },

  optionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  optionsCount: {
    color: "rgba(255,255,255,0.28)",
    fontSize: 10,
  },

  optionsList: {
    gap: 10,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  optionNumber: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  optionNumberText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
    fontWeight: "800",
  },

  optionInput: {
    flex: 1,
    minHeight: 44,
  },

  deleteOption: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  addOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 8,
  },

  addOptionText: {
    color: "#f472b6",
    fontSize: 12,
    fontWeight: "700",
  },

  publishButtonWrapper: {
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 16,
  },

  publishButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 16,
  },

  publishButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  disabled: {
    opacity: 0.4,
  },

  pressed: {
    opacity: 0.86,
  },
});
