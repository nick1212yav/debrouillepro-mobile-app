import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

// src/features/transport/pages/BecomeTransportDriverPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Car,
  FileText,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
} from "lucide-react-native";

export default function BecomeTransportDriverPage() {
  const navigate = useNavigate();
  const registerDriver = useMutation(api.transport.createTransportDriver);

  // Utilisation de la méthode exacte fournie par votre schéma : getCurrentUser
  const currentUser = useQuery(api.users.getCurrentUser);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Données du formulaire
  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    email: currentUser?.email || "",
    address: "",
    city: "Kinshasa",
    country: "RDC",
    licenseNumber: "",
    licenseExpiry: "",
    vehicleModel: "",
    vehicleColor: "",
    licensePlate: "",
    vehicleType: "voiture" as
      | "taxi"
      | "bus"
      | "moto"
      | "minibus"
      | "voiture"
      | "camion",
    seats: 4,
    bio: "",
  });

  const handleChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "seats" ? parseInt(value) || 0 : value,
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.phone || !formData.city) {
        toast.error(
          "Veuillez remplir les informations obligatoires de l'étape 1.",
        );
        return;
      }
    } else if (step === 2) {
      // Correction de l'immatriculation : utilisation de licensePlate
      if (
        !formData.vehicleModel ||
        !formData.licensePlate ||
        !formData.vehicleColor
      ) {
        toast.error(
          "Veuillez remplir les informations concernant le véhicule.",
        );
        return;
      }
    }
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async () => {
    if (!formData.licenseNumber || !formData.licenseExpiry) {
      toast.error(
        "Veuillez renseigner votre permis de conduire pour validation.",
      );
      return;
    }

    if (!currentUser?._id) {
      toast.error("Erreur d'authentification utilisateur.");
      return;
    }

    setLoading(true);
    try {
      await registerDriver({
        userId: currentUser._id,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || undefined,
        address: formData.address || undefined,
        city: formData.city,
        country: formData.country,
        licenseNumber: formData.licenseNumber,
        licenseExpiry: formData.licenseExpiry,
        vehicleModel: formData.vehicleModel,
        vehicleColor: formData.vehicleColor,
        licensePlate: formData.licensePlate,
        vehicleType: formData.vehicleType,
        seats: formData.seats,
        available: true,
        bio: formData.bio || undefined,
        languages: ["Français", "Lingala"],
      });

      toast.success("Profil de chauffeur enregistré avec succès !");
      setStep(4);
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Erreur lors de l'enregistrement";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="min-h-screen bg-[#020412] text-white flex flex-col">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/5 bg-[#070914]/40"><Pressable onPress={() => navigate(-1)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5 transition-colors"><ArrowLeft size={18} className="text-white" /></Pressable><View><Text className="text-white font-bold text-base">Devenir Chauffeur</Text><Text className="text-[10px] text-white/40">Rejoignez le réseau DébrouillePro
          </Text></View></View>{}{step < 4 && (
        <View className="px-6 pt-6 flex items-center justify-between">{[
            { id: 1, label: "Identité", icon: <User size={14} /> },
            { id: 2, label: "Véhicule", icon: <Car size={14} /> },
            { id: 3, label: "Documents", icon: <FileText size={14} /> },
          ].map((s) => (
            <View key={s.id} className="flex flex-col items-center flex-1 relative"><View className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  step >= s.id
                    ? "bg-violet-600 text-white"
                    : "bg-white/5 text-white/40 border border-white/5"
                }`}>{s.icon}</View><Text className={`text-[9px] mt-1.5 font-bold ${step >= s.id ? "text-violet-400" : "text-white/30"}`}>{s.label}</Text>{s.id < 3 && (
                <View className={`absolute top-4 left-[60%] right-[-40%] h-[2px] z-[-1] ${
                    step > s.id ? "bg-violet-600" : "bg-white/5"
                  }`} />
              )}</View>
          ))}</View>
      )}{}<View className="flex-1 p-6 overflow-y-auto max-w-md mx-auto w-full"><View>{step === 1 && (
            <View key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <Text className="text-lg font-black text-white">Informations Personnelles
              </Text>
              <Text className="text-xs text-white/50 leading-relaxed">Renseignez vos coordonnées pour que les passagers puissent vous
                contacter à l'embarquement.
              </Text>

              <View className="space-y-3 pt-2"><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Nom Complet
                  </Text><TextInput  value={formData.name} onChangeText={handleChange} placeholder="Ex: Jean Kabeya" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Téléphone Principal
                  </Text><TextInput  value={formData.phone} onChangeText={handleChange} placeholder="Ex: +243 820 000 000" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" keyboardType="phone-pad" /></View><View className="gap-3"><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Ville
                    </Text><TextInput  value={formData.city} onChangeText={handleChange} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Pays
                    </Text><TextInput  value={formData.country} onChangeText={handleChange} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white/40 outline-none" editable={false} /></View></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Adresse (Facultatif)
                  </Text><TextInput  value={formData.address} onChangeText={handleChange} placeholder="Ex: 12, Av. de la Justice, Gombe" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Présentation (Bio)
                  </Text><TextInput  value={formData.bio} onChangeText={handleChange} placeholder="Ex: Chauffeur professionnel certifié, calme et courtois sur la route..." className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:border-violet-500/50 outline-none" multiline textAlignVertical="top" /></View></View>
            </View>
          )}{step === 2 && (
            <View key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <Text className="text-lg font-black text-white">Détails du Véhicule
              </Text>
              <Text className="text-xs text-white/50 leading-relaxed">Ces informations s'afficheront sur vos fiches d'itinéraire pour
                permettre aux passagers de vous identifier.
              </Text>

              <View className="space-y-3 pt-2"><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Type de véhicule
                  </Text><Picker onValueChange={handleChange} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" selectedValue={formData.vehicleType}><Picker.Item label="Voiture privée (Rideshare)" value="voiture" /><Picker.Item label="Taxi classique" value="taxi" /><Picker.Item label="Moto-taxi (Wewa)" value="moto" /><Picker.Item label="Minibus" value="minibus" /><Picker.Item label="Bus Voyageur" value="bus" /><Picker.Item label="Camion de fret" value="camion" /></Picker></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Modèle du Véhicule
                  </Text><TextInput  value={formData.vehicleModel} onChangeText={handleChange} placeholder="Ex: Toyota Prado / Mercedes Sprinter" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View className="gap-3"><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Couleur
                    </Text><TextInput  value={formData.vehicleColor} onChangeText={handleChange} placeholder="Ex: Noir Métallisé" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Plaque d'immat.
                    </Text><TextInput  value={formData.licensePlate} onChangeText={handleChange} placeholder="Ex: 5124-AB-01" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none font-mono" /></View></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Nombre de places passagers
                  </Text><TextInput  value={formData.seats} onChangeText={handleChange} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" keyboardType="numeric" /></View></View>
            </View>
          )}{step === 3 && (
            <View key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              <Text className="text-lg font-black text-white">Documents Officiels
              </Text>
              <Text className="text-xs text-white/50 leading-relaxed">Renseignez votre permis de conduire pour être identifié comme
                conducteur certifié sur DébrouillePro.
              </Text>

              <View className="space-y-3 pt-2"><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Numéro de Permis de Conduire
                  </Text><TextInput  value={formData.licenseNumber} onChangeText={handleChange} placeholder="Ex: PR-89021-026" className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View><Text className="text-[10px] uppercase font-bold text-white/40 block mb-1">Date d'Expiration du Permis
                  </Text><TextInput  value={formData.licenseExpiry} onChangeText={handleChange} className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white focus:border-violet-500/50 outline-none" /></View><View className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex gap-3 text-xs leading-relaxed text-white/75"><ShieldCheck size={18} className="text-violet-400 flex-shrink-0 mt-0.5" /><Text>Vos informations de conduite font l'objet d'une validation
                    interne par nos équipes sous 24h. Vous pouvez toutefois déjà
                    saisir vos annonces d'itinéraires.
                  </Text></View></View>
            </View>
          )}{step === 4 && (
            <View key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center text-center py-10 space-y-4">
              <View className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <CheckCircle size={32} />
              </View>
              <Text className="text-xl font-black text-white">Profil Chauffeur Créé !
              </Text>
              <Text className="text-xs text-white/60 leading-relaxed max-w-xs">
                Vous faites désormais partie des chauffeurs du réseau. Vous
                pouvez immédiatement commencer à publier des trajets et
                configurer vos services de transport.
              </Text>
              <Pressable onPress={() => navigate("/transport")} className="mt-4 px-6 py-3 rounded-xl bg-violet-600 font-bold text-xs transition-colors">
                Retour à l'accueil Transport
              </Pressable>
            </View>
          )}</View></View>{}{step < 4 && (
        <View className="flex-shrink-0 p-4 border-t border-white/5 bg-[#070914]/40 flex gap-3 max-w-md mx-auto w-full">
          {step > 1 && (
            <Pressable onPress={handleBack} disabled={loading} className="flex items-center justify-center gap-1 py-3.5 px-5 rounded-2xl border border-white/5 bg-white/5 text-xs font-bold text-white/80 transition-colors">
              <ChevronLeft size={16} />
              Précédent
            </Pressable>
          )}

          {step < 3 ? (
            <Pressable onPress={handleNext} className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-6 rounded-2xl bg-violet-600 font-black text-xs text-white transition-colors">
              Suivant
              <ChevronRight size={16} />
            </Pressable>
          ) : (
            <Pressable onPress={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 py-3.5 px-6 rounded-2xl bg-emerald-600 font-black text-xs text-white transition-colors disabled:opacity-50">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-white" />
              ) : (
                "Confirmer mon Enregistrement"
              )}
            </Pressable>
          )}
        </View>
      )}</View>
  );
}
