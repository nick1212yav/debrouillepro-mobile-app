import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput } from "react-native";

// src/features/network/sheets/CreateNetworkSheet.tsx
import { useState, useCallback } from "react";
import {
  X,
  FileText,
  MapPin,
  Loader2,
  LocateFixed,
  UserPlus,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ImageUploader from "@/components/ImageUploader";

interface CreateNetworkSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const NETWORK_CATS = [
  "Profil professionnel",
  "Connexion",
  "Opportunité",
  "Événement réseau",
  "Présentation",
  "Recrutement",
  "Partenariat",
  "Mentorat",
  "Entrepreneuriat",
  "Artisanat",
  "Innovation",
  "Autre",
];

export function CreateNetworkSheet({
  isOpen,
  onClose,
  onSuccess,
}: CreateNetworkSheetProps) {
  const { isAuthenticated } = useFirebaseAuth();

  const createPublication = useMutation(api.publications.createPublication);
  const generateUploadUrl = useMutation(
    api.publications.generatePublicationUploadUrl,
  );

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    price: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const detectLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation non supportée");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          setField("location")(place ? `${place}, ${country}` : "");
          toast.success("Position détectée !");
        } catch {
          toast.error("Impossible de récupérer l'adresse");
        }
        setLocating(false);
      },
      () => {
        toast.error("Impossible de détecter la position");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const uploadImages = async (imageUrls: string[]): Promise<string[]> => {
    const uploadedIds: string[] = [];

    for (const imageUrl of imageUrls) {
      // URL déjà publique
      if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
        uploadedIds.push(imageUrl);
        continue;
      }

      // Data URL ou Blob URL → upload vers Convex Storage
      if (imageUrl.startsWith("data:image") || imageUrl.startsWith("blob:")) {
        try {
          const blob = await fetch(imageUrl).then((r) => r.blob());
          const uploadUrl = await generateUploadUrl();
          const response = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": blob.type || "image/jpeg" },
            body: blob,
          });
          if (!response.ok) {
            throw new Error(`Upload failed with status ${response.status}`);
          }
          const result = await response.json();
          if (result.storageId) {
            uploadedIds.push(result.storageId);
          } else {
            throw new Error("No storageId in response");
          }
        } catch (err) {
          console.error("Upload error:", err);
          toast.error("Échec de l'upload d'une image. Veuillez réessayer.");
          throw err; // Arrête la publication
        }
        continue;
      }

      // Déjà un storageId
      if (imageUrl.startsWith("kg")) {
        uploadedIds.push(imageUrl);
      }
    }

    return uploadedIds;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      toast.error("Connectez-vous pour publier");
      return;
    }
    if (!form.title || !form.description) {
      toast.error("Veuillez remplir le titre et la description");
      return;
    }

    setLoading(true);
    try {
      const uploadedImages = await uploadImages(images);

      const meta: any = {
        category: form.category,
        location: form.location,
        price: form.price,
      };

      await createPublication({
        type: "network",
        title: form.title,
        description: form.description,
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category || undefined,
        images: uploadedImages,
        tags: form.category ? [form.category.toLowerCase()] : [],
        meta: Object.keys(meta).length > 0 ? JSON.stringify(meta) : undefined,
      });

      toast.success("Publication réseau créée avec succès !");
      onSuccess?.();
      onClose();
    } catch (err) {
      // Le toast d'erreur est déjà affiché dans uploadImages si c'est une erreur d'upload
      if (!(err instanceof Error) || !err.message.includes("upload")) {
        toast.error("Erreur lors de la publication");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onPress={onClose}>
      <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="w-full max-w-md rounded-t-[32px] overflow-hidden flex flex-col" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(100dvh - 24px)", height: "min(900px, calc(100dvh - 24px))" }} onPress={(e) => e.stopPropagation()}>
        <View className="flex justify-center pt-3 pb-1 flex-shrink-0"><View className="w-10 h-1 rounded-full bg-white/20" /></View>

        <View className="flex items-center gap-3 px-5 py-3 border-b border-white/5 flex-shrink-0"><Pressable onPress={onClose} className="w-9 h-9 rounded-2xl flex items-center justify-center transition" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}><X size={18} className="text-white/60" /></Pressable><Text className="text-white font-bold text-lg flex items-center gap-2"><UserPlus size={18} className="text-indigo-400" />Publication réseau
          </Text></View>

        <View className="flex-1 min-h-0 overflow-y-auto px-5 py-4" style={{ paddingBottom: 120 }}><View className="space-y-4"><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Catégorie
              </Text><Picker onValueChange={(value) => setField("category")(value)} className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" selectedValue={form.category}><Picker.Item label="Sélectionner une catégorie" value="" />{NETWORK_CATS.map((cat) => (
                  <Picker.Item label={cat} value={cat} />
                ))}</Picker></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Titre *
              </Text><TextInput value={form.title} onChangeText={(value) => setField("title")(value)} placeholder="Ex: Développeur Full Stack disponible" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Description *
              </Text><TextInput value={form.description} onChangeText={(value) => setField("description")(value)} placeholder="Décrivez votre profil, vos compétences, votre offre..." className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" multiline textAlignVertical="top" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Localisation
              </Text><View className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition"><MapPin size={16} className="text-white/30 flex-shrink-0" /><TextInput value={form.location} onChangeText={(value) => setField("location")(value)} placeholder="Ville, pays..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none" /><Pressable onPress={detectLocation} disabled={locating} className="flex-shrink-0 disabled:opacity-40">{locating ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-indigo-400"
                    />
                  ) : (
                    <LocateFixed size={14} className="text-indigo-400" />
                  )}</Pressable></View></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Tarif (optionnel)
              </Text><TextInput value={form.price} onChangeText={(value) => setField("price")(value)} placeholder="Ex: 15 000 FCFA/h" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10 focus:border-white/20 transition" /></View><View><Text className="text-white/50 text-xs font-semibold uppercase tracking-wider block mb-1.5">Images
              </Text><ImageUploader images={images} onChange={setImages} color="#6366F1" /></View><View className="pt-2 pb-8 space-y-3"><Pressable onPress={handleSubmit} disabled={
                  loading || !form.title.trim() || !form.description.trim()
                } className={cn(
                  "w-full py-4 rounded-2xl",
                  "text-sm font-bold text-white",
                  "flex items-center justify-center gap-2",
                  "bg-gradient-to-r from-indigo-500 to-purple-500",
                  "shadow-lg shadow-indigo-500/20",
                  "hover:from-indigo-400 hover:to-purple-400",
                  "active:scale-[0.98]",
                  "transition-all",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                )}>{loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Publication...
                  </>
                ) : (
                  <>
                    <FileText size={18} />
                    Publier
                  </>
                )}</Pressable><Pressable onPress={onClose} disabled={loading} className="w-full py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5 border border-white/10 transition disabled:opacity-50">Annuler
              </Pressable></View></View></View>
      </View>
    </View>
  );
}
