import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ArrowLeft,
  Award,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  HeartHandshake,
  Landmark,
  MessageCircle,
  Mic2,
  Play,
  Send,
  Sparkles,
  Users,
  Video,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";

interface EglisePageProps {
  onBack: () => void;
}

type SectionKey =
  | "accueil"
  | "culte"
  | "agenda"
  | "predications"
  | "priere"
  | "groupes"
  | "jeunesse"
  | "annonces"
  | "pastoral"
  | "dons";

const CHURCH_NAME = "Église";

const ACCENT = "#8B5CF6";
const ACCENT_LIGHT = "#A78BFA";
const SUCCESS = "#10B981";
const DANGER = "#EF4444";
const MUTED = "rgba(255,255,255,0.36)";

const SECTIONS: Array<{
  key: SectionKey;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
}> = [
  {
    key: "accueil",
    label: "Accueil",
    icon: Sparkles,
  },
  {
    key: "culte",
    label: "Cultes",
    icon: Video,
  },
  {
    key: "agenda",
    label: "Agenda",
    icon: CalendarDays,
  },
  {
    key: "predications",
    label: "Prédications",
    icon: Mic2,
  },
  {
    key: "priere",
    label: "Prière",
    icon: Heart,
  },
  {
    key: "groupes",
    label: "Groupes",
    icon: Users,
  },
  {
    key: "jeunesse",
    label: "Jeunesse",
    icon: Award,
  },
  {
    key: "annonces",
    label: "Annonces",
    icon: Bell,
  },
  {
    key: "pastoral",
    label: "Pastoral",
    icon: HeartHandshake,
  },
  {
    key: "dons",
    label: "Dons",
    icon: Landmark,
  },
];

function Header({ onBack }: EglisePageProps) {
  return (
    <View
      className="flex-row items-center px-5 pb-4 pt-4"
      style={{
        backgroundColor: "rgba(2,4,18,0.98)",
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.06)",
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
        <ArrowLeft size={19} color="rgba(255,255,255,0.92)" strokeWidth={2.3} />
      </Pressable>

      <View className="ml-3 flex-1">
        <Text className="text-[18px] font-black text-white">
          Église & Communauté
        </Text>

        <Text className="mt-0.5 text-[11px] text-white/35">
          Culte · Prière · Communion · Service
        </Text>
      </View>

      <View
        className="h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${ACCENT}16`,
          borderWidth: 1,
          borderColor: `${ACCENT}28`,
        }}
      >
        <Heart size={18} color={ACCENT_LIGHT} strokeWidth={2} />
      </View>
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View className="mb-5">
      <Text
        className="text-[9px] font-black uppercase"
        style={{
          color: ACCENT_LIGHT,
          letterSpacing: 1.8,
        }}
      >
        {eyebrow}
      </Text>

      <Text className="mt-1 text-[24px] font-black leading-7 text-white">
        {title}
      </Text>

      {description ? (
        <Text className="mt-2 text-[12px] leading-5 text-white/35">
          {description}
        </Text>
      ) : null}
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  onPress,
  accent = ACCENT,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
  accent?: string;
}) {
  const content = (
    <View
      className="flex-row rounded-[22px] p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.065)",
      }}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: `${accent}13`,
          borderWidth: 1,
          borderColor: `${accent}22`,
        }}
      >
        {icon}
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-[13px] font-black text-white">{title}</Text>

        <Text className="mt-1 text-[10px] leading-4 text-white/32">
          {description}
        </Text>
      </View>

      {onPress ? (
        <View className="ml-2 justify-center">
          <ChevronRight size={16} color="rgba(255,255,255,0.25)" />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        opacity: pressed ? 0.75 : 1,
        transform: [{ scale: pressed ? 0.985 : 1 }],
      })}
    >
      {content}
    </Pressable>
  );
}

