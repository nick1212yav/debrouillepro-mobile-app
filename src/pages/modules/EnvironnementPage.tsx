import React, { useState } from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  CloudRain,
  Droplets,
  Info,
  Leaf,
  MapPin,
  Recycle,
  RefreshCw,
  Sun,
  Thermometer,
  TreePine,
  Wind,
  Zap,
} from "lucide-react-native";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type EnvironmentTab = "bilan" | "actions" | "recyclage";

/* -------------------------------------------------------------------------- */
/* UI constants                                                               */
/* -------------------------------------------------------------------------- */

const TABS: {
  id: EnvironmentTab;
  label: string;
}[] = [
  {
    id: "bilan",
    label: "Bilan",
  },
  {
    id: "actions",
    label: "Éco-gestes",
  },
  {
    id: "recyclage",
    label: "Recyclage",
  },
];

/* -------------------------------------------------------------------------- */
/* Generic components                                                         */
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
        paddingVertical: 52,
      }}
    >
      {icon}

      <Text
        style={{
          color: "rgba(255,255,255,0.58)",
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
          color: "rgba(255,255,255,0.32)",
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

function SourceBadge({ label }: { label: string }) {
  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.055)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.09)",
      }}
    >
      <Text
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: 8,
          fontWeight: "800",
          letterSpacing: 0.5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Bilan                                                                      */
/* -------------------------------------------------------------------------- */

function BilanTab() {
  /*
   * Aucun indicateur environnemental n'est inventé.
   *
   * Les anciennes constantes AIR_INDEX / INDICATORS / ALERTS
   * ont volontairement été supprimées.
   *
   * Une donnée institutionnelle doit être rattachée à une
   * source vérifiable avant d'être présentée à l'utilisateur.
   */

  return (
    <View>
      <View
        style={{
          padding: 17,
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
            gap: 11,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(34,197,94,0.12)",
            }}
          >
            <Leaf size={20} color="#4ADE80" />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Observatoire environnemental
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Données vérifiées et traçables
            </Text>
          </View>

          <SourceBadge label="EN ATTENTE DE SOURCE" />
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            lineHeight: 18,
            marginTop: 14,
          }}
        >
          Aucun indicateur environnemental temps réel n'est actuellement
          disponible via une source connectée à cette interface.
        </Text>
      </View>

      <SectionTitle>Indicateurs environnementaux</SectionTitle>

      <View
        style={{
          gap: 9,
        }}
      >
        <IndicatorCard
          icon={<Wind size={17} color="#60A5FA" />}
          label="Qualité de l'air"
        />

        <IndicatorCard
          icon={<Thermometer size={17} color="#FBBF24" />}
          label="Température"
        />

        <IndicatorCard
          icon={<Droplets size={17} color="#38BDF8" />}
          label="Humidité"
        />

        <IndicatorCard
          icon={<CloudRain size={17} color="#818CF8" />}
          label="Précipitations"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionTitle>Alertes environnementales</SectionTitle>

        <EmptyState
          icon={<AlertTriangle size={40} color="rgba(255,255,255,0.15)" />}
          title="Aucune alerte vérifiée disponible"
          description="Les alertes doivent provenir d'une source environnementale ou d'une autorité habilitée."
        />
      </View>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: "rgba(99,102,241,0.07)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.15)",
          flexDirection: "row",
          gap: 9,
        }}
      >
        <Info size={15} color="#818CF8" />

        <Text
          style={{
            flex: 1,
            color: "rgba(255,255,255,0.43)",
            fontSize: 10,
            lineHeight: 16,
          }}
        >
          Chaque indicateur institutionnel devra conserver sa source, son
          horodatage et son statut de validation.
        </Text>
      </View>
    </View>
  );
}

function IndicatorCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        minHeight: 65,
        paddingHorizontal: 14,
        borderRadius: 17,
        flexDirection: "row",
        alignItems: "center",
        gap: 11,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {icon}

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {label}
        </Text>

        <Text
          style={{
            color: "rgba(255,255,255,0.3)",
            fontSize: 9,
            marginTop: 3,
          }}
        >
          Aucune mesure disponible
        </Text>
      </View>

      <Text
        style={{
          color: "rgba(255,255,255,0.22)",
          fontSize: 14,
          fontWeight: "800",
        }}
      >
        —
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Eco actions                                                                */
/* -------------------------------------------------------------------------- */

