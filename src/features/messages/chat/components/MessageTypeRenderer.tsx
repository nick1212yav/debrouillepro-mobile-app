import { Text, View } from "react-native";

import type { Message } from "../services/chat.service";

import { MessageAttachments } from "./MessageAttachments";

import LocationMessage from "../../locations/components/LocationMessage";
import ContactMessage from "../../contacts/components/ContactMessage";
import EventMessage from "../../events/components/EventMessage";

import { JobMessage } from "../../jobs/components/JobMessage";

import PollMessage from "../../polls/components/PollMessage";

import type { LocationMessage as LocationMessageData } from "../../locations/services/locations.service";

import type { ContactMessage as ContactMessageData } from "../../contacts/services/contacts.service";

/* ============================================================================
 * TYPES
 * ========================================================================== */

interface MessageTypeRendererProps {
  message: Message;
  own?: boolean;
}

/* ============================================================================
 * ADAPTATEURS
 *
 * Message = contrat Convex générique.
 *
 * LocationMessage / ContactMessage utilisent des contrats spécialisés.
 * On construit ici uniquement les données nécessaires à ces composants,
 * sans cast et sans duplication du contrat backend.
 * ========================================================================== */

function toLocationMessage(message: Message): LocationMessageData | null {
  if (message.type !== "location") {
    return null;
  }

  if (!message.metadata || typeof message.metadata !== "object") {
    return null;
  }

  return {
    ...message,
    type: "location",
    metadata: message.metadata,
  };
}

function toContactMessage(message: Message): ContactMessageData | null {
  if (message.type !== "contact") {
    return null;
  }

  if (!message.metadata || typeof message.metadata !== "object") {
    return null;
  }

  return {
    ...message,
    type: "contact",
    metadata: message.metadata,
  };
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

function LocationMessageRenderer({
  message,
}: {
  message: LocationMessageData;
}) {
  return (
    <View className="w-full min-w-0 max-w-[360px]">
      <LocationMessage message={message} />
    </View>
  );
}

/* ============================================================================
 * CONTACT
 * ========================================================================== */

function ContactMessageRenderer({ message }: { message: ContactMessageData }) {
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
   * Normalisation défensive.
   */
  const type = String(message.type ?? "text")
    .trim()
    .toLowerCase();

  switch (type) {
    case "text":
      return <TextMessage message={message} />;

    case "location": {
      const locationMessage = toLocationMessage(message);

      if (!locationMessage) {
        return <UnsupportedMessage message={message} />;
      }

      return <LocationMessageRenderer message={locationMessage} />;
    }

    case "contact": {
      const contactMessage = toContactMessage(message);

      if (!contactMessage) {
        return <UnsupportedMessage message={message} />;
      }

      return <ContactMessageRenderer message={contactMessage} />;
    }

    case "event":
      return <EventMessageRenderer message={message} />;

    case "job":
      return <JobMessageRenderer message={message} />;

    case "poll":
      return <PollMessageRenderer message={message} />;

    case "voice":
      return (
        <View className="w-full min-w-0 max-w-[340px]">
          {message.text?.trim() ? (
            <Text className="text-sm leading-5 text-white">{message.text}</Text>
          ) : null}

          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "image":
      return (
        <View className="w-full min-w-0 overflow-hidden rounded-xl">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "video":
      return (
        <View className="w-full min-w-0 overflow-hidden rounded-xl">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "audio":
      return (
        <View className="w-full min-w-0 max-w-[340px]">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "file":
      return (
        <View className="w-full min-w-0 max-w-[360px]">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "document":
      return (
        <View className="w-full min-w-0 max-w-[360px]">
          <MessageAttachments messageId={message._id} />
        </View>
      );

    case "publication":
      return (
        <View className="w-full min-w-0 max-w-[390px]">
          {message.text?.trim() ? (
            <Text className="text-sm leading-5 text-white">{message.text}</Text>
          ) : null}

          <MessageAttachments messageId={message._id} />
        </View>
      );

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

    case "system":
      return (
        <View className="w-full items-center">
          {message.text?.trim() ? (
            <Text className="text-xs leading-4 text-white/40">
              {message.text}
            </Text>
          ) : null}
        </View>
      );

    default:
      return <UnsupportedMessage message={message} />;
  }
}

export default MessageTypeRenderer;
