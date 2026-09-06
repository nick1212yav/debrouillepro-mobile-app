import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import { ArrowLeft, Play, Heart, Users, Bell, Calendar, Clock, CheckCircle } from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
const CHURCH_NAME = "Église Centrale Abidjan";

const CULTES = [
  { id: 1, title: "Culte du Dimanche – 09h00", pastor: "Pasteur Emmanuel Kouassi", date: "22 Juin 2025", viewers: 1247, isLive: true, img: "https://images.unsplash.com/photo-1519491050282-cf00c82424b4?w=400&h=220&fit=crop" },
  { id: 2, title: "Veillée de Prière – Vendredi", pastor: "Pasteur Marie Diallo", date: "20 Juin 2025", viewers: 438, isLive: false, img: "https://images.unsplash.com/photo-1550155864-d5c75d5f0d6d?w=400&h=220&fit=crop" },
  { id: 3, title: "École du Dimanche – Enfants", pastor: "Mme Christiane Bamba", date: "22 Juin 2025", viewers: 89, isLive: false, img: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&h=220&fit=crop" },
];

const EVENTS_CHURCH = [
  { title: "Jeûne collectif 3 jours", date: "25-27 Juin 2025", type: "Spirituel" },
  { title: "Mariage – Jean & Adjoua", date: "28 Juin 2025", type: "Célébration" },
  { title: "Camp de jeunesse", date: "5-10 Juil 2025", type: "Activité" },
  { title: "Concert de louange", date: "20 Juil 2025", type: "Événement" },
];

const GIVING_PRESETS = [1000, 5000, 10000, 25000];

function ChurchContent() {
  const subscribed = useQuery(api.localServices.getChurchSubscription, { churchName: CHURCH_NAME });
  const donations = useQuery(api.localServices.listMyDonations, {});
  const toggleSub = useMutation(api.localServices.toggleChurchSubscription);
  const makeDonation = useMutation(api.localServices.makeDonation);

  const [activeTab, setActiveTab] = useState("En direct");
  const [donationAmount, setDonationAmount] = useState("5000");
  const [donated, setDonated] = useState(false);

  const handleSubscribe = async () => {
    try {
      const isNow = await toggleSub({ churchName: CHURCH_NAME });
      UIService.openToast(isNow ? "Abonné aux notifications" : "Abonnement annulé", "success");
    } catch { UIService.openToast("Erreur", "error"); }
  };

  const handleDonate = async () => {
    const amt = parseInt(donationAmount || "0");
    if (!amt) return;
    try {
      await makeDonation({ amount: amt, currency: "FCFA", churchName: CHURCH_NAME });
      setDonated(true);
      setTimeout(() => setDonated(false), 3000);
      UIService.openToast("Merci pour votre offrande !", "success");
    } catch { UIService.openToast("Erreur", "error"); }
  };

  const totalDonated = donations?.reduce((s, d) => s + d.amount, 0) ?? 0;

  return (
    <>
      <View className="flex items-center justify-between px-4 mb-3">
        <View className="flex gap-3">
          {[{ icon: Users, label: "Membres", value: "3 240", color: "#8B5CF6" }, { icon: Play, label: "Ce dimanche", value: "1 247", color: "#6366F1" }, { icon: Heart, label: "Mes dons", value: totalDonated > 0 ? `${(totalDonated/1000).toFixed(0)}K` : "—", color: "#EC4899" }].map(({ icon: Icon, label, value, color }) => (
            <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid", minWidth: 70 }}>
              <Icon size={14} color={color} className="mx-auto mb-1" />
              <Text className="text-white font-bold text-sm">{value}</Text>
              <Text className="text-gray-500 text-xs">{label}</Text>
            </View>
          ))}
        </View>
        <Pressable onPress={handleSubscribe}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
          style={{ backgroundColor: subscribed ? "rgba(139,92,246,.3)" : "rgba(255,255,255,.06)" }}>
          <Bell size={12} />{subscribed ? "Abonné" : "S'abonner"}
        </Pressable>
      </View>

      <View className="flex gap-1 mx-4 mb-4 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,.04)" }}>
        {["En direct", "Agenda", "Don & Offrandes"].map(tab => (
          <Pressable key={tab} onPress={() => setActiveTab(tab)} className="flex-1 py-2 rounded-lg text-xs font-medium" style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,.1)" : "transparent" }}>{tab}</Pressable>
        ))}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-4" style={{  }}>
        {activeTab === "En direct" && CULTES.map((c, i) => (
          <View key={c.id}
            className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <View className="relative">
              <Image className="w-full h-36 object-cover"  source={{ uri: c.img }} accessibilityLabel={c.title}/>
              <View className="absolute inset-0" style={{  }} />
              {c.isLive && <View className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(239,68,68,.9)" }}><View className="w-2 h-2 rounded-full bg-white animate-pulse" /><Text className="text-white text-xs font-bold">LIVE</Text></View>}
              <View className="absolute bottom-3 left-0 right-0 flex justify-center">
                <Pressable className="flex items-center gap-2 px-4 py-2 rounded-full font-bold" style={{ backgroundColor: c.isLive ? "rgba(139,92,246,.9)" : "rgba(255,255,255,.2)" }}>
                  <Play size={14} color="white" fill="white" />
                  <Text className="text-white text-sm">{c.isLive ? "Rejoindre" : "Revoir"}</Text>
                </Pressable>
              </View>
            </View>
            <View className="p-3">
              <Text className="text-white font-semibold text-sm">{c.title}</Text>
              <View className="flex items-center justify-between mt-1">
                <Text className="text-gray-400 text-xs">{c.pastor}</Text>
                <View className="flex items-center gap-1"><Users size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{c.viewers.toLocaleString()}</Text></View>
              </View>
            </View>
          </View>
        ))}

        {activeTab === "Agenda" && EVENTS_CHURCH.map((ev, i) => (
          <View key={i}
            className="flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}>
            <View className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(139,92,246,.15)" }}><Calendar size={16} color="#8B5CF6" /></View>
            <View className="flex-1">
              <Text className="text-white font-semibold text-sm">{ev.title}</Text>
              <View className="flex items-center gap-1 mt-0.5"><Clock size={10} color="#9CA3AF" /><Text className="text-gray-400 text-xs">{ev.date}</Text></View>
            </View>
            <Text className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(139,92,246,.15)", color: "#A78BFA" }}>{ev.type}</Text>
          </View>
        ))}

        {activeTab === "Don & Offrandes" && (
          <View className="space-y-4">
            <View className="p-4 rounded-2xl text-center" style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.3)", borderStyle: "solid" }}>
              <Heart size={32} color="#8B5CF6" fill="#8B5CF6" className="mx-auto mb-2" />
              <Text className="text-white font-bold">Donnez avec joie</Text>
              <Text className="text-gray-400 text-xs mt-1">Votre contribution soutient le ministère</Text>
              {totalDonated > 0 && <Text className="text-purple-400 text-xs mt-2 font-bold">Total de vos dons : {totalDonated.toLocaleString()} FCFA</Text>}
            </View>
            <View className="flex gap-2">
              {GIVING_PRESETS.map(amt => (
                <Pressable key={amt} onPress={() => setDonationAmount(String(amt))} className="flex-1 py-2 rounded-xl text-xs font-bold" style={{ backgroundColor: donationAmount === String(amt) ? "#8B5CF6" : "rgba(255,255,255,.08)" }}>
                  {(amt / 1000).toFixed(0)}<Text>K</Text></Pressable>
              ))}
            </View>
            <TextInput value={donationAmount} onChangeText={text => setDonationAmount(text)} placeholder="Montant (FCFA)" className="w-full px-3 py-2 rounded-xl text-white text-sm outline-none" style={{ backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1, borderColor: "rgba(255,255,255,.12)", borderStyle: "solid" }}  keyboardType="numeric"/>
            {donated ? (
              <View className="py-3 rounded-xl flex items-center justify-center gap-2" style={{ backgroundColor: "rgba(16,185,129,.15)", borderWidth: 1, borderColor: "rgba(16,185,129,.3)", borderStyle: "solid" }}>
                <CheckCircle size={16} color="#10B981" /><Text className="text-green-400 font-bold">Merci pour votre générosité !</Text>
              </View>
            ) : (
              <Pressable onPress={handleDonate} className="w-full py-3 rounded-xl font-bold" style={{ backgroundColor: "#8B5CF6" }}>
                <Text>Faire une offrande –</Text>{parseInt(donationAmount || "0").toLocaleString()} <Text>FCFA</Text></Pressable>
            )}
          </View>
        )}
      </View>
    </>
  );
}

export default function EglisePage({ onBack }: { onBack: () => void }) {
  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>
      <View className="flex items-center gap-3 px-4 pt-12 pb-3">
        <Pressable onPress={onBack} className="p-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,.08)" }}><ArrowLeft size={18} color="white" /></Pressable>
        <View className="flex-1"><Text className="text-white font-bold text-lg">Église & Communauté</Text><Text className="text-gray-400 text-xs">Diffuser · Donner · Partager</Text></View>
      </View>
      <Authenticated>
        <ChurchContent />
      </Authenticated>
      <Unauthenticated>
        <View className="flex-1 flex items-center justify-center px-4">
          <View className="text-center">
            <Heart size={48} className="mx-auto mb-3" color="#8B5CF6" />
            <Text className="text-white/60 text-sm mb-1"><Text>Connectez-vous pour accéder à votre communauté</Text></Text>
            <Text className="text-gray-500 text-xs"><Text>Cultes en direct, agenda et dons</Text></Text>
          </View>
        </View>
      </Unauthenticated>
    </View>
  );
}