function ActionsTab() {
  const progress = useQuery(api.urban.getEcoProgress);

  const toggleEcoAction = useMutation(api.urban.toggleEcoAction);

  /*
   * Les actions existantes du backend restent utilisées,
   * mais aucun nouveau catalogue fictif n'est introduit.
   *
   * Si le backend ne retourne pas de catalogue d'actions,
   * nous ne fabriquons pas de défis.
   */

  const completedPoints =
    progress?.reduce(
      (total, item) => (item.done ? total + (item.points ?? 0) : total),
      0,
    ) ?? 0;

  const handleToggle = async (
    actionId: string,
    points: number,
    done: boolean,
  ) => {
    try {
      await toggleEcoAction({
        actionId,
        points,
        done: !done,
      });
    } catch {
      // Aucun toast Web :
      // l'état Convex reste la source de vérité.
    }
  };

  if (progress === undefined) {
    return (
      <EmptyState
        icon={<RefreshCw size={38} color="rgba(255,255,255,0.18)" />}
        title="Chargement des actions"
        description="Récupération de votre progression environnementale."
      />
    );
  }

  if (progress.length === 0) {
    return (
      <View>
        <View
          style={{
            padding: 17,
            borderRadius: 22,
            backgroundColor: "rgba(34,197,94,0.06)",
            borderWidth: 1,
            borderColor: "rgba(34,197,94,0.15)",
            marginBottom: 18,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
            }}
          >
            <Leaf size={21} color="#4ADE80" />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: "800",
                }}
              >
                Votre engagement
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontSize: 10,
                  marginTop: 3,
                }}
              >
                Progression enregistrée
              </Text>
            </View>

            <Text
              style={{
                color: "#4ADE80",
                fontSize: 20,
                fontWeight: "900",
              }}
            >
              {completedPoints}
            </Text>
          </View>
        </View>

        <EmptyState
          icon={<CheckCircle size={40} color="rgba(255,255,255,0.15)" />}
          title="Aucune action enregistrée"
          description="Les actions environnementales apparaîtront ici lorsqu'elles seront définies et disponibles dans le backend."
        />
      </View>
    );
  }

  return (
    <View>
      <View
        style={{
          padding: 17,
          borderRadius: 22,
          backgroundColor: "rgba(34,197,94,0.06)",
          borderWidth: 1,
          borderColor: "rgba(34,197,94,0.16)",
          marginBottom: 17,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.42)",
            fontSize: 10,
          }}
        >
          Points enregistrés
        </Text>

        <Text
          style={{
            color: "#4ADE80",
            fontSize: 31,
            fontWeight: "900",
            marginTop: 3,
          }}
        >
          {completedPoints}
        </Text>
      </View>

      <SectionTitle>Vos actions enregistrées</SectionTitle>

      {progress.map((item) => {
        const done = item.done;
        const points = item.points ?? 0;

        return (
          <Pressable
            key={item.actionId}
            onPress={() => void handleToggle(item.actionId, points, done)}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              minHeight: 68,
              padding: 13,
              borderRadius: 17,
              flexDirection: "row",
              alignItems: "center",
              gap: 11,
              backgroundColor: done
                ? "rgba(34,197,94,0.08)"
                : "rgba(255,255,255,0.04)",
              borderWidth: 1,
              borderColor: done
                ? "rgba(34,197,94,0.18)"
                : "rgba(255,255,255,0.07)",
              marginBottom: 8,
            })}
          >
            <View
              style={{
                width: 39,
                height: 39,
                borderRadius: 13,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: done
                  ? "rgba(34,197,94,0.16)"
                  : "rgba(255,255,255,0.06)",
              }}
            >
              {done ? (
                <CheckCircle size={18} color="#4ADE80" />
              ) : (
                <Leaf size={18} color="rgba(255,255,255,0.35)" />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: done ? "rgba(255,255,255,0.5)" : "#FFFFFF",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {item.actionId}
              </Text>

              <Text
                style={{
                  color: "rgba(255,255,255,0.3)",
                  fontSize: 9,
                  marginTop: 3,
                }}
              >
                Action enregistrée dans votre progression
              </Text>
            </View>

            <Text
              style={{
                color: "#4ADE80",
                fontSize: 10,
                fontWeight: "800",
              }}
            >
              +{points}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Recyclage                                                                  */
/* -------------------------------------------------------------------------- */

function RecyclageTab() {
  return (
    <View>
      <View
        style={{
          padding: 17,
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
            gap: 11,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(34,197,94,0.12)",
            }}
          >
            <Recycle size={20} color="#4ADE80" />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 14,
                fontWeight: "800",
              }}
            >
              Réseau de recyclage
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.38)",
                fontSize: 10,
                marginTop: 3,
              }}
            >
              Points de collecte vérifiés
            </Text>
          </View>
        </View>

        <Text
          style={{
            color: "rgba(255,255,255,0.42)",
            fontSize: 11,
            lineHeight: 17,
            marginTop: 13,
          }}
        >
          Aucun point de collecte n'est affiché sans enregistrement provenant
          d'une source vérifiée.
        </Text>
      </View>

      <SectionTitle>Catégories prises en charge</SectionTitle>

      <View
        style={{
          gap: 8,
        }}
      >
        <CategoryCard
          icon={<Recycle size={18} color="#60A5FA" />}
          label="Plastiques"
        />

        <CategoryCard
          icon={<Zap size={18} color="#FBBF24" />}
          label="Équipements électroniques"
        />

        <CategoryCard
          icon={<TreePine size={18} color="#4ADE80" />}
          label="Déchets organiques"
        />
      </View>

      <View style={{ marginTop: 20 }}>
        <SectionTitle>Points de collecte</SectionTitle>

        <EmptyState
          icon={<MapPin size={40} color="rgba(255,255,255,0.15)" />}
          title="Aucun point vérifié disponible"
          description="Les emplacements devront provenir du registre ou du service backend correspondant."
        />
      </View>
    </View>
  );
}

