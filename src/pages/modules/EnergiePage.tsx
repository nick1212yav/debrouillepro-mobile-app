import React, { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import {
  AlertTriangle,
  ArrowLeft,
  Battery,
  CheckCircle,
  DollarSign,
  Leaf,
  RefreshCw,
  Sun,
  Zap,
} from "lucide-react-native";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type EnergyTab = "dashboard" | "consumption" | "providers";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const TABS: {
  id: EnergyTab;
  label: string;
}[] = [
  {
    id: "dashboard",
    label: "Tableau de bord",
  },
  {
    id: "consumption",
    label: "Consommation",
  },
  {
    id: "providers",
    label: "Fournisseurs",
  },
];

/* -------------------------------------------------------------------------- */
/* Small reusable components                                                  */
/* -------------------------------------------------------------------------- */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 11,
      }}
    >
      {children}
    </Text>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
        paddingVertical: 55,
      }}
    >
      {icon}

      <Text
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 14,
          fontWeight: "700",
          textAlign: "center",
          marginTop: 14,
        }}
      >
        {title}
      </Text>

      <Text
        style={{
          color: "rgba(255,255,255,0.3)",
          fontSize: 11,
          lineHeight: 17,
          textAlign: "center",
          marginTop: 6,
        }}
      >
        {description}
      </Text>
    </View>
  );
}

function MetricCard({
  icon,
  label,
  value,
  caption,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  accent: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 105,
        padding: 13,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor: `${accent}45`,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
        }}
      >
        {icon}

        <Text
          style={{
            color: "rgba(255,255,255,0.42)",
            fontSize: 10,
            fontWeight: "600",
          }}
        >
          {label}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        style={{
          color: "#FFFFFF",
          fontSize: 17,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: accent,
          fontSize: 9,
          fontWeight: "700",
          marginTop: 3,
        }}
      >
        {caption}
      </Text>
    </View>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "neutral";
}) {
  const colors = {
    success: {
      text: "#34D399",
      bg: "rgba(16,185,129,0.13)",
      border: "rgba(16,185,129,0.22)",
    },
    warning: {
      text: "#FBBF24",
      bg: "rgba(245,158,11,0.13)",
      border: "rgba(245,158,11,0.22)",
    },
    neutral: {
      text: "rgba(255,255,255,0.58)",
      bg: "rgba(255,255,255,0.06)",
      border: "rgba(255,255,255,0.09)",
    },
  };

  const color = colors[tone];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: color.bg,
        borderWidth: 1,
        borderColor: color.border,
      }}
    >
      <Text
        style={{
          color: color.text,
          fontSize: 9,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

function EnergieSettings() {
  const settings = useQuery(api.urban.getEnergySettings);

  const saveSettings = useMutation(api.urban.saveEnergySettings);

  const [saving, setSaving] = useState(false);

  const autoSave = settings?.autoSave ?? false;
  const solarAlerts = settings?.solarAlerts ?? false;

  const toggle = async (field: "autoSave" | "solarAlerts") => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await saveSettings({
        autoSave: field === "autoSave" ? !autoSave : autoSave,

        solarAlerts: field === "solarAlerts" ? !solarAlerts : solarAlerts,
      });
    } catch {
      Alert.alert("Paramètres", "Impossible d'enregistrer ce changement.");
    } finally {
      setSaving(false);
    }
  };

  if (settings === undefined) {
    return (
      <View
        style={{
          padding: 16,
          borderRadius: 18,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
          }}
        >
          Chargement des paramètres…
        </Text>
      </View>
    );
  }

  const items = [
    {
      label: "Mode économie automatique",
      description:
        "Utilise les paramètres disponibles pour réduire la consommation.",
      value: autoSave,
      field: "autoSave" as const,
    },
    {
      label: "Alertes solaires",
      description: "Active les alertes liées aux données solaires disponibles.",
      value: solarAlerts,
      field: "solarAlerts" as const,
    },
  ];

  return (
    <View style={{ gap: 9 }}>
      {items.map((item) => (
        <View
          key={item.field}
          style={{
            minHeight: 68,
            padding: 14,
            borderRadius: 17,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: "700",
              }}
            >
              {item.label}
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                lineHeight: 15,
                marginTop: 3,
              }}
            >
              {item.description}
            </Text>
          </View>

          <Pressable
            disabled={saving}
            onPress={() => {
              void toggle(item.field);
            }}
            accessibilityRole="switch"
            accessibilityState={{
              checked: item.value,
              disabled: saving,
            }}
            style={{
              width: 48,
              height: 28,
              borderRadius: 999,
              justifyContent: "center",
              paddingHorizontal: 4,
              backgroundColor: item.value ? "#FBBF24" : "rgba(255,255,255,0.1)",
              opacity: saving ? 0.55 : 1,
            }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#FFFFFF",
                alignSelf: item.value ? "flex-end" : "flex-start",
              }}
            />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

function DashboardTab() {
  /*
   * Important:
   * Aucun chiffre énergétique n'est inventé ici.
   *
   * Lorsque les APIs de mesure seront connectées,
   * cette section pourra afficher :
   * - production réelle
   * - consommation réelle
   * - stockage réel
   * - économies calculées sur données réelles
   */

  return (
    <View>
      <View
        style={{
          padding: 16,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.045)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          marginBottom: 18,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(251,191,36,0.13)",
            }}
          >
            <Zap size={19} color="#FBBF24" />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Centre énergétique
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Données énergétiques connectées
            </Text>
          </View>

          <StatusBadge label="EN ATTENTE DE DONNÉES" tone="neutral" />
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.48)",
            fontSize: 11,
            lineHeight: 17,
            marginTop: 14,
          }}
        >
          Aucun compteur, équipement solaire ou batterie n'est actuellement
          associé à ce compte par une source de données vérifiée.
        </Text>
      </View>

      <SectionTitle>Vue énergétique</SectionTitle>

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 9,
          marginBottom: 20,
        }}
      >
        <MetricCard
          icon={<Sun size={13} color="#FBBF24" />}
          label="Production"
          value="—"
          caption="Aucune donnée"
          accent="#FBBF24"
        />

        <MetricCard
          icon={<Zap size={13} color="#EF4444" />}
          label="Consommation"
          value="—"
          caption="Aucune donnée"
          accent="#EF4444"
        />

        <MetricCard
          icon={<Battery size={13} color="#34D399" />}
          label="Stockage"
          value="—"
          caption="Aucune donnée"
          accent="#34D399"
        />
      </View>

      <SectionTitle>État du système</SectionTitle>

      <EmptyState
        icon={<Battery size={42} color="rgba(255,255,255,0.16)" />}
        title="Aucun équipement connecté"
        description="Connecte une source énergétique ou un équipement pris en charge lorsque l'intégration correspondante sera disponible."
      />

      <SectionTitle>Paramètres</SectionTitle>

      <Authenticated>
        <EnergieSettings />
      </Authenticated>

      <Unauthenticated>
        <View
          style={{
            padding: 15,
            borderRadius: 17,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: 11,
              lineHeight: 17,
            }}
          >
            Connecte-toi pour gérer les paramètres énergétiques associés à ton
            compte.
          </Text>
        </View>
      </Unauthenticated>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Consumption                                                                */
