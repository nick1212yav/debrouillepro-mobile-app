import { View, Text } from "react-native";

// src/features/messages/chat/components/MessageTypeRenderer.tsx

import type { ComponentType } from "react";

import type { Message } from "../services/chat.service";

import { MessageAttachments } from "./MessageAttachments";

import VoiceMessage from "../../voice/components/VoiceMessage";
import ImagePreview from "../../media/components/ImagePreview";
import VideoPreview from "../../media/components/VideoPreview";
import FilePreview from "../../media/components/FilePreview";

import LocationMessage from "../../locations/components/LocationMessage";
import ContactMessage from "../../contacts/components/ContactMessage";

import EventMessage from "../../events/components/EventMessage";

/*
 * IMPORTANT
 * JobMessage expose un export nommé.
 */
import { JobMessage } from "../../jobs/components/JobMessage";

import PropertyMessage from "../../immo/components/PropertyMessage";

/*
 * PollMessage doit exister dans :
 *
 * src/features/messages/polls/components/PollMessage.tsx
 *
 * avec un export default.
 */
import PollMessage from "../../polls/components/PollMessage";

import PaymentMessage from "../../payments/components/PaymentMessage";

interface MessageTypeRendererProps {
  message: Message;
  own?: boolean;
}

/**
 * Contrat volontairement souple pour les composants
 * spécialisés du système Messages.
 *
 * Le renderer transmet toujours :
 * - message
 * - own
 *
 * afin d'éviter de coupler ici les différentes APIs
 * internes des modules.
 */
type FeatureRenderer = ComponentType<{
  message: Message;
  own?: boolean;
}>;

/* ============================================================================
 * RENDERERS
 * ========================================================================== */

const VoiceMessageRenderer = VoiceMessage as unknown as FeatureRenderer;

const ImageMessageRenderer = ImagePreview as unknown as FeatureRenderer;

const VideoMessageRenderer = VideoPreview as unknown as FeatureRenderer;

const FileMessageRenderer = FilePreview as unknown as FeatureRenderer;

const LocationMessageRenderer = LocationMessage as unknown as FeatureRenderer;

const ContactMessageRenderer = ContactMessage as unknown as FeatureRenderer;

const EventMessageRenderer = EventMessage as unknown as FeatureRenderer;

const JobMessageRenderer = JobMessage as unknown as FeatureRenderer;

const PropertyMessageRenderer = PropertyMessage as unknown as FeatureRenderer;

const PollMessageRenderer = PollMessage as unknown as FeatureRenderer;

const PaymentMessageRenderer = PaymentMessage as unknown as FeatureRenderer;

/* ============================================================================
 * TEXTE
 * ========================================================================== */

function TextMessage({ message }: { message: Message }) {
  return (
    <View className="space-y-1">
      {message.text && (
        <Text className="text-sm leading-relaxed">
          {message.text}
        </Text>
      )}

      <MessageAttachments messageId={message._id} />
    </View>
  );
}

/* ============================================================================
 * FALLBACK
 * ========================================================================== */

function UnsupportedMessage({ message }: { message: Message }) {
  return (
    <View className="space-y-2">
      {message.text && (
        <Text className="text-sm leading-relaxed">
          {message.text}
        </Text>
      )}

      <MessageAttachments messageId={message._id} />

      <Text className="text-[11px] text-white/30">Type de message non reconnu.</Text>
    </View>
  );
}

/* ============================================================================
 * MAIN RENDERER
 * ========================================================================== */

export function MessageTypeRenderer({
  message,
  own = false,
}: MessageTypeRendererProps) {
  /* ==========================================================================
   * MESSAGE SUPPRIMÉ
   * ======================================================================== */

  if (message.isDeleted) {
    return <Text className="text-sm italic text-white/40">Message supprimé</Text>;
  }

  /*
   * On normalise volontairement le type en string.
   *
   * Cela permet au frontend d'évoluer indépendamment du schéma
   * Convex lorsque de nouveaux types de messages apparaissent.
   */
  const type = String(message.type ?? "text");

  switch (type) {
    /* ========================================================================
     * TEXTE
     * ====================================================================== */

    case "text":
      return <TextMessage message={message} />;

    /* ========================================================================
     * VOCAL
     * ====================================================================== */

    case "voice":
      return (
        <View className="min-w-[230px] max-w-[340px]">
          <VoiceMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * IMAGE
     * ====================================================================== */

    case "image":
      return (
        <View className="overflow-hidden rounded-xl">
          <ImageMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * VIDÉO
     * ====================================================================== */

    case "video":
      return (
        <View className="overflow-hidden rounded-xl">
          <VideoMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * FICHIER / DOCUMENT
     * ====================================================================== */

    case "file":
    case "document":
      return (
        <View className="min-w-[230px] max-w-[360px]">
          <FileMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * LOCALISATION
     * ====================================================================== */

    case "location":
      return (
        <View className="min-w-[250px] max-w-[360px]">
          <LocationMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * CONTACT
     * ====================================================================== */

    case "contact":
      return (
        <View className="min-w-[250px] max-w-[360px]">
          <ContactMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * ÉVÉNEMENT
     * ====================================================================== */

    case "event":
      return (
        <View className="min-w-[260px] max-w-[380px]">
          <EventMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * JOB
     * ====================================================================== */

    case "job":
      return (
        <View className="min-w-[260px] max-w-[390px]">
          <JobMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * IMMOBILIER
     * ====================================================================== */

    case "property":
    case "immo":
      return (
        <View className="min-w-[260px] max-w-[390px]">
          <PropertyMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * SONDAGE
     * ====================================================================== */

    case "poll":
      return (
        <View className="min-w-[260px] max-w-[390px]">
          <PollMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * PAIEMENT
     * ====================================================================== */

    case "payment":
      return (
        <View className="min-w-[260px] max-w-[390px]">
          <PaymentMessageRenderer message={message} own={own} />
        </View>
      );

    /* ========================================================================
     * FALLBACK
     * ====================================================================== */

    default:
      return <UnsupportedMessage message={message} />;
  }
}

export default MessageTypeRenderer;