function CategoryCard({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <View
      style={{
        minHeight: 57,
        paddingHorizontal: 14,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      {icon}

      <Text
        style={{
          color: "rgba(255,255,255,0.72)",
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function EnvironnementPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<EnvironmentTab>("bilan");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050812",
      }}
    >
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 280,
          height: 280,
          borderRadius: 140,
          top: -170,
          right: -110,
          backgroundColor: "rgba(34,197,94,0.055)",
        }}
      />

      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: 230,
          height: 230,
          borderRadius: 115,
          bottom: -130,
          left: -100,
          backgroundColor: "rgba(16,185,129,0.035)",
        }}
      />

      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: Platform.OS === "ios" ? 18 : 14,
          paddingBottom: 11,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 11,
            marginBottom: 14,
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
              Environnement
            </Text>

            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 10,
                marginTop: 2,
              }}
            >
              Données · signalements · actions · recyclage
            </Text>
          </View>

          <View
            style={{
              width: 41,
              height: 41,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(34,197,94,0.12)",
              borderWidth: 1,
              borderColor: "rgba(34,197,94,0.2)",
            }}
          >
            <Leaf size={18} color="#4ADE80" />
          </View>
        </View>

        {/* Navigation */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: 6,
          }}
        >
          {TABS.map((item) => {
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={{
                  minHeight: 38,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active
                    ? "rgba(34,197,94,0.16)"
                    : "rgba(255,255,255,0.045)",
                  borderWidth: 1,
                  borderColor: active
                    ? "rgba(34,197,94,0.3)"
                    : "rgba(255,255,255,0.07)",
                }}
              >
                <Text
                  style={{
                    color: active ? "#4ADE80" : "rgba(255,255,255,0.42)",
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 35,
        }}
      >
        {tab === "bilan" ? <BilanTab /> : null}

        {tab === "actions" ? (
          <Authenticated>
            <ActionsTab />
          </Authenticated>
        ) : null}

        {tab === "actions" ? (
          <Unauthenticated>
            <EmptyState
              icon={<Leaf size={40} color="rgba(255,255,255,0.15)" />}
              title="Connexion requise"
              description="Connecte-toi pour accéder à ta progression environnementale."
            />
          </Unauthenticated>
        ) : null}

        {tab === "recyclage" ? <RecyclageTab /> : null}

        <View
          style={{
            marginTop: 22,
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
              gap: 8,
              alignItems: "flex-start",
            }}
          >
            <Info size={13} color="rgba(255,255,255,0.28)" />

            <Text
              style={{
                flex: 1,
                color: "rgba(255,255,255,0.28)",
                fontSize: 9,
                lineHeight: 14,
              }}
            >
              Les données environnementales doivent être rattachées à une source
              identifiable et à leur date de collecte. Les informations
              indisponibles sont volontairement laissées vides.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