/* -------------------------------------------------------------------------- */

function ConsumptionTab() {
  return (
    <View>
      <View
        style={{
          padding: 17,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.045)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginBottom: 14,
          }}
        >
          <BarIcon />

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Analyse de consommation
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Répartition par équipement
            </Text>
          </View>
        </View>

        <View
          style={{
            padding: 15,
            borderRadius: 16,
            backgroundColor: "rgba(255,255,255,0.035)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.52)",
              fontSize: 11,
              lineHeight: 17,
            }}
          >
            Les données de consommation ne sont pas disponibles pour ce compte.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionTitle>Conseils</SectionTitle>

        <View
          style={{
            padding: 15,
            borderRadius: 18,
            backgroundColor: "rgba(16,185,129,0.07)",
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.17)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 9,
              marginBottom: 7,
            }}
          >
            <Leaf size={16} color="#34D399" />

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              Optimisation énergétique
            </Text>
          </View>

          <Text
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 11,
              lineHeight: 17,
            }}
          >
            Les recommandations personnalisées seront calculées lorsqu'une
            source de consommation réelle sera disponible.
          </Text>
        </View>
      </View>
    </View>
  );
}

function BarIcon() {
  return (
    <View
      style={{
        width: 40,
        height: 40,
        borderRadius: 13,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(99,102,241,0.13)",
      }}
    >
      <Zap size={18} color="#818CF8" />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Providers                                                                  */
/* -------------------------------------------------------------------------- */

function ProvidersTab() {
  return (
    <View>
      <View
        style={{
          padding: 18,
          borderRadius: 22,
          backgroundColor: "rgba(255,255,255,0.045)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(251,191,36,0.12)",
            marginBottom: 13,
          }}
        >
          <Sun size={20} color="#FBBF24" />
        </View>

        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 15,
            fontWeight: "800",
          }}
        >
          Fournisseurs énergétiques
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.42)",
            fontSize: 11,
            lineHeight: 18,
            marginTop: 6,
          }}
        >
          Aucun catalogue fournisseur vérifié n'est actuellement connecté à
          cette interface.
        </Text>

        <View
          style={{
            marginTop: 15,
            padding: 12,
            borderRadius: 13,
            backgroundColor: "rgba(255,255,255,0.035)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.36)",
              fontSize: 10,
              lineHeight: 16,
            }}
          >
            Les fournisseurs, tarifs, zones de couverture, coordonnées et
            niveaux de service devront provenir d'une source backend vérifiée
            avant d'être affichés.
          </Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        <SectionTitle>Simulation</SectionTitle>

        <EmptyState
          icon={<DollarSign size={40} color="rgba(255,255,255,0.16)" />}
          title="Simulation indisponible"
          description="Un calcul de retour sur investissement nécessite des données réelles concernant l'installation, le tarif et la consommation."
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main page                                                                  */
/* -------------------------------------------------------------------------- */

