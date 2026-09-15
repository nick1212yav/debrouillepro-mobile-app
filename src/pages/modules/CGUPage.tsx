import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  ChevronDown,
  FileText,
  Info,
  Mail,
  Scale,
  ShieldCheck,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";

interface CGUPageProps {
  onBack: () => void;
}

interface Section {
  title: string;
  content: string;
}

const SECTIONS: Section[] = [
  {
    title: "1. Acceptation des conditions",
    content: `En accédant à Débrouille Pro, tu acceptes les présentes Conditions Générales d'Utilisation. Si tu ne les acceptes pas, tu ne peux pas utiliser le service.

Ces CGU s'appliquent à tous les utilisateurs, visiteurs et toute personne qui accède ou utilise Débrouille Pro.`,
  },
  {
    title: "2. Description du service",
    content: `Débrouille Pro est une plateforme numérique multi-services permettant notamment de publier et consulter des annonces, découvrir des opportunités, accéder à des services locaux et interagir avec une communauté.

Le service peut évoluer afin d'améliorer ses fonctionnalités, sa sécurité et son expérience utilisateur.`,
  },
  {
    title: "3. Compte utilisateur",
    content: `Pour certaines fonctionnalités, la création d'un compte est nécessaire. Tu es responsable de la confidentialité de tes identifiants et des activités effectuées depuis ton compte.

Tu t'engages à fournir des informations exactes, complètes et à jour. Un usage abusif ou une violation des présentes conditions peut entraîner une restriction, suspension ou suppression du compte.`,
  },
  {
    title: "4. Contenu des utilisateurs",
    content: `Tu demeures responsable des contenus que tu publies et dois disposer des droits nécessaires pour les utiliser.

Tu t'engages à ne pas publier de contenu illégal, trompeur, diffamatoire, frauduleux, haineux ou portant atteinte aux droits de tiers. Les contenus contraires aux règles peuvent être retirés.`,
  },
  {
    title: "5. Transactions et paiements",
    content: `Les transactions réalisées via les fonctionnalités de paiement sont soumises aux conditions spécifiques du service concerné.

Débrouille Pro fournit l'infrastructure numérique permettant certaines interactions. Les utilisateurs restent responsables de leurs engagements entre eux.`,
  },
  {
    title: "6. Propriété intellectuelle",
    content: `L'application, son identité visuelle, son interface, ses fonctionnalités, ses textes originaux et sa technologie sont protégés par les règles applicables de propriété intellectuelle.

Sauf autorisation, il est interdit de reproduire, distribuer, modifier ou exploiter les éléments protégés de Débrouille Pro.`,
  },
  {
    title: "7. Sécurité et usages interdits",
    content: `Il est interdit de contourner les mécanismes de sécurité, d'accéder sans autorisation aux données ou systèmes, de perturber le service ou de l'utiliser à des fins frauduleuses.

Tout comportement mettant en danger les utilisateurs ou la plateforme peut faire l'objet de mesures de sécurité et de modération.`,
  },
  {
    title: "8. Disponibilité du service",
    content: `Nous cherchons à maintenir un service fiable et accessible. Certaines interruptions peuvent toutefois résulter de maintenance, de mises à jour, de contraintes techniques ou d'événements indépendants de notre volonté.`,
  },
  {
    title: "9. Modification des CGU",
    content: `Ces conditions peuvent être mises à jour lorsque le service évolue ou lorsque des changements juridiques ou de sécurité le nécessitent.

Les modifications importantes seront présentées de manière appropriée.`,
  },
  {
    title: "10. Contact",
    content: `Pour toute question concernant ces conditions :

Email : legal@debrouille.pro
Débrouille Pro SAS · Kolwezi, Lualaba, RDC`,
  },
];

interface SectionItemProps {
  title: string;
  content: string;
  active: boolean;
  accent: string;
  onPress: () => void;
}

