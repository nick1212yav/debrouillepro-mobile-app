import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, TextInput } from "react-native";
import {
  ArrowLeft,
  Search,
  Phone,
  MapPin,
  X,
  Plus,
  Home,
  Building,
} from "lucide-react-native";
import { useState } from "react";
import { useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton";
import { SignInButton } from "@/components/ui/signin";

// ✅ Imports du nouveau module immobilier
import type { Property } from "@/features/immo";
import { PropertyCard } from "@/features/immo";

// Placeholder pour CreatePropertySheet (à implémenter plus tard)
function CreatePropertySheetPlaceholder({ onClose }: { onClose: () => void }) {
  return (
    <View className="p-4 text-white">
      <Text className="font-bold text-lg mb-2">Publier un bien</Text>
      <Text className="text-white/50 text-sm">Formulaire de création à venir.</Text>
      <Pressable
        onPress={onClose}
        className="mt-4 px-4 py-2 bg-white/10 rounded-xl text-white"
      >
        <Text>Fermer</Text></Pressable>
    </View>
  );
}

function ImmoContent({ onBack }: { onBack: () => void }) {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Property | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const filters = ["Tous", "Louer", "Acheter"];

  const filterArgs =
    activeFilter === "Louer"
      ? { status: "available" as const }
      : activeFilter === "Acheter"
        ? { status: "available" as const }
        : {};
  const { results, status, loadMore } = usePaginatedQuery(
    api.realestate.listProperties,
    filterArgs,
    { initialNumItems: 10 },
  );

  const searchResults = useQuery(
    api.realestate.searchProperties,
    search.length > 2 ? { q: search } : "skip",
  );
  const displayedItems = search.length > 2 ? (searchResults ?? []) : results;

  return (
    <View
      className="h-full flex flex-col"
      style={{  }}
    >
      <View
        className="px-5 pt-5 pb-3 flex-shrink-0"
      >
        <View className="flex items-center gap-3 mb-4">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-xl font-bold text-white">Immobilier</Text>
            <Text className="text-xs" style={{ color: "#F97316" }}>
              Louer · Acheter · Visiter
            </Text>
          </View>
          <Pressable
            onPress={() => setShowCreate(true)}
            className="ml-auto w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(249,115,22,0.15)", borderWidth: 1, borderColor: "rgba(249,115,22,0.3)", borderStyle: "solid" }}
          >
            <Plus size={16} style={{ color: "#F97316" }} />
          </Pressable>
        </View>
        <View
          className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Search size={16} className="text-white/40" />
          <TextInput
            value={search}
            onChangeText={(text) => setSearch(text)}
            placeholder="Rechercher un logement…"
            className="flex-1 bg-transparent text-white placeholder:text-white/35 text-sm outline-none"
          />
        </View>
        <View
          className="flex gap-2 mt-3 overflow-x-auto pb-1"
          style={{  }}
        >
          {filters.map((f) => (
            <Pressable
              key={f}
              onPress={() => setActiveFilter(f)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold"
              style={
                activeFilter === f
                  ? {  }
                  : { backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }
              }
            >
              {f}
            </Pressable>
          ))}
        </View>
      </View>

      <View
        className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4"
        style={{  }}
      >
        {status === "LoadingFirstPage" &&
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-3xl" />
          ))}
        {displayedItems.length === 0 && status !== "LoadingFirstPage" && (
          <View className="flex flex-col items-center justify-center py-16 gap-3">
            <Home size={40} className="text-white/15" />
            <Text className="text-white/40 text-sm">
              Aucune annonce pour le moment
            </Text>
            <Pressable
              onPress={() => setShowCreate(true)}
              className="px-5 py-2.5 rounded-2xl text-sm font-bold text-white"
              style={{  }}
            >
              <Text>Publier la première annonce</Text></Pressable>
          </View>
        )}
        {(displayedItems as Property[]).map((item, i) => (
          <View key={item._id}>
            <PropertyCard
              publication={item as any}
              index={i}
              onLike={() => {}}
              onComment={() => {}}
              onShare={() => {}}
              onBookmark={() => {}}
            />
          </View>
        ))}
        {status === "CanLoadMore" && (
          <Pressable
            onPress={() => loadMore(10)}
            className="w-full py-3 rounded-2xl text-sm text-white/50"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Text>Charger plus</Text></Pressable>
        )}
      </View>

      <>
        {selectedItem && (
          <>
            <Pressable
              onPress={() => setSelectedItem(null)}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
            />
            <View
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl flex flex-col"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "80vh" }}
            >
              <View className="flex justify-center pt-3 flex-shrink-0">
                <View className="w-10 h-1 rounded-full bg-white/20" />
              </View>
              <View className="flex items-center justify-between px-5 py-3 flex-shrink-0">
                <View>
                  <Text className="text-white font-black text-lg">
                    {selectedItem.title}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setSelectedItem(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                >
                  <X size={15} className="text-white/60" />
                </Pressable>
              </View>
              <View
                className="flex-1 overflow-y-auto px-5 pb-8"
                style={{  }}
              >
                <Text
                  className="font-black text-lg mb-2"
                  style={{ color: "#F97316" }}
                >
                  {selectedItem.price.toLocaleString()} {selectedItem.currency}
                  {selectedItem.transactionType === "location" ? "/mois" : ""}
                </Text>
                <Text className="text-white/50 text-sm mb-4">
                  {selectedItem.description || "Aucune description disponible."}
                </Text>
                {selectedItem.amenities &&
                  selectedItem.amenities.length > 0 && (
                    <View className="flex flex-wrap gap-2 mb-4">
                      {selectedItem.amenities.map((a) => (
                        <Text
                          key={a}
                          className="px-3 py-1 rounded-full text-xs text-white/50"
                          style={{ backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
                        >
                          {a}
                        </Text>
                      ))}
                    </View>
                  )}
                <View className="flex gap-2">
                  <Pressable
                    onPress={() => UIService.openToast("Appel en cours…", "info")}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: "rgba(16,185,129,0.2)" }}
                  >
                    <Phone size={14} /> <Text>Appeler le propriétaire</Text></Pressable>
                </View>
              </View>
            </View>
          </>
        )}
        {showCreate && (
          <CreatePropertySheetPlaceholder
            onClose={() => setShowCreate(false)}
          />
        )}
      </>
    </View>
  );
}

interface ImmoPageProps {
  onBack: () => void;
}

export default function ImmoPage({ onBack }: ImmoPageProps) {
  return (
    <>
      <AuthLoading>
        <View
          className="h-full flex items-center justify-center"
          style={{  }}
        >
          <View className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-80 rounded-3xl" />
            ))}
          </View>
        </View>
      </AuthLoading>
      <Unauthenticated>
        <View
          className="h-full flex flex-col items-center justify-center gap-4 px-6"
          style={{  }}
        >
          <Pressable
            onPress={onBack}
            className="self-start w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            <ArrowLeft size={18} className="text-white" />
          </Pressable>
          <Building size={48} className="text-white/20" />
          <Text className="text-white font-bold text-lg">Connectez-vous</Text>
          <Text className="text-white/40 text-sm text-center">
            Accédez aux annonces immobilières et publiez vos biens
          </Text>
          <SignInButton />
        </View>
      </Unauthenticated>
      <Authenticated>
        <ImmoContent onBack={onBack} />
      </Authenticated>
    </>
  );
}
