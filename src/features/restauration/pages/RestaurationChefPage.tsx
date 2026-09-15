import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput, NativeSyntheticEvent } from "react-native";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChefHat,
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  X,
} from "lucide-react-native";

// Imports de l'architecture d'ingénierie du module
import { useChef } from "../hooks/useChef";
import { useRestaurant } from "../hooks/useRestaurant";
import { useAIRecommendations } from "../hooks/useAIRecommendations";

// Imports des composants d'affichage du Chef
import { ChefProfile } from "../components/chef/ChefProfile";
import { ChefRecipes } from "../components/chef/ChefRecipes";

interface RestaurationChefPageProps {
  restaurantId: number;
  onBack: () => void;
}

export default function RestaurationChefPage({
  restaurantId,
  onBack,
}: RestaurationChefPageProps) {
  // 1. Initialisation des hooks d'état et d'orchestration
  const { restaurant, loading: loadingRestaurant } =
    useRestaurant(restaurantId);
  const { bookChef, isProcessing: isBooking } = useChef();
  const { getRecipeOptimization } = useAIRecommendations();

  // États d'affichage et de formulaires de séquestre financier
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [guestsCount, setGuestsCount] = useState<number>(4);
  const [selectedMenu, setSelectedMenu] = useState("");

  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  // Analyse d'optimisation de recette IA pour le Chef (Simulation interactive)
  const [showAIOptimizer, setShowAIOptimizer] = useState(false);
  const [aiRecipeFeedback, setAiRecipeFeedback] = useState<any | null>(null);

  const chef = restaurant?.chef;

  // Déclencheur de l'analyse d'ingrédients par l'IA
  const handleTriggerAIOptimizer = () => {
    if (!chef) return;
    setShowAIOptimizer(true);

    // Analyse d'ingrédients simulée de la recette signature du Chef
    const feedback = getRecipeOptimization(
      "Filet de Capitaine braisé au poivre de Penja",
      [
        {
          name: "Poisson Capitaine d'importation",
          cost: 15000,
          quantity: 1,
          unit: "kg",
          isImported: true,
          perishableDays: 2,
        },
        {
          name: "Huile végétale raffinée",
          cost: 2000,
          quantity: 0.5,
          unit: "L",
          isImported: false,
          perishableDays: 30,
        },
        {
          name: "Mélange d'épices sauvages Penja",
          cost: 3500,
          quantity: 0.1,
          unit: "kg",
          isImported: false,
          perishableDays: 90,
        },
      ],
      8000, // Prix cible de revient
    );
    setAiRecipeFeedback(feedback);
  };

  // Exécution du blocage d'honoraires en séquestre
  const handleBookingSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (!chef || !bookingDate || !selectedMenu) {
      toast.error(
        "Veuillez renseigner la date de l'événement et la formule de menu.",
      );
      return;
    }

    const totalCost = chef.dailyRate; // Coût de base équivalent au tarif journalier

    const response = await bookChef({
      chefId: chef.name,
      userId: "USER_CURRENT_REACTIVE_ID", // Récupéré de l'auth
      eventDate: bookingDate,
      guestsCount,
      menuSelected: selectedMenu,
      totalCost,
    });

    if (response.success && response.bookingId && response.escrowId) {
      setConfirmedBooking({
        bookingId: response.bookingId,
        escrowId: response.escrowId,
        date: bookingDate,
        menu: selectedMenu,
        total: totalCost,
      });
      toast.success(
        "Honoraires du Chef sécurisés en séquestre DébrouillePay !",
      );
    } else {
      toast.error("Échec lors du blocage de votre réservation.");
    }
  };

  if (loadingRestaurant) {
    return (
      <View className="h-full flex items-center justify-center text-white/50 text-xs gap-2"><RefreshCw size={14} className="animate-spin" /><Text>Chargement du profil professionnel du Chef...</Text></View>
    );
  }

  if (!restaurant || !chef) {
    return (
      <View className="h-full flex flex-col items-center justify-center gap-4 text-white/50 text-xs px-4"><ChefHat size={24} className="text-white/20 animate-bounce" /><Text>Cet établissement ne propose pas de prestations de Chef à domicile
          pour le moment.
        </Text><Pressable onPress={onBack} className="px-4 py-2 bg-white/5 rounded-xl text-white"><Text>Retour</Text></Pressable></View>
    );
  }

  // Extraction des plats signatures pour alimenter le carrousel du Chef
  const signatureRecipes = restaurant.menu
    .flatMap((cat) => cat.items)
    .slice(0, 3);

  return (
    <View className="h-full w-full flex flex-col relative text-white bg-[#020617]">{}<View className="flex-shrink-0 px-4 pt-12 pb-3 bg-slate-950/60 border-b border-white/[0.04] backdrop-blur-md flex items-center gap-3"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}><ArrowLeft size={18} /></Pressable><View className="flex-1 text-left"><Text className="block text-[8px] text-white/30 uppercase font-black">Prestation Élite
          </Text><Text className="text-sm font-black text-white/95 leading-none mt-1">Le Chef à Domicile
          </Text></View></View>{}<View className="flex-1 overflow-y-auto px-4 py-4 space-y-4 no-scrollbar">{}<ChefProfile chef={chef} onBook={() => {
            setConfirmedBooking(null);
            setShowBookingModal(true);
          }} />{}<View className="p-4 rounded-2xl bg-gradient-to-tr from-orange-500/[0.04] to-amber-500/[0.02] border border-orange-500/15 text-left space-y-3"><View className="flex justify-between items-center"><View className="flex items-center gap-1.5 text-orange-400"><Sparkles size={14} className="animate-pulse" /><Text className="text-[10px] font-black uppercase tracking-wider">Chef Assistant DébrouilleAI
              </Text></View>{!showAIOptimizer && (
              <Pressable onPress={handleTriggerAIOptimizer} className="text-[9px] font-black uppercase tracking-wider text-white border border-white/10 px-2 py-1 rounded bg-white/5"><Text>Analyser la carte</Text></Pressable>
            )}</View>{showAIOptimizer && aiRecipeFeedback && (
            <View className="text-xs text-white/60 leading-relaxed space-y-2 pt-2 border-t border-white/[0.04] animate-fade-in font-normal"><Text className="block text-[9px] text-orange-400 font-bold uppercase tracking-wider">Ajustement éco-responsable suggéré :
              </Text><Text className="italic font-normal">"{aiRecipeFeedback.localAlternatives[0]?.reason}"
              </Text><View className="p-2.5 rounded-lg bg-[#020617] border border-white/5 text-[10px] text-white/40"><Text>Remplacement conseillé : ➔{" "}{aiRecipeFeedback.localAlternatives[0]?.replacement}</Text></View></View>
          )}</View>{}<ChefRecipes recipes={signatureRecipes} onAddRecipe={(recipe) => {
            setSelectedMenu(recipe.name);
            setShowBookingModal(true);
            toast.success(
              `Formule '${recipe.name}' présélectionnée pour votre événement !`,
            );
          }} /></View>{}<View>{showBookingModal && (
          <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs"><View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[90vh] overflow-y-auto no-scrollbar" style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" }}>{confirmedBooking ? (
                /* ÉCRAN DE CONFIRMATION AVEC SÉQUESTRE COMPTABLE */
                <View className="space-y-4 text-center py-4"><View className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto"><CheckCircle size={28} /></View><View className="space-y-1 text-center"><Text className="text-base font-black text-white">Honoraires Sécurisés !
                    </Text><Text className="text-xs text-white/50 leading-relaxed font-normal px-2">Les fonds d'honoraires du Chef ont été placés avec succès
                      sous séquestre DébrouillePay. Le virement ne sera débloqué
                      qu'à l'achèvement de l'événement gastronomique.
                    </Text></View><View className="text-left bg-[#020617] p-4 rounded-xl border border-white/5 text-xs space-y-2.5"><View className="flex justify-between"><Text className="text-white/40">ID Réservation</Text><Text className="font-mono font-bold text-white/80">{confirmedBooking.bookingId}</Text></View><View className="flex justify-between"><Text className="text-white/40">ID Compte Séquestre</Text><Text className="font-mono font-bold text-orange-400">{confirmedBooking.escrowId}</Text></View><View className="flex justify-between border-t border-white/5 pt-2"><Text className="text-white/40 font-bold">Montant Garanti
                      </Text><Text className="font-black text-white">{confirmedBooking.total.toLocaleString()}FCFA
                      </Text></View></View><Pressable onPress={() => setShowBookingModal(false)} className="w-full py-4 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors"><Text>Fermer</Text></Pressable></View>
              ) : (
                /* FORMULAIRE D'OPTIONS DE RÉSERVATION */
                <View className="space-y-4 text-left"><View className="flex items-center justify-between mb-2"><View className="flex items-center gap-1.5 text-orange-400"><Calendar /><Text className="font-extrabold text-sm uppercase tracking-wider">Planifier la prestation
                      </Text></View><Pressable onPress={() => setShowBookingModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50"><X size={15} /></Pressable></View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-bold">Date de tenue de l'événement
                    </Text><TextInput value={bookingDate} onChangeText={(value) => setBookingDate(value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" required /></View><View className="gap-4"><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-bold">Nombre d'invités attendus
                      </Text><TextInput value={guestsCount} onChangeText={(value) => setGuestsCount(Number(value))} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" required keyboardType="numeric" /></View><View className="space-y-1.5"><Text className="block text-[10px] text-white/40 uppercase font-bold">Formule culinaire / Recette
                      </Text><Picker onValueChange={(value) => setSelectedMenu(value)} className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none" selectedValue={selectedMenu}><Picker.Item label="Sélectionner une formule" value="" />{signatureRecipes.map((recipe) => (
                          <Picker.Item label={recipe.name} value={recipe.name} />
                        ))}</Picker></View></View><View className="p-3.5 rounded-xl bg-orange-500/5 border border-orange-500/15 flex items-start gap-3 mt-1.5"><FileText size={15} className="text-orange-400 shrink-0 mt-0.5" /><View><Text className="block text-[9px] text-orange-400 uppercase font-black">Sécurisation DébrouillePay
                      </Text><Text className="text-[11px] text-white/50 leading-relaxed font-normal mt-0.5">Pour garantir le déplacement du Chef, les honoraires
                        d'intervention de{" "}<b className="text-white">{chef.dailyRate.toLocaleString()}FCFA
                        </b>{" "}seront prélevés et retenus de manière neutre sous
                        séquestre d'arbitrage.
                      </Text></View></View><Pressable disabled={isBooking || !bookingDate || !selectedMenu} className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"><ShieldCheck size={14} />{isBooking
                      ? "Blocage de sécurité..."
                      : "Confirmer et Bloquer les honoraires"}</Pressable></View>
              )}</View></View>
        )}</View></View>
  );
}