function SectionItem({
  title,
  content,
  active,
  accent,
  onPress,
}: SectionItemProps) {
  return (
    <View
      className="border-b"
      style={{
        borderBottomColor: "rgba(255,255,255,0.055)",
      }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: active }}
        className="flex-row items-center px-4 py-4"
        style={({ pressed }) => ({
          opacity: pressed ? 0.72 : 1,
        })}
      >
        <View className="mr-3 h-7 w-7 items-center justify-center rounded-xl">
          <Text
            className="text-[10px] font-black"
            style={{
              color: active ? accent : "rgba(255,255,255,0.28)",
            }}
          >
            {title.split(".")[0]}
          </Text>
        </View>

        <Text
          className="flex-1 text-[14px] font-bold"
          style={{
            color: active ? "rgba(255,255,255,0.96)" : "rgba(255,255,255,0.78)",
          }}
        >
          {title.substring(title.indexOf(".") + 1).trim()}
        </Text>

        <View
          className="h-8 w-8 items-center justify-center rounded-xl"
          style={{
            backgroundColor: active ? `${accent}16` : "rgba(255,255,255,0.045)",
          }}
        >
          <ChevronDown
            size={16}
            color={active ? accent : "rgba(255,255,255,0.38)"}
            strokeWidth={2.4}
          />
        </View>
      </Pressable>

      {active ? (
        <View
          className="px-4 pb-5"
          style={{
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.035)",
          }}
        >
          <Text
            className="pt-4 text-[13px] leading-6"
            style={{
              color: "rgba(255,255,255,0.54)",
            }}
          >
            {content}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

interface HeaderProps {
  onBack: () => void;
  accent: string;
}

function Header({ onBack, accent }: HeaderProps) {
  return (
    <View
      className="flex-row items-center px-5 pb-4 pt-4"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
        backgroundColor: "rgba(2,6,23,0.96)",
      }}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={({ pressed }) => ({
          backgroundColor: pressed
            ? "rgba(255,255,255,0.11)"
            : "rgba(255,255,255,0.055)",
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <ArrowLeft size={19} color="rgba(255,255,255,0.88)" strokeWidth={2.3} />
      </Pressable>

      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <FileText size={16} color={accent} strokeWidth={2.4} />
          <Text className="ml-2 text-[18px] font-black text-white">
            Conditions générales
          </Text>
        </View>

        <Text className="mt-0.5 text-[11px] text-white/35">
          CGU · cadre d'utilisation
        </Text>
      </View>

      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${accent}12`,
          borderWidth: 1,
          borderColor: `${accent}22`,
        }}
      >
        <ShieldCheck size={18} color={accent} strokeWidth={2.2} />
      </View>
    </View>
  );
}

export default function CGUPage({ onBack }: CGUPageProps) {
  const { prefs } = useAppearance();
  const palette = ACCENT_PALETTES[prefs.accent];
  const accent = palette.hex;

  const [open, setOpen] = useState<number | null>(0);
  const { width } = useWindowDimensions();

  const contentWidth = Math.min(width - 32, 920);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} accent={accent} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          width: contentWidth,
          alignSelf: "center",
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* HERO */}
        <View
          className="mb-5 overflow-hidden rounded-[28px] p-5"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.075)",
          }}
        >
          <View className="flex-row items-start">
            <View
              className="h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: `${accent}14`,
                borderWidth: 1,
                borderColor: `${accent}2A`,
              }}
            >
              <Scale size={23} color={accent} strokeWidth={2} />
            </View>

            <View className="ml-4 flex-1">
              <Text
                className="text-[10px] font-black uppercase"
                style={{
                  color: accent,
                  letterSpacing: 2,
                }}
              >
                CADRE D'UTILISATION
              </Text>

              <Text className="mt-1 text-[23px] font-black leading-7 text-white">
                Utiliser Débrouille Pro en toute confiance.
              </Text>

              <Text className="mt-2 text-[13px] leading-5 text-white/45">
                Les règles essentielles qui encadrent l'utilisation de la
                plateforme.
              </Text>
            </View>
          </View>

          <View
            className="mt-5 flex-row items-center rounded-2xl px-3.5 py-3"
            style={{
              backgroundColor: `${accent}09`,
              borderWidth: 1,
              borderColor: `${accent}16`,
            }}
          >
            <ShieldCheck size={15} color={accent} strokeWidth={2.2} />

            <Text className="ml-2 flex-1 text-[11px] leading-4 text-white/45">
              Consulte les différentes sections pour connaître les règles
              applicables à l'utilisation du service.
            </Text>
          </View>
        </View>

        {/* SECTIONS */}
        <View
          className="overflow-hidden rounded-[28px]"
          style={{
            backgroundColor: "rgba(255,255,255,0.032)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          {SECTIONS.map((section, index) => (
            <SectionItem
              key={section.title}
              title={section.title}
              content={section.content}
              active={open === index}
              accent={accent}
              onPress={() =>
                setOpen((current) => (current === index ? null : index))
              }
            />
          ))}
        </View>

        {/* INFORMATION */}
        <View
          className="mt-5 flex-row items-start rounded-2xl p-4"
          style={{
            backgroundColor: `${accent}0C`,
            borderWidth: 1,
            borderColor: `${accent}18`,
          }}
        >
          <View
            className="h-8 w-8 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${accent}14`,
            }}
          >
            <Info size={16} color={accent} strokeWidth={2.2} />
          </View>

          <Text className="ml-3 flex-1 text-[12px] leading-5 text-white/40">
            Pour toute question concernant ces conditions, contacte l'équipe
            Débrouille Pro.
          </Text>
        </View>

        {/* CONTACT */}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Contacter legal@debrouille.pro"
          className="mt-5 items-center justify-center rounded-2xl px-4 py-4"
          style={({ pressed }) => ({
            backgroundColor: pressed
              ? "rgba(255,255,255,0.045)"
              : "rgba(255,255,255,0.025)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.045)",
          })}
        >
          <View className="flex-row items-center">
            <Mail size={13} color="rgba(255,255,255,0.32)" strokeWidth={2} />

            <Text className="ml-2 text-[11px] text-white/30">
              legal@debrouille.pro
            </Text>
          </View>

          <Text className="mt-1 text-[9px] text-white/15">
            Débrouille Pro SAS · Kolwezi, Lualaba, RDC
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
