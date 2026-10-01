import { Text, View } from "react-native";

import type { Message } from "../services/chat.service";

import { MessageAttachments } from "./MessageAttachments";

import LocationMessage from "../../locations/components/LocationMessage";
import ContactMessage from "../../contacts/components/ContactMessage";
import EventMessage from "../../events/components/EventMessage";

import { JobMessage } from "../../jobs/components/JobMessage";
import { PropertyMessage } from "../../immo/components/PropertyMessage";

import PollMessage from "../../polls/components/PollMessage";

interface MessageTypeRendererProps {
  message: Message;
  own?: boolean;
}

/* ============================================================================
 * TEXTE
 * ========================================================================== */

function TextMessage({ message }: { message: Message }) {
  const hasText = Boolean(message.text?.trim());

  return (
    <View className="w-full gap-1">
      {hasText ? (
        <Text className="text-sm leading-5 text-inherit">{message.text}</Text>
      ) : null}

      <MessageAttachments messageId={message._id} />
    </View>
  );
}

/* ============================================================================
 * FALLBACK
 * ========================================================================== */

function UnsupportedMessage({ message }: { message: Message }) {
  const hasText = Boolean(message.text?.trim());

  return (
    <View className="w-full gap-2">
      {hasText ? (
        <Text className="text-sm leading-5 text-white">{message.text}</Text>
      ) : null}

      <MessageAttachments messageId={message._id} />

      <Text className="text-[11px] leading-4 text-white/40">
        Type de message non reconnu.
      </Text>
    </View>
  );
}

/* ============================================================================
 * LOCATION
 * ========================================================================== */

function LocationMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[360px]">
      <LocationMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * CONTACT
 * ========================================================================== */

function ContactMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[380px]">
      <ContactMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * ÉVÉNEMENT
 * ========================================================================== */

function EventMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[380px]">
      <EventMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * JOB
 * ========================================================================== */

function JobMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[390px]">
      <JobMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * IMMOBILIER
 * ========================================================================== */

function PropertyMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[390px]">
      <PropertyMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * SONDAGE
 * ========================================================================== */

function PollMessageRenderer({ message }: { message: Message }) {
  return (
    <View className="w-full min-w-0 max-w-[390px]">
      <PollMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * MAIN RENDERER
 * ========================================================================== */

export function MessageTypeRenderer({ message }: MessageTypeRendererProps) {
  /*
   * Un message supprimé ne doit jamais afficher son contenu original.
   */
  if (message.isDeleted) {
    return (
      <Text
        className="text-sm italic leading-5 text-white/40"
        accessibilityLabel="Message supprimé"
      >
        Message supprimé
      </Text>
    );
  }

  /*
   * Normalisation défensive du type.
   */
  const type = String(message.type ?? "text")
    .trim()
    .toLowerCase();

  switch (type) {
    /* ------------------------------------------------------------------------
     * TEXTE
     * ---------------------------------------------------------------------- */

    case "text":
      return <TextMessage message={message} />;

    /* ------------------------------------------------------------------------
     * LOCALISATION
     * ---------------------------------------------------------------------- */

    case "location":
      return <LocationMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * CONTACT
     * ---------------------------------------------------------------------- */

    case "contact":
      return <ContactMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * ÉVÉNEMENT
     * ---------------------------------------------------------------------- */

    case "event":
      return <EventMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * JOB
     * ---------------------------------------------------------------------- */

    case "job":
      return <JobMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * IMMOBILIER
     * ---------------------------------------------------------------------- */

    case "property":
    case "immo":
      return <PropertyMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * SONDAGE
     * ---------------------------------------------------------------------- */

    case "poll":
      return <PollMessageRenderer message={message} />;

    /* ------------------------------------------------------------------------
     * VOCAL
     *
     * Le contrat exact du composant VoiceMessage n'est pas présent ici.
     * On conserve donc le rendu par attachment sans inventer de props.
     * ---------------------------------------------------------------------- */

    case "voice":
      return (
        <View className="w-full min-w-0 max-w-[340px]">
          {message.text?.trim() ? (
            <Text className="text-sm leading-5 text-white">{message.text}</Text>
          ) : null}

          <MessageAttachments messageId={message._id} />
        </View>
      );

    /* ------------------------------------------------------------------------
     * IMAGE
     *
     * Le composant MessageAttachments reste la source de rendu média.
     * ---------------------------------------------------------------------- */

    case "image":
      return (
        <View className="w-full min-w-0 overflow-hidden rounded-xl">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    /* ------------------------------------------------------------------------
     * VIDÉO
     * ---------------------------------------------------------------------- */

    case "video":
      return (
        <View className="w-full min-w-0 overflow-hidden rounded-xl">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    /* ------------------------------------------------------------------------
     * FICHIER / DOCUMENT
     * ---------------------------------------------------------------------- */

    case "file":
    case "document":
      return (
        <View className="w-full min-w-0 max-w-[360px]">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    /* ------------------------------------------------------------------------
     * PAIEMENT
     *
     * Le contrat PaymentMessage n'est pas suffisamment établi ici pour
     * construire artificiellement son objet payment.
     * ---------------------------------------------------------------------- */

    case "payment":
      return (
        <View className="w-full min-w-0 max-w-[390px]">
          <Text className="text-sm font-semibold leading-5 text-white">
            Paiement
          </Text>

          {message.text?.trim() ? (
            <Text className="mt-1 text-sm leading-5 text-white/70">
              {message.text}
            </Text>
          ) : null}

          <MessageAttachments messageId={message._id} />
        </View>
      );

    /* ------------------------------------------------------------------------
     * FALLBACK
     * ---------------------------------------------------------------------- */

    default:
      return <UnsupportedMessage message={message} />;
  }
}

export default MessageTypeRenderer;