function EmptyFeature({
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
      className="items-center rounded-[26px] px-6 py-12"
      style={{
        backgroundColor: "rgba(255,255,255,0.03)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <View
        className="h-16 w-16 items-center justify-center rounded-3xl"
        style={{
          backgroundColor: `${ACCENT}11`,
          borderWidth: 1,
          borderColor: `${ACCENT}1D`,
        }}
      >
        {icon}
      </View>

      <Text className="mt-4 text-center text-[15px] font-black text-white">
        {title}
      </Text>

      <Text className="mt-2 max-w-[330px] text-center text-[11px] leading-5 text-white/30">
        {description}
      </Text>
    </View>
  );
}

function Navigation({
  active,
  onChange,
}: {
  active: SectionKey;
  onChange: (value: SectionKey) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingVertical: 5,
      }}
    >
      {SECTIONS.map((item) => {
        const selected = item.key === active;
        const Icon = item.icon;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            accessibilityRole="tab"
            accessibilityState={{
              selected,
            }}
            className="mr-2 flex-row items-center rounded-full px-3.5 py-2.5"
            style={({ pressed }) => ({
              opacity: pressed ? 0.72 : 1,
              backgroundColor: selected
                ? `${ACCENT}20`
                : "rgba(255,255,255,0.035)",
              borderWidth: 1,
              borderColor: selected ? `${ACCENT}35` : "rgba(255,255,255,0.055)",
            })}
          >
            <Icon
              size={13}
              color={selected ? ACCENT_LIGHT : "rgba(255,255,255,0.35)"}
              strokeWidth={2}
            />

            <Text
              className="ml-1.5 text-[10px] font-bold"
              style={{
                color: selected ? "#FFFFFF" : "rgba(255,255,255,0.38)",
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function HomeSection({ goTo }: { goTo: (section: SectionKey) => void }) {
  return (
    <View>
      <View
        className="overflow-hidden rounded-[30px] p-5"
        style={{
          backgroundColor: "rgba(139,92,246,0.08)",
          borderWidth: 1,
          borderColor: "rgba(139,92,246,0.18)",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: `${ACCENT}18`,
            }}
          >
            <Heart size={23} color={ACCENT_LIGHT} strokeWidth={1.9} />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-black uppercase text-violet-300">
              ESPACE ÉGLISE
            </Text>

            <Text className="mt-1 text-[20px] font-black text-white">
              Une communauté,
              {"\n"}
              une vie à partager.
            </Text>
          </View>
        </View>

        <Text className="mt-4 text-[11px] leading-5 text-white/38">
          Retrouve ici les fonctionnalités de vie communautaire : culte, prière,
          enseignement, groupes, jeunesse, accompagnement et générosité.
        </Text>
      </View>

      <View className="mt-5 gap-3">
        <FeatureCard
          icon={<Video size={18} color={ACCENT_LIGHT} />}
          title="Cultes & directs"
          description="Accéder aux cultes et aux contenus vidéo lorsque les données sont disponibles."
          onPress={() => goTo("culte")}
        />

        <FeatureCard
          icon={<CalendarDays size={18} color="#60A5FA" />}
          title="Agenda de l'église"
          description="Cultes, réunions, activités, célébrations et rendez-vous communautaires."
          onPress={() => goTo("agenda")}
          accent="#60A5FA"
        />

        <FeatureCard
          icon={<Mic2 size={18} color="#F59E0B" />}
          title="Prédications & enseignements"
          description="Retrouver les enseignements publiés par la communauté."
          onPress={() => goTo("predications")}
          accent="#F59E0B"
        />

        <FeatureCard
          icon={<Heart size={18} color="#EC4899" />}
          title="Prière & intercession"
          description="Espace destiné aux demandes de prière et à la vie spirituelle communautaire."
          onPress={() => goTo("priere")}
          accent="#EC4899"
        />

        <FeatureCard
          icon={<Users size={18} color="#22C55E" />}
          title="Groupes & communautés"
          description="Petits groupes, cellules, ministères et communautés thématiques."
          onPress={() => goTo("groupes")}
          accent="#22C55E"
        />

        <FeatureCard
          icon={<Award size={18} color="#F97316" />}
          title="Jeunesse & enfants"
          description="Espaces dédiés aux jeunes, aux enfants et à leurs activités."
          onPress={() => goTo("jeunesse")}
          accent="#F97316"
        />

        <FeatureCard
          icon={<HeartHandshake size={18} color="#38BDF8" />}
          title="Accompagnement pastoral"
          description="Accompagnement, écoute, orientation et contact pastoral."
          onPress={() => goTo("pastoral")}
          accent="#38BDF8"
        />

        <FeatureCard
          icon={<Landmark size={18} color={SUCCESS} />}
          title="Dons & offrandes"
          description="Gérer vos contributions et consulter votre historique."
          onPress={() => goTo("dons")}
          accent={SUCCESS}
        />
      </View>
    </View>
  );
}

function LiveSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="CULTE"
        title="Cultes & directs"
        description="Le contenu réellement disponible depuis les sources connectées apparaîtra ici."
      />

      <EmptyFeature
        icon={<Video size={27} color={ACCENT_LIGHT} />}
        title="Aucun direct connecté"
        description="Aucune donnée de culte en direct n'est actuellement fournie par le backend de cette page. Aucun contenu fictif n'est affiché."
      />

      <View className="mt-4 gap-3">
        <FeatureCard
          icon={<Play size={17} color={ACCENT_LIGHT} fill={ACCENT_LIGHT} />}
          title="Diffusion en direct"
          description="Prêt à recevoir les véritables flux vidéo lorsque le module Live sera connecté."
        />

        <FeatureCard
          icon={<Video size={17} color="#60A5FA" />}
          title="Revoir un culte"
          description="Les replays pourront être affichés ici à partir des contenus réellement publiés."
          accent="#60A5FA"
        />
      </View>
    </View>
  );
}

function AgendaSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="AGENDA"
        title="Vie de l'église"
        description="Tous les rendez-vous de la communauté pourront être centralisés ici."
      />

      <EmptyFeature
        icon={<CalendarDays size={27} color="#60A5FA" />}
        title="Agenda non connecté"
        description="Aucun événement d'église n'est actuellement fourni par une source backend vérifiée pour cette page."
      />
    </View>
  );
}

function PredicationsSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="ENSEIGNEMENT"
        title="Prédications"
        description="Sermons, enseignements, études bibliques et ressources spirituelles."
      />

      <EmptyFeature
        icon={<Mic2 size={27} color="#F59E0B" />}
        title="Aucune prédication connectée"
        description="Les prédications seront affichées ici dès qu'une source réelle de contenu sera reliée au module."
      />

      <View className="mt-4 gap-3">
        <FeatureCard
          icon={<BookOpen size={17} color="#F59E0B" />}
          title="Études bibliques"
          description="Prévu pour les études, séries et documents d'enseignement réellement publiés."
          accent="#F59E0B"
        />

        <FeatureCard
          icon={<Play size={17} color="#A78BFA" />}
          title="Audio & vidéo"
          description="Prévu pour les différents formats de prédications et d'enseignements."
        />
      </View>
    </View>
  );
}

function PrayerSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="PRIÈRE"
        title="Prière & intercession"
        description="Un espace pour centraliser les besoins de prière et favoriser la solidarité spirituelle."
      />

      <FeatureCard
        icon={<Heart size={19} color="#EC4899" />}
        title="Demande de prière"
        description="La création et le suivi des demandes nécessitent une API backend dédiée."
        accent="#EC4899"
      />

      <View className="mt-3">
        <FeatureCard
          icon={<Users size={19} color={ACCENT_LIGHT} />}
          title="Communauté d'intercession"
          description="Les groupes de prière pourront être connectés lorsque leur modèle de données sera disponible."
        />
      </View>

      <View className="mt-3">
        <EmptyFeature
          icon={<Heart size={25} color="#EC4899" />}
          title="Aucune demande disponible"
          description="Aucune demande de prière réelle n'est actuellement accessible à cette page."
        />
      </View>
    </View>
  );
}

function GroupsSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="COMMUNAUTÉ"
        title="Groupes & ministères"
        description="Cellules, groupes de maison, ministères et communautés thématiques."
      />

      <EmptyFeature
        icon={<Users size={27} color="#22C55E" />}
        title="Groupes non connectés"
        description="Aucune liste de groupes d'église n'est actuellement fournie par le backend utilisé ici."
      />

      <View className="mt-4 gap-3">
        <FeatureCard
          icon={<Users size={18} color="#22C55E" />}
          title="Cellules & petits groupes"
          description="Organisation des communautés locales et groupes de maison."
          accent="#22C55E"
        />

        <FeatureCard
          icon={<HeartHandshake size={18} color="#38BDF8" />}
          title="Ministères & services"
          description="Découverte et participation aux différents ministères de l'église."
          accent="#38BDF8"
        />
      </View>
    </View>
  );
}

function YouthSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="GÉNÉRATIONS"
        title="Jeunesse & enfants"
        description="Des espaces dédiés aux enfants, adolescents, étudiants et jeunes adultes."
      />

      <View className="gap-3">
        <FeatureCard
          icon={<Award size={18} color="#F97316" />}
          title="Jeunesse"
          description="Activités, rencontres, enseignements et événements jeunesse."
          accent="#F97316"
        />

        <FeatureCard
          icon={<BookOpen size={18} color="#60A5FA" />}
          title="Enfants"
          description="École du dimanche, ressources pédagogiques et activités pour enfants."
          accent="#60A5FA"
        />
      </View>

      <View className="mt-4">
        <EmptyFeature
          icon={<Award size={25} color="#F97316" />}
          title="Contenus jeunesse non connectés"
          description="Aucun programme ou activité jeunesse réelle n'est actuellement disponible depuis le backend."
        />
      </View>
    </View>
  );
}

function AnnouncementsSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="COMMUNICATION"
        title="Annonces"
        description="Les informations importantes de la communauté pourront être regroupées ici."
      />

      <EmptyFeature
        icon={<Bell size={27} color={ACCENT_LIGHT} />}
        title="Aucune annonce disponible"
        description="Aucune annonce d'église n'est actuellement fournie par une source backend connectée."
      />
    </View>
  );
}

function PastoralSection() {
  return (
    <View>
      <SectionTitle
        eyebrow="ACCOMPAGNEMENT"
        title="Espace pastoral"
        description="Un espace destiné à l'écoute, l'accompagnement et l'orientation des membres."
      />

      <View className="gap-3">
        <FeatureCard
          icon={<MessageCircle size={18} color="#38BDF8" />}
          title="Contacter l'équipe pastorale"
          description="La messagerie pastorale pourra être reliée au module Messages."
          accent="#38BDF8"
        />

        <FeatureCard
          icon={<HeartHandshake size={18} color={ACCENT_LIGHT} />}
          title="Accompagnement"
          description="Demandes d'accompagnement, écoute et orientation lorsque le backend correspondant sera disponible."
        />
      </View>

      <View className="mt-4">
        <EmptyFeature
          icon={<HeartHandshake size={25} color="#38BDF8" />}
          title="Service pastoral non connecté"
          description="Aucun profil pastoral ou système de demande n'est actuellement fourni par le backend de cette page."
        />
      </View>
    </View>
  );
}

