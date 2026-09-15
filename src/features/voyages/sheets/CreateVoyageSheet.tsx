import { Picker } from "@react-native-picker/picker";
import { View, Text, TextInput, Pressable } from "react-native";

// src/features/voyages/sheets/CreateVoyageSheet.tsx
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { X, Plane, Loader2, Check } from "lucide-react-native";
import ImageUploader from "@/components/ImageUploader.tsx";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

type TransportType = "Bus" | "Minibus" | "Avion";
type AmenityKey =
  | "wifi"
  | "ac"
  | "usb"
  | "snack"
  | "meal"
  | "luggage"
  | "repas"
  | "bagage";

const AMENITY_OPTIONS: { key: AmenityKey; label: string; icon: string }[] = [
  { key: "wifi", label: "Wi-Fi", icon: "📶" },
  { key: "ac", label: "Climatisé", icon: "❄️" },
  { key: "usb", label: "USB", icon: "🔌" },
  { key: "snack", label: "Collation", icon: "🥤" },
  { key: "meal", label: "Repas", icon: "🍽️" },
  { key: "luggage", label: "Bagage inclus", icon: "🧳" },
];

const TRANSPORT_TYPES: TransportType[] = ["Bus", "Minibus", "Avion"];

// ─── Props ──────────────────────────────────────────────────────────────────

interface CreateVoyageSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Composant principal ────────────────────────────────────────────────────

