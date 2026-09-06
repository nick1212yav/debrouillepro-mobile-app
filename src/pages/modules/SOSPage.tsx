import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Phone, Shield, MapPin, AlertTriangle,
  CheckCircle, Users, Heart, Flame, Zap, ChevronRight,
  Send, Clock, X, Bell, Navigation, Siren, Plus, Trash2,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin";
import type { Id } from "@/convex/_generated/dataModel.d";

interface SOSPageProps { onBack: () => void; }

type Country = "Sénégal" | "Côte d'Ivoire" | "Mali" | "RDC" | "Cameroun" | "Ghana";

interface EmergencyNumber {
  label: string; number: string;
  icon: React.ReactNode; color: string; bg: string;
}

const EMERGENCY_NUMBERS: Record<Country, EmergencyNumber[]> = {
  "Sénégal": [
    { label: "SAMU", number: "15", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "17", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "18", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Gendarmerie", number: "800 00 20 20", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+221 33 839 50 00", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
  "Côte d'Ivoire": [
    { label: "SAMU", number: "185", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "111", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "180", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Gendarmerie", number: "170", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+225 27 22 44 47 12", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
  "Mali": [
    { label: "SAMU", number: "15", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "17", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "18", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Gendarmerie", number: "19", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+223 20 22 50 02", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
  "RDC": [
    { label: "Ambulance", number: "12", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "112", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "118", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "FARDC", number: "0810000", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+243 99 810 50 00", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
  "Cameroun": [
    { label: "SAMU", number: "15", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "17", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "18", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Gendarmerie", number: "112", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+237 222 23 21 47", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
  "Ghana": [
    { label: "Ambulance", number: "193", icon: <Heart size={20} />, color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
    { label: "Police", number: "191", icon: <Shield size={20} />, color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
    { label: "Pompiers", number: "192", icon: <Flame size={20} />, color: "#f97316", bg: "rgba(249,115,22,0.15)" },
    { label: "Général", number: "999", icon: <Users size={20} />, color: "#8b5cf6", bg: "rgba(139,92,246,0.15)" },
    { label: "Anti-poison", number: "+233 302 665 401", icon: <Zap size={20} />, color: "#10b981", bg: "rgba(16,185,129,0.15)" },
  ],
};

const NEARBY_SERVICES = [
  { name: "CHU Aristide Le Dantec", type: "Hôpital", distance: "1.2 km", status: "Ouvert 24h", color: "#ef4444" },
  { name: "Commissariat Central Dakar", type: "Police", distance: "0.8 km", status: "24h/24", color: "#3b82f6" },
  { name: "Caserne des Pompiers", type: "Pompiers", distance: "2.1 km", status: "Toujours disponible", color: "#f97316" },
  { name: "Pharmacie de Garde", type: "Pharmacie", distance: "0.3 km", status: "Jusqu'à 22h", color: "#10b981" },
];

const COUNTRIES: Country[] = ["Sénégal", "Côte d'Ivoire", "Mali", "RDC", "Cameroun", "Ghana"];

function SOSInner({ onBack }: SOSPageProps) {
  const [country, setCountry] = useState<Country>("Sénégal");
  const [sosPressing, setSosPressing] = useState(false);
  const [sosActivated, setSosActivated] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [alertSent, setAlertSent] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [alertMessage, setAlertMessage] = useState("Je suis en sécurité. Pas besoin d'aide.");
  const [activeTab, setActiveTab] = useState<"appels" | "alerte" | "checkin" | "carte">("appels");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", phone: "", relation: "" });
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const contacts = useQuery(api.utility.listEmergencyContacts, {}) ?? [];
  const addContact = useMutation(api.utility.addEmergencyContact);
  const deleteContact = useMutation(api.utility.deleteEmergencyContact);

  const numbers = EMERGENCY_NUMBERS[country];

  const getLocation = () => {
    if (!undefined) { setLocationError(true); return; }
    undefined.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError(true),
      { timeout: 8000 },
    );
  };

  const startPress = () => {
    setSosPressing(true); setSosCountdown(3);
    let count = 3;
    countdownInterval.current = setInterval(() => {
      count--; setSosCountdown(count);
      if (count <= 0) { clearInterval(countdownInterval.current!); setSosPressing(false); setSosActivated(true); }
    }, 1000);
  };

  const cancelPress = () => {
    setSosPressing(false); setSosCountdown(3);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    if (pressTimer.current) clearTimeout(pressTimer.current);
  };

  const cancelSOS = () => { setSosActivated(false); setSosCountdown(3); UIService.openToast("SOS annulé", "success"); };
  const sendAlert = () => { setAlertSent(true); UIService.openToast("Alerte envoyée à vos contacts d'urgence !", "success"); };
  const doCheckIn = () => { setCheckedIn(true); UIService.openToast("Check-in effectué — vos proches sont notifiés !", "success"); };

  async function handleAddContact() {
    if (!contactForm.name.trim() || !contactForm.phone.trim()) return;
    try {
      await addContact({ ...contactForm, relation: contactForm.relation || "Contact", isPrimary: contacts.length === 0 });
      UIService.openToast("Contact ajouté", "success");
      setContactForm({ name: "", phone: "", relation: "" });
      setShowAddContact(false);
    } catch { UIService.openToast("Erreur lors de l'ajout", "error"); }
  }

  async function handleDeleteContact(id: Id<"emergencyContacts">) {
    try { await deleteContact({ id }); UIService.openToast("Contact supprimé", "success"); } catch { UIService.openToast("Erreur", "error"); }
  }

  useEffect(() => {
    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      if (pressTimer.current) clearTimeout(pressTimer.current);
    };
  }, []);

  return (
    <View className="min-h-screen bg-[#0a0004] text-white font-sans overflow-hidden relative">
      <View className="fixed top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-red-700/15" />
      <View className="sticky top-0 z-30 bg-[#0a0004]/80 border-b border-red-500/10">
        <View className="flex items-center gap-3 px-4 pt-12 pb-4">
          <Pressable onPress={onBack} className="p-2 rounded-full bg-white/5"><ArrowLeft size={20} /></Pressable>
          <View>
            <Text className="text-lg font-bold flex items-center gap-2"><AlertTriangle size={18} className="text-red-400" />SOS & Urgences</Text>
            <Text className="text-xs text-white/40">Assistance d&apos;urgence</Text>
          </View>
          <View className="ml-auto">
            <Picker onValueChange={val => setCountry(val as Country)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white/70 outline-none [color-scheme:dark]" selectedValue={country}>
              {COUNTRIES.map(c => <Picker.Item label={`${c}`} value={c} />)}
            </Picker>
          </View>
        </View>
      </View>

      <>
        {!sosActivated ? (
          <View key="sos-btn" className="flex flex-col items-center pt-8 pb-4 px-4">
            <Text className="text-xs text-white/30 mb-4 uppercase tracking-widest">Maintenez appuyé pour déclencher</Text>
            <View className="relative flex items-center justify-center mb-4">
              {sosPressing && (
                <>
                  <View className="absolute w-40 h-40 rounded-full border-2 border-red-500" />
                  <View className="absolute w-40 h-40 rounded-full border-2 border-red-400" />
                </>
              )}
              <Pressable onPointerDown={startPress} onPointerUp={cancelPress} onPointerLeave={cancelPress}
                className="relative w-36 h-36 rounded-full flex flex-col items-center justify-center"
                style={{  }}>
                <Siren size={36} className="text-white mb-1" />
                <Text className="text-white font-black text-xl tracking-wider">SOS</Text>
                {sosPressing && <Text key={sosCountdown} className="absolute -bottom-8 text-3xl font-black text-red-400">{sosCountdown}</Text>}
              </Pressable>
            </View>
            <Text className="text-xs text-white/20 mt-6 text-center max-w-xs">Maintenez le bouton 3 secondes pour alerter vos contacts et partager votre position</Text>
          </View>
        ) : (
          <View key="sos-active" className="flex flex-col items-center pt-6 pb-4 px-4">
            <View
              className="w-36 h-36 rounded-full flex flex-col items-center justify-center mb-4"
              style={{  }}>
              <Bell size={36} className="text-white mb-1 animate-bounce" />
              <Text className="text-white font-black text-base">ACTIF</Text>
            </View>
            <View className="bg-red-900/30 border border-red-500/40 rounded-2xl p-4 w-full max-w-sm text-center mb-4">
              <Text className="text-red-300 font-semibold mb-1">Alerte SOS déclenchée !</Text>
              <Text className="text-xs text-white/50">Vos contacts d&apos;urgence ont été notifiés avec votre position.</Text>
            </View>
            <Pressable onPress={cancelSOS} className="px-6 py-3 bg-white/10 border border-white/20 rounded-2xl text-sm font-semibold flex items-center gap-2"><X size={16} /><Text>Annuler l&apos;alerte</Text></Pressable>
          </View>
        )}
      </>

      <View className="flex gap-1 px-4 mb-4">
        {(["appels", "alerte", "checkin", "carte"] as const).map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all capitalize ${activeTab === tab ? "bg-red-600/40 text-red-300 border border-red-500/40" : "bg-white/5 text-white/40 hover:text-white"}`}>
            {tab === "appels" ? "📞 Numéros" : tab === "alerte" ? "📍 Alerte" : tab === "checkin" ? "✅ Check-in" : "🗺️ Carte"}
          </Pressable>
        ))}
      </View>

      <View className="px-4 pb-32 space-y-4">
        {activeTab === "appels" && (
          <View className="space-y-3">
            <Text className="text-xs text-white/30 uppercase tracking-wider mb-2">Numéros d&apos;urgence — {country}</Text>
            {numbers.map((num, i) => (
              <Pressable key={num.label} href={`tel:${num.number}`}
                className="flex items-center gap-4 p-4 rounded-2xl border"
                style={{ backgroundColor: num.bg, borderColor: num.color + "30" }}>
                <View className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: num.color + "25" }}>{num.icon}</View>
                <View className="flex-1"><Text className="font-bold text-sm">{num.label}</Text><Text className="text-2xl font-black tracking-wider" style={{ color: num.color }}>{num.number}</Text></View>
                <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: num.color }}><Phone size={18} className="text-white" /></View>
              </Pressable>
            ))}
          </View>
        )}

        {activeTab === "alerte" && (
          <View className="space-y-4">
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <View className="flex items-center gap-3 mb-3"><Navigation size={16} className="text-blue-400" /><Text className="text-sm font-semibold">Ma position GPS</Text></View>
              {location ? (
                <View className="bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                  <View className="flex items-center gap-2 text-green-400 text-sm font-medium mb-1"><CheckCircle size={14} /><Text>Position obtenue</Text></View>
                  <Text className="text-xs text-white/40 font-mono">{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</Text>
                </View>
              ) : locationError ? (
                <View className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-400"><Text>Impossible d&apos;obtenir la position. Autorisez la localisation dans les paramètres.</Text></View>
              ) : (
                <Pressable onPress={getLocation} className="w-full py-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-sm text-blue-300 font-medium flex items-center justify-center gap-2"><MapPin size={14} /><Text>Obtenir ma position</Text></Pressable>
              )}
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Text className="text-sm font-semibold mb-3 flex items-center gap-2"><Send size={14} className="text-orange-400" /> Message d&apos;urgence</Text>
              <TextInput value={alertMessage} onChangeText={text => setAlertMessage(text)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none"
                placeholder="Décrivez votre situation..."  multiline textAlignVertical="top"/>
            </View>

            <View className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <View className="flex items-center justify-between mb-3">
                <Text className="text-sm font-semibold flex items-center gap-2"><Users size={14} className="text-purple-400" /> Contacts d&apos;urgence</Text>
                <Pressable onPress={() => setShowAddContact(s => !s)} className="p-1.5 rounded-lg bg-purple-500/20"><Plus size={14} className="text-purple-400" /></Pressable>
              </View>

              {showAddContact && (
                <View className="mb-3 p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <TextInput value={contactForm.name} onChangeText={text => setContactForm(f => ({ ...f, name: text }))} placeholder="Nom" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30" />
                  <TextInput value={contactForm.phone} onChangeText={text => setContactForm(f => ({ ...f, phone: text }))} placeholder="Téléphone" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30" />
                  <TextInput value={contactForm.relation} onChangeText={text => setContactForm(f => ({ ...f, relation: text }))} placeholder="Relation (ex: Famille)" className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30" />
                  <View className="flex gap-2">
                    <Pressable onPress={() => setShowAddContact(false)} className="flex-1 py-2 rounded-lg bg-white/10 text-white/60 text-sm"><Text>Annuler</Text></Pressable>
                    <Pressable onPress={handleAddContact} disabled={!contactForm.name.trim() || !contactForm.phone.trim()} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-40"><Text>Ajouter</Text></Pressable>
                  </View>
                </View>
              )}

              <View className="space-y-2">
                {contacts.length === 0 && !showAddContact && (
                  <Text className="text-xs text-white/30 text-center py-3">Aucun contact d&apos;urgence. Appuyez sur + pour en ajouter.</Text>
                )}
                {contacts.map(c => (
                  <View key={c._id} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                    <View className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">{c.name[0]}</View>
                    <View className="flex-1">
                      <Text className="text-sm font-medium">{c.name}</Text>
                      <Text className="text-xs text-white/30">{c.relation} · {c.phone}</Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <CheckCircle size={14} className="text-green-400" />
                      <Pressable onPress={() => handleDeleteContact(c._id)} className="p-1 rounded"><Trash2 size={12} className="text-red-400" /></Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {alertSent ? (
              <View className="bg-green-500/15 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <View><Text className="text-sm font-semibold text-green-300">Alerte envoyée !</Text><Text className="text-xs text-white/40">Tous vos contacts ont été notifiés.</Text></View>
              </View>
            ) : (
              <Pressable onPress={sendAlert}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                style={{  }}>
                <Send size={18} /><Text>Envoyer l&apos;alerte d&apos;urgence</Text></Pressable>
            )}
          </View>
        )}

        {activeTab === "checkin" && (
          <View className="space-y-4">
            <View className="rounded-2xl p-5 text-center border"
              style={checkedIn ? { backgroundColor: "rgba(16,185,129,0.12)", borderColor: "rgba(16,185,129,0.3)" } : { backgroundColor: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.2)" }}>
              <View className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: checkedIn ? "rgba(16,185,129,0.25)" : "rgba(249,115,22,0.2)" }}>
                {checkedIn ? <CheckCircle size={32} className="text-green-400" /> : <AlertTriangle size={32} className="text-orange-400" />}
              </View>
              <Text className="text-lg font-bold mb-1">{checkedIn ? "En sécurité" : "Statut inconnu"}</Text>
              <Text className="text-sm text-white/40">{checkedIn ? "Votre check-in a été envoyé à vos proches." : "Vos proches ne connaissent pas votre statut."}</Text>
              {checkedIn && <View className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/30"><Clock size={12} /><Text>Il y a quelques secondes</Text></View>}
            </View>
            {!checkedIn ? (
              <Pressable onPress={doCheckIn}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2"
                style={{  }}>
                <CheckCircle size={18} /><Text>Je suis en sécurité</Text></Pressable>
            ) : (
              <Pressable onPress={() => setCheckedIn(false)} className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 bg-white/5 border border-white/10"><X size={18} /><Text>Réinitialiser le statut</Text></Pressable>
            )}
            <View className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <Text className="text-sm font-semibold mb-1">Check-in automatique</Text>
              {[
                { label: "Chaque 6 heures", sub: "Envoie votre statut toutes les 6h" },
                { label: "En arrivant à destination", sub: "Basé sur votre position GPS" },
                { label: "Lors d'un voyage", sub: "Activé automatiquement lors de réservations" },
              ].map((opt, i) => (
                <View key={i} className="flex items-center justify-between">
                  <View><Text className="text-sm">{opt.label}</Text><Text className="text-xs text-white/30">{opt.sub}</Text></View>
                  <View className="w-10 h-5 bg-white/10 rounded-full" />
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "carte" && (
          <View className="space-y-3">
            <Text className="text-xs text-white/30 uppercase tracking-wider mb-2">Services d&apos;urgence proches</Text>
            <View className="w-full h-44 rounded-2xl overflow-hidden relative flex items-center justify-center border border-white/10"
              style={{  }}>
              <View className="absolute inset-0 opacity-10">
                {Array.from({ length: 8 }).map((_, i) => <View key={i} className="absolute border-b border-white/20" style={{ top: `${i * 12.5}%`, width: "100%" }} />)}
                {Array.from({ length: 8 }).map((_, i) => <View key={i} className="absolute border-r border-white/20" style={{ left: `${i * 12.5}%`, height: "100%" }} />)}
              </View>
              <View className="relative z-10 flex flex-col items-center">
                <View><MapPin size={32} className="text-red-400" /></View>
                <View className="w-3 h-3 bg-red-500/40 rounded-full -mt-1" />
                <Text className="text-xs text-white/40 mt-2">Votre position</Text>
              </View>
              {[
                { color: "#ef4444", x: "25%", y: "30%", label: "🏥" },
                { color: "#3b82f6", x: "70%", y: "40%", label: "🚔" },
                { color: "#f97316", x: "55%", y: "65%", label: "🚒" },
                { color: "#10b981", x: "20%", y: "65%", label: "💊" },
              ].map((dot, i) => (
                <View key={i} className="absolute flex flex-col items-center" style={{ left: dot.x, top: dot.y, transform: "translate(-50%, -50%)" }}>
                  <View className="text-base">{dot.label}</View>
                  <View className="w-2 h-2 rounded-full mt-0.5" style={{ backgroundColor: dot.color }} />
                </View>
              ))}
            </View>
            {NEARBY_SERVICES.map((svc, i) => (
              <Pressable key={svc.name}
                className="w-full flex items-center gap-4 bg-white/5 border border-white/8 rounded-2xl p-4 text-left">
                <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: svc.color + "22" }}><MapPin size={18} /></View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold">{svc.name}</Text>
                  <Text className="text-xs text-white/40">{svc.type} <Text>·</Text>{svc.status}</Text>
                </View>
                <View className="text-right">
                  <Text className="text-sm font-bold" style={{ color: svc.color }}>{svc.distance}</Text>
                  <ChevronRight size={14} className="text-white/20 ml-auto mt-1" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export default function SOSPage({ onBack }: SOSPageProps) {
  return (
    <>
      <Authenticated><SOSInner onBack={onBack} /></Authenticated>
      <Unauthenticated>
        <View className="min-h-screen bg-[#0a0004] text-white flex flex-col items-center justify-center gap-4 px-6">
          <Pressable onPress={onBack} className="absolute top-4 left-4 p-2 rounded-xl"><ArrowLeft size={20} /></Pressable>
          <AlertTriangle size={48} className="text-red-400" />
          <Text className="text-lg font-bold">Connectez-vous pour gérer vos contacts d&apos;urgence</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="min-h-screen bg-[#0a0004] flex items-center justify-center"><View className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /></View>
      </AuthLoading>
    </>
  );
}