function DonationSection() {
  const subscribed = useQuery(api.localServices.getChurchSubscription, {
    churchName: CHURCH_NAME,
  });

  const donations = useQuery(api.localServices.listMyDonations, {});

  const toggleSubscription = useMutation(
    api.localServices.toggleChurchSubscription,
  );

  const makeDonation = useMutation(api.localServices.makeDonation);

  const [amount, setAmount] = useState("5000");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalDonated = useMemo(() => {
    return donations?.reduce((sum, donation) => sum + donation.amount, 0) ?? 0;
  }, [donations]);

  const handleSubscription = async () => {
    try {
      await toggleSubscription({
        churchName: CHURCH_NAME,
      });
    } catch {
      // L'état d'erreur reste silencieux pour éviter une
      // dépendance obligatoire à un système de toast Web.
    }
  };

  const handleDonation = async () => {
    const normalized = amount.replace(/\D/g, "");
    const value = Number(normalized);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    setProcessing(true);

    try {
      await makeDonation({
        amount: value,
        currency: "FCFA",
        churchName: CHURCH_NAME,
      });

      setSuccess(true);

      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View>
      <SectionTitle
        eyebrow="GÉNÉROSITÉ"
        title="Dons & offrandes"
        description="Une interface sécurisée pour gérer vos contributions lorsque le service de paiement est disponible."
      />

      <View
        className="rounded-[28px] p-5"
        style={{
          backgroundColor: "rgba(255,255,255,0.035)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.07)",
        }}
      >
        <View className="items-center">
          <View
            className="h-16 w-16 items-center justify-center rounded-3xl"
            style={{
              backgroundColor: `${ACCENT}13`,
            }}
          >
            <Heart
              size={27}
              color={ACCENT_LIGHT}
              fill={`${ACCENT}33`}
              strokeWidth={1.8}
            />
          </View>

          <Text className="mt-4 text-[17px] font-black text-white">
            Donner avec générosité
          </Text>

          <Text className="mt-1 text-center text-[11px] leading-5 text-white/32">
            Votre contribution peut être enregistrée via le service de dons
            connecté.
          </Text>
        </View>

        <View
          className="mt-5 rounded-2xl p-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.025)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.055)",
          }}
        >
          <Text className="text-[9px] font-bold uppercase text-white/25">
            Total de mes dons
          </Text>

          <Text className="mt-1 text-[22px] font-black text-white">
            {totalDonated.toLocaleString()}{" "}
            <Text className="text-[11px] font-bold text-white/35">FCFA</Text>
          </Text>
        </View>

        <Text className="mt-5 text-[10px] font-bold uppercase text-white/30">
          Montant
        </Text>

        <View
          className="mt-2 flex-row items-center rounded-2xl px-4"
          style={{
            minHeight: 50,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <TextInput
            value={amount}
            onChangeText={(value) => setAmount(value.replace(/\D/g, ""))}
            keyboardType="numeric"
            placeholder="Montant en FCFA"
            placeholderTextColor="rgba(255,255,255,0.22)"
            className="flex-1 text-[14px] font-bold text-white"
          />

          <Text className="text-[10px] font-bold text-white/25">FCFA</Text>
        </View>

        <View className="mt-3 flex-row gap-2">
          {[1000, 5000, 10000, 25000].map((preset) => {
            const active = amount === String(preset);

            return (
              <Pressable
                key={preset}
                onPress={() => setAmount(String(preset))}
                className="flex-1 items-center rounded-xl py-2.5"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.72 : 1,
                  backgroundColor: active ? ACCENT : "rgba(255,255,255,0.06)",
                })}
              >
                <Text className="text-[10px] font-black text-white">
                  {preset.toLocaleString()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {success ? (
          <View
            className="mt-4 flex-row items-center justify-center rounded-2xl px-4 py-3"
            style={{
              backgroundColor: "rgba(16,185,129,0.10)",
              borderWidth: 1,
              borderColor: "rgba(16,185,129,0.18)",
            }}
          >
            <CheckCircle2 size={16} color={SUCCESS} />

            <Text className="ml-2 text-[11px] font-bold text-emerald-400">
              Contribution enregistrée.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => void handleDonation()}
            disabled={processing}
            accessibilityRole="button"
            className="mt-4 flex-row items-center justify-center rounded-2xl py-3.5"
            style={({ pressed }) => ({
              opacity: processing ? 0.55 : pressed ? 0.78 : 1,
              backgroundColor: ACCENT,
            })}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Heart size={15} color="#FFFFFF" strokeWidth={2.2} />

                <Text className="ml-2 text-[11px] font-black text-white">
                  Faire une offrande
                </Text>
              </>
            )}
          </Pressable>
        )}

        <Pressable
          onPress={() => void handleSubscription()}
          accessibilityRole="button"
          className="mt-3 flex-row items-center justify-center rounded-2xl py-3"
          style={({ pressed }) => ({
            opacity: pressed ? 0.72 : 1,
            backgroundColor: subscribed
              ? "rgba(139,92,246,0.12)"
              : "rgba(255,255,255,0.045)",
            borderWidth: 1,
            borderColor: subscribed
              ? "rgba(139,92,246,0.20)"
              : "rgba(255,255,255,0.06)",
          })}
        >
          <Bell
            size={14}
            color={subscribed ? ACCENT_LIGHT : "rgba(255,255,255,0.45)"}
          />

          <Text
            className="ml-2 text-[10px] font-bold"
            style={{
              color: subscribed ? ACCENT_LIGHT : "rgba(255,255,255,0.45)",
            }}
          >
            {subscribed
              ? "Notifications activées"
              : "Recevoir les notifications"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-4">
        <FeatureCard
          icon={<Clock3 size={18} color="rgba(255,255,255,0.55)" />}
          title="Historique"
          description={
            donations === undefined
              ? "Chargement de votre historique…"
              : donations.length > 0
                ? `${donations.length} contribution${
                    donations.length > 1 ? "s" : ""
                  } enregistrée${donations.length > 1 ? "s" : ""}.`
                : "Aucune contribution enregistrée."
          }
        />
      </View>
    </View>
  );
}

function AuthenticatedChurch({ onBack }: EglisePageProps) {
  const [activeSection, setActiveSection] = useState<SectionKey>("accueil");

  const { width } = useWindowDimensions();

  const maxWidth = Math.min(width - 32, 920);

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <Navigation active={activeSection} onChange={setActiveSection} />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: maxWidth,
          alignSelf: "center",
          paddingTop: 16,
          paddingBottom: 45,
        }}
      >
        <View className="px-4">
          {activeSection === "accueil" ? (
            <HomeSection goTo={setActiveSection} />
          ) : null}

          {activeSection === "culte" ? <LiveSection /> : null}

          {activeSection === "agenda" ? <AgendaSection /> : null}

          {activeSection === "predications" ? <PredicationsSection /> : null}

          {activeSection === "priere" ? <PrayerSection /> : null}

          {activeSection === "groupes" ? <GroupsSection /> : null}

          {activeSection === "jeunesse" ? <YouthSection /> : null}

          {activeSection === "annonces" ? <AnnouncementsSection /> : null}

          {activeSection === "pastoral" ? <PastoralSection /> : null}

          {activeSection === "dons" ? <DonationSection /> : null}
        </View>

        <View className="mt-8 flex-row items-center justify-center">
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: SUCCESS,
            }}
          />

          <Text className="ml-2 text-[9px] text-white/20">
            Aucune donnée fictive · contenu issu des sources connectées
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function UnauthenticatedChurch({ onBack }: EglisePageProps) {
  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#020412",
      }}
    >
      <Header onBack={onBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View
          className="items-center rounded-[30px] px-6 py-11"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.07)",
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-[28px]"
            style={{
              backgroundColor: `${ACCENT}12`,
              borderWidth: 1,
              borderColor: `${ACCENT}22`,
            }}
          >
            <Heart size={36} color={ACCENT_LIGHT} strokeWidth={1.7} />
          </View>

          <Text className="mt-5 text-center text-[21px] font-black text-white">
            Église & Communauté
          </Text>

          <Text className="mt-2 max-w-[330px] text-center text-[12px] leading-5 text-white/35">
            Connectez-vous pour accéder à votre espace communautaire, vos
            contributions et les services disponibles.
          </Text>

          <View
            className="mt-5 flex-row items-center rounded-2xl px-4 py-3"
            style={{
              backgroundColor: "rgba(139,92,246,0.08)",
              borderWidth: 1,
              borderColor: "rgba(139,92,246,0.16)",
            }}
          >
            <Sparkles size={14} color={ACCENT_LIGHT} />

            <Text className="ml-2 flex-1 text-[10px] leading-4 text-white/35">
              Les fonctionnalités nécessitant un compte apparaîtront après
              authentification.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function EglisePage({ onBack }: EglisePageProps) {
  return (
    <>
      <Authenticated>
        <AuthenticatedChurch onBack={onBack} />
      </Authenticated>

      <Unauthenticated>
        <UnauthenticatedChurch onBack={onBack} />
      </Unauthenticated>
    </>
  );
}