export default function EnergiePage({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<EnergyTab>("dashboard");

  /*
   * Le refresh visuel est volontairement limité :
   * aucune promesse de synchronisation tant qu'aucune
   * query de mesure énergétique n'est disponible.
   */
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    if (refreshing) {
      return;
    }

    setRefreshing(true);

    /*
     * Pas de faux refetch.
     *
     * Lorsque les queries de télémétrie seront branchées,
     * cette action pourra déclencher leur invalidation /
     * synchronisation réelle.
     */
    setTimeout(() => {
      setRefreshing(false);
    }, 350);
  };

  const currentContent = useMemo(() => {
    if (activeTab === "consumption") {
      return <ConsumptionTab />;
    }

    if (activeTab === "providers") {
      return <ProvidersTab />;
    }

    return <DashboardTab />;
  }, [activeTab]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050812",
      }}
    >
      {/* Ambient background */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: 140,
          top: -170,
          right: -110,
          backgroundColor: "rgba(251,191,36,0.055)",
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 240,
          height: 240,
          borderRadius: 120,
          bottom: -130,
          left: -120,
          backgroundColor: "rgba(16,185,129,0.035)",
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 18 : 14,
          paddingBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
          }}
        >
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => ({
              width: 41,
              height: 41,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: pressed
                ? "rgba(255,255,255,0.13)"
                : "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            })}
          >
            <ArrowLeft size={19} color="#FFFFFF" />
          </Pressable>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "900",
              }}
            >
              Énergie
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 11,
                marginTop: 2,
              }}
            >
              Production · consommation · stockage
            </Text>
          </View>

          <Pressable
            onPress={handleRefresh}
            accessibilityRole="button"
            accessibilityLabel="Actualiser les données"
            style={{
              width: 41,
              height: 41,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(251,191,36,0.12)",
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.2)",
            }}
          >
            <RefreshCw
              size={16}
              color="#FBBF24"
              style={{
                transform: [
                  {
                    rotate: refreshing ? "180deg" : "0deg",
                  },
                ],
              }}
            />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={{
          paddingHorizontal: 16,
          marginBottom: 10,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 6,
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  paddingHorizontal: 14,
                  minHeight: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active
                    ? "rgba(251,191,36,0.15)"
                    : "rgba(255,255,255,0.045)",
                  borderWidth: 1,
                  borderColor: active
                    ? "rgba(251,191,36,0.3)"
                    : "rgba(255,255,255,0.07)",
                }}
              >
                <Text
                  style={{
                    color: active ? "#FBBF24" : "rgba(255,255,255,0.45)",
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 35,
        }}
      >
        {currentContent}

        <View
          style={{
            marginTop: 24,
            padding: 13,
            borderRadius: 15,
            backgroundColor: "rgba(255,255,255,0.025)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertTriangle size={13} color="rgba(255,255,255,0.3)" />

            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.3)",
                fontSize: 9,
                lineHeight: 14,
              }}
            >
              Les informations énergétiques affichées doivent provenir de
              sources connectées et vérifiées. Aucun indicateur fictif n'est
              utilisé.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