export function CreateVoyageSheet({
  isOpen,
  onClose,
  onSuccess,
}: CreateVoyageSheetProps) {
  const createTrip = useMutation(api.voyages.createTrip);

  const [form, setForm] = useState({
    operator: "",
    type: "Bus" as TransportType,
    from: "",
    to: "",
    departure: "",
    arrival: "",
    durationMinutes: 0,
    price: 0,
    currency: "FCFA",
    availableSeats: 0,
    totalSeats: 0,
    amenities: [] as AmenityKey[],
    imageUrl: "",
    color: "#6366F1",
    departureDate: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "amenities" | "summary">(
    "details",
  );

  // Réinitialiser le formulaire à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setForm({
        operator: "",
        type: "Bus",
        from: "",
        to: "",
        departure: "",
        arrival: "",
        durationMinutes: 0,
        price: 0,
        currency: "FCFA",
        availableSeats: 0,
        totalSeats: 0,
        amenities: [],
        imageUrl: "",
        color: "#6366F1",
        departureDate: new Date().toISOString().split("T")[0],
      });
      setImages([]);
      setStep("details");
      setLoading(false);
    }
  }, [isOpen]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (key: AmenityKey) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(key)
        ? f.amenities.filter((a) => a !== key)
        : [...f.amenities, key],
    }));
  };

  const handleSubmit = async () => {
    // Validation
    if (
      !form.operator ||
      !form.from ||
      !form.to ||
      !form.departure ||
      !form.arrival ||
      form.durationMinutes <= 0 ||
      form.price <= 0 ||
      form.totalSeats <= 0 ||
      !form.departureDate
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      await createTrip({
        operator: form.operator,
        type: form.type,
        from: form.from,
        to: form.to,
        departure: form.departure,
        arrival: form.arrival,
        durationMinutes: form.durationMinutes,
        price: form.price,
        currency: form.currency,
        availableSeats: form.availableSeats || form.totalSeats,
        totalSeats: form.totalSeats,
        amenities: form.amenities,
        imageUrl: images.length > 0 ? images[0] : form.imageUrl || undefined,
        color: form.color,
        departureDate: form.departureDate,
      });

      toast.success("Voyage créé avec succès !");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Erreur création voyage:", err);
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la création",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Contenu des étapes (sans les boutons) ──────────────────────────────

  const renderDetailsContent = () => (
    <View className="space-y-3 pb-4">{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Opérateur *
        </Text><TextInput value={form.operator} onChangeText={(value) => setField("operator")(value)} placeholder="Ex: Trans-Sahel Express" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" /></View>{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Type de transport *
        </Text><View className="flex gap-2">{TRANSPORT_TYPES.map((t) => (
            <Pressable key={t} onPress={() => setField("type")(t)} className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                form.type === t
                  ? "bg-blue-500/30 border border-blue-500/50 text-white"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white",
              )}>{t}</Pressable>
          ))}</View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40 font-medium block mb-1">Départ *
          </Text><TextInput value={form.from} onChangeText={(value) => setField("from")(value)} placeholder="Ville de départ" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" /></View><View><Text className="text-xs text-white/40 font-medium block mb-1">Destination *
          </Text><TextInput value={form.to} onChangeText={(value) => setField("to")(value)} placeholder="Ville d'arrivée" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" /></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40 font-medium block mb-1">Heure de départ *
          </Text><TextInput value={form.departure} onChangeText={(value) => setField("departure")(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" /></View><View><Text className="text-xs text-white/40 font-medium block mb-1">Heure d'arrivée *
          </Text><TextInput value={form.arrival} onChangeText={(value) => setField("arrival")(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" /></View></View>{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Durée (minutes) *
        </Text><TextInput value={form.durationMinutes || ""} onChangeText={(value) =>
            setField("durationMinutes")(parseInt(value) || 0)} placeholder="Ex: 930 pour 15h30" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" keyboardType="numeric" /></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40 font-medium block mb-1">Prix *
          </Text><TextInput value={form.price || ""} onChangeText={(value) => setField("price")(parseFloat(value) || 0)} placeholder="Ex: 18500" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40 font-medium block mb-1">Devise
          </Text><Picker onValueChange={(value) => setField("currency")(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500/50 transition-colors" selectedValue={form.currency}><Picker.Item label="FCFA" value="FCFA" /><Picker.Item label="USD" value="USD" /><Picker.Item label="EUR" value="EUR" /><Picker.Item label="CDF" value="CDF" /></Picker></View></View>{}<View className="gap-3"><View><Text className="text-xs text-white/40 font-medium block mb-1">Places disponibles
          </Text><TextInput value={form.availableSeats || ""} onChangeText={(value) =>
              setField("availableSeats")(parseInt(value) || 0)} placeholder="Optionnel" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" keyboardType="numeric" /></View><View><Text className="text-xs text-white/40 font-medium block mb-1">Places totales *
          </Text><TextInput value={form.totalSeats || ""} onChangeText={(value) =>
              setField("totalSeats")(parseInt(value) || 0)} placeholder="Ex: 45" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors" keyboardType="numeric" /></View></View>{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Date de départ *
        </Text><TextInput value={form.departureDate} onChangeText={(value) => setField("departureDate")(value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-blue-500/50 transition-colors [color-scheme:dark]" /></View>{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Image de couverture
        </Text><ImageUploader images={images} onChange={setImages} color="#6366F1" /></View>{}<View><Text className="text-xs text-white/40 font-medium block mb-1">Couleur (optionnelle)
        </Text><TextInput value={form.color} onChangeText={(value) => setField("color")(value)} className="w-16 h-10 rounded-xl border border-white/10 bg-transparent" /></View></View>
  );

  const renderAmenitiesContent = () => (
    <View className="space-y-4 pb-4"><Text className="text-sm text-white/60">Sélectionnez les équipements disponibles dans ce voyage.
      </Text><View className="gap-3">{AMENITY_OPTIONS.map(({ key, label, icon }) => (
          <Pressable key={key} onPress={() => toggleAmenity(key)} className={cn(
              "flex items-center gap-3 p-3 rounded-xl border transition-all",
              form.amenities.includes(key)
                ? "bg-blue-500/20 border-blue-500/50 text-white"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white",
            )}><Text className="text-xl">{icon}</Text><Text className="text-sm">{label}</Text>{form.amenities.includes(key) && (
              <Check size={16} className="ml-auto text-blue-400" />
            )}</Pressable>
        ))}</View></View>
  );

  const renderSummaryContent = () => (
    <View className="space-y-4 pb-4"><View className="bg-white/5 rounded-xl p-4 space-y-2 text-sm"><View className="flex justify-between"><Text className="text-white/40">Opérateur</Text><Text className="text-white font-medium">{form.operator}</Text></View><View className="flex justify-between"><Text className="text-white/40">Type</Text><Text className="text-white font-medium">{form.type}</Text></View><View className="flex justify-between"><Text className="text-white/40">Itinéraire</Text><Text className="text-white font-medium">{form.from}→ {form.to}</Text></View><View className="flex justify-between"><Text className="text-white/40">Heures</Text><Text className="text-white font-medium">{form.departure}→ {form.arrival}</Text></View><View className="flex justify-between"><Text className="text-white/40">Durée</Text><Text className="text-white font-medium">{Math.floor(form.durationMinutes / 60)}h
            {form.durationMinutes % 60 > 0
              ? `${form.durationMinutes % 60}min`
              : ""}</Text></View><View className="flex justify-between"><Text className="text-white/40">Prix</Text><Text className="text-blue-400 font-bold">{form.price.toLocaleString()}{form.currency}</Text></View><View className="flex justify-between"><Text className="text-white/40">Places</Text><Text className="text-white font-medium">{form.availableSeats || form.totalSeats}/ {form.totalSeats}</Text></View><View className="flex justify-between"><Text className="text-white/40">Date</Text><Text className="text-white font-medium">{form.departureDate}</Text></View><View className="flex justify-between"><Text className="text-white/40">Équipements</Text><Text className="text-white font-medium">{form.amenities.length > 0
              ? form.amenities
                  .map((a) => AMENITY_OPTIONS.find((o) => o.key === a)?.label)
                  .join(", ")
              : "Aucun"}</Text></View></View></View>
  );

  // ─── Rendu principal ──────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <View className="fixed inset-0 z-[200] flex items-end justify-center"><View className="absolute inset-0 bg-black/70 backdrop-blur-sm" onPress={onClose} /><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="relative w-full max-w-md bg-[#0f1623] rounded-t-3xl border-t border-white/10 flex flex-col h-[90dvh] max-h-[90dvh] overflow-hidden">{}<View className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"><View className="flex items-center gap-3"><Plane size={22} className="text-blue-400" /><Text className="text-xl font-bold text-white">Créer un voyage</Text></View><Pressable onPress={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center bg-white/5 transition-colors"><X size={18} className="text-white/60" /></Pressable></View>{}<View className="flex items-center gap-2 px-6 pb-4 flex-shrink-0">{["Détails", "Équipements", "Résumé"].map((label, i) => {
            const isActive =
              (step === "details" && i === 0) ||
              (step === "amenities" && i === 1) ||
              (step === "summary" && i === 2);
            const isDone =
              (step === "amenities" && i < 1) || (step === "summary" && i < 2);
            return (
              <View key={i} className="flex items-center gap-2"><View className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive
                      ? "bg-blue-500 text-white"
                      : isDone
                        ? "bg-green-500/30 text-green-400 border border-green-500/30"
                        : "bg-white/10 text-white/30",
                  )}>{isDone ? <Check size={14} /> : i + 1}</View>{i < 2 && (
                  <View className={cn(
                      "w-8 h-px",
                      isDone ? "bg-green-500/30" : "bg-white/10",
                    )} />
                )}</View>
            );
          })}</View>{}<View className="flex-1 min-h-0 overflow-y-auto px-6 pr-4 pb-28"><View><View key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>{step === "details" && renderDetailsContent()}{step === "amenities" && renderAmenitiesContent()}{step === "summary" && renderSummaryContent()}</View></View></View>{}<View className="absolute bottom-0 left-0 right-0 z-[220] border-t border-white/10 bg-[#0f1623] px-6 pt-4 pb-5 shadow-[0_-20px_40px_rgba(0,0,0,0.35)]">{}{step === "details" && (
            <Pressable onPress={() => setStep("amenities")} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
              Suivant
              <Text className="ml-2 text-white/60">→</Text>
              <Text className="ml-1">Équipements</Text>
            </Pressable>
          )}{}{step === "amenities" && (
            <View className="gap-3">
              <Pressable onPress={() => setStep("details")} className="py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold active:scale-[0.98] transition-all">
                ← Retour
              </Pressable>

              <Pressable onPress={() => setStep("summary")} className="py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all">
                Résumé →
              </Pressable>
            </View>
          )}{}{step === "summary" && (
            <View className="gap-3">
              <Pressable onPress={() => setStep("amenities")} disabled={loading} className="py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white/70 font-semibold active:scale-[0.98] transition-all disabled:opacity-50">
                ← Retour
              </Pressable>

              <Pressable onPress={handleSubmit} disabled={loading} className="py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading && <Loader2 size={18} className="animate-spin" />}

                {loading ? "Création..." : "Créer le voyage"}
              </Pressable>
            </View>
          )}</View></View></View>
  );
}
