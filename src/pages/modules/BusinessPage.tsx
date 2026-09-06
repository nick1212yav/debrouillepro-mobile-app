import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image, TextInput } from "react-native";
import { useState } from "react";
import {
  ArrowLeft, TrendingUp, Users, DollarSign, BarChart2,
  Search, Star, MapPin, Phone, X, Plus,
  Globe, CheckCircle, Zap, Package,
  Building2, Clock, Target, Award
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { Authenticated, Unauthenticated, AuthLoading } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import { ConvexError } from "convex/values";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";
import type { Doc } from "@/convex/_generated/dataModel.d";

// Static sample businesses as fallback and showcase
const SAMPLE_BUSINESSES = [
  {
    id: "sample-1", name: "TechHub Abidjan", sector: "Tech & Digital",
    location: "Plateau, Abidjan", founded: "2019", employees: "45",
    revenue: "480M FCFA", rating: 4.8, reviews: 124,
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80",
    avatar: "TH", tags: ["Startup", "Fintech"], verified: true,
    desc: "Agence digitale spécialisée en développement d'applications et solutions fintech pour PME africaines.",
    services: ["Développement App", "Conseil Digital", "Formation", "API Banking"],
  },
  {
    id: "sample-2", name: "Saveurs d'Afrique Export", sector: "Agroalimentaire",
    location: "Zone Industrielle, Abidjan", founded: "2015", employees: "120",
    revenue: "2.1Mds FCFA", rating: 4.7, reviews: 89,
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80",
    avatar: "SA", tags: ["Export", "PME"], verified: true,
    desc: "Transformation et export de produits agroalimentaires ivoiriens vers l'Europe et le Moyen-Orient.",
    services: ["Transformation", "Export", "Logistique", "Certifications"],
  },
  {
    id: "sample-3", name: "Construction Moderne CI", sector: "BTP",
    location: "Marcory, Abidjan", founded: "2012", employees: "200",
    revenue: "3.5Mds FCFA", rating: 4.9, reviews: 312,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    avatar: "CM", tags: ["BTP", "Grande entreprise"], verified: true,
    desc: "Leader de la construction résidentielle et commerciale en Côte d'Ivoire depuis 12 ans.",
    services: ["Construction", "Rénovation", "Gestion de projet", "Études"],
  },
  {
    id: "sample-4", name: "MediConsult Pro", sector: "Santé",
    location: "Cocody, Abidjan", founded: "2021", employees: "18",
    revenue: "95M FCFA", rating: 4.6, reviews: 67,
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=500&q=80",
    avatar: "MC", tags: ["Startup", "HealthTech"], verified: false,
    desc: "Plateforme de télémédecine et gestion de cliniques privées en Côte d'Ivoire.",
    services: ["Télémédecine", "SaaS Clinique", "Dossiers médicaux", "Facturation"],
  },
  {
    id: "sample-5", name: "GreenEnergy CI", sector: "Énergie",
    location: "Yopougon, Abidjan", founded: "2020", employees: "32",
    revenue: "210M FCFA", rating: 4.8, reviews: 98,
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=500&q=80",
    avatar: "GE", tags: ["GreenTech", "PME"], verified: true,
    desc: "Installation de panneaux solaires et solutions d'énergie renouvelable pour particuliers et entreprises.",
    services: ["Solaire", "Installation", "Maintenance", "Audit énergétique"],
  },
];

const METRICS = [
  { label: "Entreprises listées", value: "1 247", icon: Building2, color: "#6366F1", trend: "+12%" },
  { label: "Transactions/mois", value: "8.4k", icon: DollarSign, color: "#10B981", trend: "+23%" },
  { label: "Emplois créés", value: "3 200", icon: Users, color: "#F59E0B", trend: "+8%" },
  { label: "Chiffre d'affaires", value: "45Mds", icon: TrendingUp, color: "#EC4899", trend: "+18%" },
];

const SECTORS = ["Tout", "Tech & Digital", "Agroalimentaire", "BTP", "Santé", "Énergie"];

type DisplayBusiness = {
  id: string;
  name: string;
  sector: string;
  location: string;
  founded: string;
  employees: string;
  revenue: string;
  rating: number;
  reviews: number;
  image: string;
  avatar: string;
  tags: string[];
  verified: boolean;
  desc: string;
  services: string[];
};

function mapProfileToDisplay(profile: Doc<"businessProfiles">): DisplayBusiness {
  return {
    id: profile._id,
    name: profile.companyName,
    sector: profile.sector,
    location: profile.city + (profile.address ? `, ${profile.address}` : ""),
    founded: profile.foundedYear ? String(profile.foundedYear) : "N/A",
    employees: profile.employeeCount ?? "N/A",
    revenue: "—",
    rating: profile.rating ?? 0,
    reviews: profile.reviewCount,
    image: profile.coverImage ?? "https://images.unsplash.com/photo-1497366216548-37526070297c?w=500&q=80",
    avatar: profile.companyName.slice(0, 2).toUpperCase(),
    tags: [profile.sector],
    verified: profile.verified,
    desc: profile.description,
    services: [],
  };
}

// ─── Profile Modal ─────────────────────────────────────────────────────────────
function BusinessProfileModal({
  onClose,
  existing,
}: {
  onClose: () => void;
  existing: Doc<"businessProfiles"> | null | undefined;
}) {
  const upsert = useMutation(api.employment.upsertBusinessProfile);
  const [companyName, setCompanyName] = useState(existing?.companyName ?? "");
  const [sector, setSector] = useState(existing?.sector ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [city, setCity] = useState(existing?.city ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [website, setWebsite] = useState(existing?.website ?? "");
  const [employeeCount, setEmployeeCount] = useState(existing?.employeeCount ?? "");
  const [foundedYear, setFoundedYear] = useState(existing?.foundedYear ? String(existing.foundedYear) : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!companyName.trim() || !sector.trim() || !description.trim() || !city.trim()) {
      UIService.openToast("Veuillez remplir les champs obligatoires", "error");
      return;
    }
    setLoading(true);
    try {
      await upsert({
        companyName: companyName.trim(),
        sector: sector.trim(),
        description: description.trim(),
        city: city.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        employeeCount: employeeCount.trim() || undefined,
        foundedYear: foundedYear ? Number(foundedYear) : undefined,
      });
      UIService.openToast(existing ? "Profil mis à jour" : "Profil créé avec succès", "success");
      onClose();
    } catch (err) {
      if (err instanceof ConvexError) {
        const data = err.data as { message: string };
        UIService.openToast(data.message, "error");
      } else {
        UIService.openToast("Une erreur est survenue", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" };

  return (
    <View
      className="absolute inset-0 z-50 flex flex-col"
      style={{  }}
    >
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable onPress={onClose} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <X size={20} className="text-white" />
        </Pressable>
        <Text className="text-white text-lg font-bold flex-1">{existing ? "Modifier mon profil" : "Créer mon profil entreprise"}</Text>
      </View>
      <View className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Nom de l{"'"}entreprise *</Text>
          <TextInput value={companyName} onChangeText={text => setCompanyName(text)} placeholder="Mon entreprise"
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Secteur *</Text>
          <TextInput value={sector} onChangeText={text => setSector(text)} placeholder="Tech & Digital, BTP, Santé..."
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Description *</Text>
          <TextInput value={description} onChangeText={text => setDescription(text)} placeholder="Décrivez votre entreprise..."
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle}  multiline textAlignVertical="top"/>
        </View>
        <View className="gap-3">
          <View>
            <Text className="text-white/60 text-xs mb-1 block">Ville *</Text>
            <TextInput value={city} onChangeText={text => setCity(text)} placeholder="Abidjan"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
          </View>
          <View>
            <Text className="text-white/60 text-xs mb-1 block">Année création</Text>
            <TextInput value={foundedYear} onChangeText={text => setFoundedYear(text)} placeholder="2020"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle}  keyboardType="numeric"/>
          </View>
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Adresse</Text>
          <TextInput value={address} onChangeText={text => setAddress(text)} placeholder="Quartier, rue..."
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
        </View>
        <View className="gap-3">
          <View>
            <Text className="text-white/60 text-xs mb-1 block">Téléphone</Text>
            <TextInput value={phone} onChangeText={text => setPhone(text)} placeholder="+225 07..."
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
          </View>
          <View>
            <Text className="text-white/60 text-xs mb-1 block">Employés</Text>
            <TextInput value={employeeCount} onChangeText={text => setEmployeeCount(text)} placeholder="1-10, 11-50..."
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
          </View>
        </View>
        <View>
          <Text className="text-white/60 text-xs mb-1 block">Site web</Text>
          <TextInput value={website} onChangeText={text => setWebsite(text)} placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl text-white text-sm outline-none placeholder:text-white/30" style={inputStyle} />
        </View>
      </View>
      <View className="flex-shrink-0 px-4 pb-6">
        <Pressable onPress={handleSubmit} disabled={loading}
          className="w-full py-3.5 rounded-xl text-white font-semibold disabled:opacity-50"
          style={{  }}>
          {loading ? "Enregistrement..." : existing ? "Mettre à jour" : "Créer le profil"}
        </Pressable>
      </View>
    </View>
  );
}

// ─── Inner component (authenticated) ──────────────────────────────────────────
function BusinessPageInner({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"annuaire" | "stats" | "opportunites">("annuaire");
  const [filter, setFilter] = useState("Tout");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DisplayBusiness | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Backend data
  const myProfile = useQuery(api.employment.getBusinessProfile, {});
  const backendProfiles = useQuery(api.employment.listBusinessProfiles, {
    sector: filter !== "Tout" ? filter : undefined,
  });

  // Combine backend profiles with static samples
  const backendDisplayed: DisplayBusiness[] = (backendProfiles ?? []).map(mapProfileToDisplay);
  const allBusinesses = [...backendDisplayed, ...SAMPLE_BUSINESSES];

  // Dedupe by name (backend takes priority)
  const seenNames = new Set<string>();
  const uniqueBusinesses: DisplayBusiness[] = [];
  for (const biz of allBusinesses) {
    const key = biz.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      uniqueBusinesses.push(biz);
    }
  }

  const filtered = uniqueBusinesses.filter(b =>
    (filter === "Tout" || b.sector === filter) &&
    (b.name.toLowerCase().includes(search.toLowerCase()) || b.sector.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <View className="h-full flex flex-col" style={{  }}>
      <View className="flex-shrink-0 px-4 pt-12 pb-3">
        <View className="flex items-center gap-3 mb-4">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">Business & Entreprises</Text>
            <Text className="text-xs text-white/50">Annuaire, stats & opportunités</Text>
          </View>
          <Pressable onPress={() => setShowProfileModal(true)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{  }}>
            <Plus size={18} className="text-white" />
          </Pressable>
        </View>

        {/* My profile banner */}
        {myProfile && (
          <Pressable className="mb-3 p-3 rounded-xl flex items-center gap-3" onPress={() => setShowProfileModal(true)}
            style={{ backgroundColor: "rgba(99,102,241,0.1)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)", borderStyle: "solid" }}>
            <View className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs"
              style={{  }}>
              {myProfile.companyName.slice(0, 2).toUpperCase()}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-sm font-medium truncate">{myProfile.companyName}</Text>
              <Text className="text-indigo-400/80 text-xs">{myProfile.sector} · {myProfile.city}</Text>
            </View>
            <Text className="text-indigo-400 text-xs">Modifier</Text>
          </Pressable>
        )}

        <View className="flex gap-1 p-1 rounded-xl mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["annuaire", "stats", "opportunites"] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)}
              className="flex-1 py-2 rounded-lg text-xs font-medium"
              style={{ backgroundColor: tab === t ? "rgba(99,102,241,0.5)" : "transparent" }}>
              {t === "annuaire" ? "Annuaire" : t === "stats" ? "Statistiques" : "Opportunités"}
            </Pressable>
          ))}
        </View>

        {tab === "annuaire" && (
          <>
            <View className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
              <Search size={16} className="text-white/40" />
              <TextInput value={search} onChangeText={text => setSearch(text)} placeholder="Nom, secteur..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
            </View>
            <View className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SECTORS.map(s => (
                <Pressable key={s} onPress={() => setFilter(s)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: filter === s ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)" }}>
                  {s}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      <View className="flex-1 overflow-y-auto px-4 pb-6">
        {tab === "annuaire" && (
          <View className="space-y-4">
            {backendProfiles === undefined ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)
            ) : filtered.length === 0 ? (
              <Text className="text-white/40 text-sm text-center py-8">Aucune entreprise trouvée</Text>
            ) : (
              filtered.map((biz, i) => (
                <Pressable key={biz.id}
                  className="rounded-2xl overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
                  onPress={() => setSelected(biz)}>
                  <Image className="w-full h-32 object-cover"  source={{ uri: biz.image }} accessibilityLabel={biz.name}/>
                  <View className="p-3">
                    <View className="flex items-start gap-3">
                      <View className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{  }}>{biz.avatar}</View>
                      <View className="flex-1">
                        <View className="flex items-center gap-2">
                          <Text className="text-white font-semibold text-sm">{biz.name}</Text>
                          {biz.verified && <CheckCircle size={13} className="text-indigo-400" />}
                        </View>
                        <Text className="text-indigo-400/80 text-xs">{biz.sector}</Text>
                        <View className="flex items-center gap-1 mt-0.5"><MapPin size={11} className="text-white/40" /><Text className="text-white/50 text-xs">{biz.location}</Text></View>
                      </View>
                      <View className="flex items-center gap-1"><Star size={12} className="text-amber-400 fill-amber-400" /><Text className="text-white text-xs font-semibold">{biz.rating}</Text></View>
                    </View>
                    <View className="flex items-center gap-2 mt-2">
                      <Text className="text-green-400 text-xs font-semibold">{biz.revenue}</Text>
                      <Text className="text-white/30 text-xs">{biz.employees} employés</Text>
                      <View className="flex gap-1 ml-auto">
                        {biz.tags.map(t => (
                          <Text key={t} className="px-2 py-0.5 rounded text-xs text-white/60" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>{t}</Text>
                        ))}
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        )}

        {tab === "stats" && (
          <View className="space-y-4">
            <View className="gap-3">
              {METRICS.map(({ label, value, icon: Icon, color, trend }, i) => (
                <View key={label}
                  className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Icon size={20} style={{ color }} className="mb-2" />
                  <Text className="text-white font-bold text-xl">{value}</Text>
                  <Text className="text-white/50 text-xs">{label}</Text>
                  <Text className="text-green-400 text-xs font-semibold mt-1">{trend}</Text>
                </View>
              ))}
            </View>

            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
              <Text className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-400" />Secteurs dominants
              </Text>
              {[
                { sector: "Commerce & Distribution", share: 32, color: "#6366F1" },
                { sector: "BTP & Construction", share: 24, color: "#F59E0B" },
                { sector: "Services & Conseil", share: 18, color: "#10B981" },
                { sector: "Tech & Digital", share: 14, color: "#EC4899" },
                { sector: "Agroalimentaire", share: 12, color: "#F97316" },
              ].map(({ sector, share, color }) => (
                <View key={sector} className="mb-2.5">
                  <View className="flex justify-between mb-1">
                    <Text className="text-white/70 text-xs">{sector}</Text>
                    <Text className="text-xs font-semibold" style={{ color }}>{share}%</Text>
                  </View>
                  <View className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <View className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </View>
                </View>
              ))}
            </View>

            <View className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(16,185,129,0.07)", borderWidth: 1, borderColor: "rgba(16,185,129,0.2)", borderStyle: "solid" }}>
              <Text className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-green-400" />Croissance mensuelle
              </Text>
              <View className="flex items-end gap-1.5 h-20">
                {[40, 55, 48, 62, 58, 75, 68, 80, 72, 88, 82, 95].map((h, idx) => (
                  <View key={idx}
                    className="flex-1 rounded-t-sm" style={{ backgroundColor: `rgba(16,185,129,${0.3 + (h / 100) * 0.5})` }} />
                ))}
              </View>
              <View className="flex justify-between mt-1">
                <Text className="text-white/30 text-xs">Jan</Text><Text className="text-white/30 text-xs">Déc</Text>
              </View>
            </View>
          </View>
        )}

        {tab === "opportunites" && (
          <View className="space-y-4">
            {[
              { title: "Appel d'offres – Réhabilitation routière", org: "Ministère Infrastructures", budget: "12Mds FCFA", deadline: "30 jan 2025", type: "Public", icon: Target, color: "#6366F1" },
              { title: "Partenariat distribution – BNETD", org: "BNETD Côte d'Ivoire", budget: "N/A", deadline: "15 fév 2025", type: "Partenariat", icon: Award, color: "#F59E0B" },
              { title: "Financement PME – Fonds PMEII", org: "Banque Mondiale", budget: "500M FCFA", deadline: "28 fév 2025", type: "Financement", icon: DollarSign, color: "#10B981" },
              { title: "Incubation StartupCI – Saison 6", org: "CIE Digital", budget: "Programme offert", deadline: "10 mars 2025", type: "Incubation", icon: Zap, color: "#EC4899" },
              { title: "Fournitures bureau – Mairie Abidjan", org: "Mairie d'Abidjan", budget: "80M FCFA", deadline: "5 avril 2025", type: "Public", icon: Package, color: "#F97316" },
            ].map((opp, i) => {
              const Icon = opp.icon;
              return (
                <View key={opp.title}
                  className="p-4 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <View className="flex items-start gap-3">
                    <View className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${opp.color}20` }}>
                      <Icon size={18} style={{ color: opp.color }} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm">{opp.title}</Text>
                      <Text className="text-white/50 text-xs mt-0.5">{opp.org}</Text>
                      <View className="flex items-center gap-3 mt-2">
                        <Text className="text-green-400 text-xs font-semibold">{opp.budget}</Text>
                        <Text className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${opp.color}20`, color: opp.color }}>{opp.type}</Text>
                        <View className="flex items-center gap-1 ml-auto"><Clock size={11} className="text-white/30" /><Text className="text-white/40 text-xs">{opp.deadline}</Text></View>
                      </View>
                    </View>
                  </View>
                  <Pressable className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium" style={{ backgroundColor: `${opp.color}20`, borderStyle: "solid" }}>
                    <Text>Postuler / En savoir plus</Text></Pressable>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Detail sheet */}
      <>
        {selected && (
          <View className="absolute inset-0 z-50 flex flex-col"
            style={{  }}>
            <View className="relative flex-shrink-0">
              <Image className="w-full h-52 object-cover"  source={{ uri: selected.image }} accessibilityLabel={selected.name}/>
              <View className="absolute inset-0" style={{  }} />
              <Pressable onPress={() => setSelected(null)} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <X size={20} className="text-white" />
              </Pressable>
              <View className="absolute bottom-4 left-4 right-4">
                <View className="flex items-center gap-2 mb-1">
                  {selected.tags.map(t => <Text key={t} className="px-2 py-0.5 rounded text-xs text-white/70" style={{ backgroundColor: "rgba(99,102,241,0.4)" }}>{t}</Text>)}
                  {selected.verified && <Text className="flex items-center gap-1 text-xs text-indigo-300"><CheckCircle size={12} />Vérifié</Text>}
                </View>
                <Text className="text-white text-xl font-bold">{selected.name}</Text>
                <Text className="text-indigo-400 text-sm">{selected.sector}</Text>
              </View>
            </View>
            <View className="flex-1 overflow-y-auto px-4 pb-6 pt-4">
              <Text className="text-white/70 text-sm mb-4">{selected.desc}</Text>
              <View className="gap-3 mb-4">
                {[
                  { label: "Fondée", value: selected.founded },
                  { label: "Employés", value: selected.employees },
                  { label: "CA annuel", value: selected.revenue },
                ].map(({ label, value }) => (
                  <View key={label} className="p-3 rounded-xl text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                    <Text className="text-indigo-400 font-bold text-sm">{value}</Text>
                    <Text className="text-white/50 text-xs">{label}</Text>
                  </View>
                ))}
              </View>
              {selected.services.length > 0 && (
                <>
                  <Text className="text-white font-semibold text-sm mb-2">Services proposés</Text>
                  <View className="flex flex-wrap gap-2 mb-4">
                    {selected.services.map(s => (
                      <Text key={s} className="px-3 py-1.5 rounded-lg text-xs text-white/70" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>{s}</Text>
                    ))}
                  </View>
                </>
              )}
              <View className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                <MapPin size={16} className="text-indigo-400" />
                <Text className="text-white/70 text-sm">{selected.location}</Text>
                <View className="flex items-center gap-1 ml-auto"><Star size={13} className="text-amber-400 fill-amber-400" /><Text className="text-white font-semibold text-sm">{selected.rating}</Text><Text className="text-white/40 text-xs">({selected.reviews})</Text></View>
              </View>
              <View className="flex gap-3">
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-semibold"
                  style={{  }}>
                  <Phone size={16} /><Text>Contacter</Text></Pressable>
                <Pressable className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}>
                  <Globe size={16} className="text-white" /><Text className="text-white text-sm"><Text>Site web</Text></Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </>

      {/* Profile edit modal */}
      <>
        {showProfileModal && (
          <BusinessProfileModal onClose={() => setShowProfileModal(false)} existing={myProfile} />
        )}
      </>
    </View>
  );
}

// ─── Main export with auth handling ──────────────────────────────────────────
export default function BusinessPage({ onBack }: { onBack: () => void }) {
  return (
    <>
      <Authenticated>
        <BusinessPageInner onBack={onBack} />
      </Authenticated>
      <Unauthenticated>
        <View className="h-full flex flex-col items-center justify-center px-6" style={{  }}>
          <Pressable onPress={onBack} className="absolute top-12 left-4 w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <Building2 size={48} className="text-indigo-400 mb-4" />
          <Text className="text-white text-lg font-bold mb-2">Business & Entreprises</Text>
          <Text className="text-white/50 text-sm text-center mb-6">Connectez-vous pour accéder à l{"'"}annuaire et créer votre profil entreprise.</Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <AuthLoading>
        <View className="h-full flex flex-col px-4 pt-16" style={{  }}>
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-3" />
          <Skeleton className="h-52 w-full rounded-2xl mb-3" />
          <Skeleton className="h-52 w-full rounded-2xl" />
        </View>
      </AuthLoading>
    </>
  );
}
