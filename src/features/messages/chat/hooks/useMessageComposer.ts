// src/features/messages/chat/hooks/useMessageComposer.ts

import { useCallback, useState } from "react";

import type { Id } from "@/convex/_generated/dataModel";

import type { Message } from "../services/chat.service";
import { useMessageActions } from "./useMessageActions";

export type ComposerMode =
  | "text"
  | "attachment"
  | "voice"
  | "location"
  | "contact"
  | "event"
  | "job"
  | "property"
  | "poll"
  | "payment";

export interface ComposerAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface ComposerLocation {
  latitude: number;
  longitude: number;
  label?: string;
  address?: string;
}

export interface ComposerContact {
  userId?: Id<"users">;
  name: string;
  phone?: string;
  avatar?: string;
}

export interface ComposerEvent {
  eventId?: Id<"events">;
  title: string;
  description?: string;
  startsAt?: string;
  location?: string;
}

/**
 * IMPORTANT :
 * "jobs" n'existe pas actuellement comme table Convex.
 *
 * On garde donc un identifiant applicatif générique.
 * Le module jobs pourra ensuite le remplacer par son propre type
 * lorsqu'une table Convex "jobs" existera réellement.
 */
export interface ComposerJob {
  jobId?: string;
  title: string;
  description?: string;
}

export interface ComposerProperty {
  propertyId?: Id<"properties">;
  title: string;
  description?: string;
}

export interface ComposerPoll {
  question: string;
  options: string[];
  multipleChoice?: boolean;
  anonymous?: boolean;
  expiresAt?: string;
}

export interface ComposerPayment {
  amount: number;
  currency: string;
  description?: string;
}

export interface UseMessageComposerOptions {
  disabled?: boolean;
}

export function useMessageComposer(
  conversationId: Id<"conversations"> | null | undefined,
  options?: UseMessageComposerOptions,
) {
  const { sendMessage } = useMessageActions();

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const [sharedPublicationId, setSharedPublicationId] =
    useState<Id<"publications"> | null>(null);

  const [mode, setMode] = useState<ComposerMode>("text");

  const [attachment, setAttachment] = useState<ComposerAttachment | null>(null);

  const [location, setLocation] = useState<ComposerLocation | null>(null);

  const [contact, setContact] = useState<ComposerContact | null>(null);

  const [event, setEvent] = useState<ComposerEvent | null>(null);

  const [job, setJob] = useState<ComposerJob | null>(null);

  const [property, setProperty] = useState<ComposerProperty | null>(null);

  const [poll, setPoll] = useState<ComposerPoll | null>(null);

  const [payment, setPayment] = useState<ComposerPayment | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = options?.disabled ?? false;

  // ==========================================================================
  // RESET MODULES
  // ==========================================================================

  const resetModules = useCallback(() => {
    setAttachment(null);
    setLocation(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  // ==========================================================================
  // RESET COMPLET
  // ==========================================================================

  const reset = useCallback(() => {
    setText("");
    setReplyTo(null);
    setSharedPublicationId(null);

    resetModules();

    setMode("text");
    setError(null);
  }, [resetModules]);

  // ==========================================================================
  // TEXT
  // ==========================================================================

  const selectText = useCallback(() => {
    setMode("text");
    resetModules();
  }, [resetModules]);

  // ==========================================================================
  // REPLY
  // ==========================================================================

  const cancelReply = useCallback(() => {
    setReplyTo(null);
  }, []);

  const selectReply = useCallback((message: Message) => {
    setReplyTo(message);
  }, []);

  // ==========================================================================
  // PUBLICATION
  // ==========================================================================

  const selectPublication = useCallback((publicationId: Id<"publications">) => {
    setSharedPublicationId(publicationId);
  }, []);

  const clearPublication = useCallback(() => {
    setSharedPublicationId(null);
  }, []);

  // ==========================================================================
  // ATTACHMENT
  // ==========================================================================

  const selectAttachment = useCallback((value: ComposerAttachment) => {
    setAttachment(value);
    setMode("attachment");

    setLocation(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearAttachment = useCallback(() => {
    setAttachment(null);

    if (mode === "attachment") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // LOCATION
  // ==========================================================================

  const selectLocation = useCallback((value: ComposerLocation) => {
    setLocation(value);
    setMode("location");

    setAttachment(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);

    if (mode === "location") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // CONTACT
  // ==========================================================================

  const selectContact = useCallback((value: ComposerContact) => {
    setContact(value);
    setMode("contact");

    setAttachment(null);
    setLocation(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearContact = useCallback(() => {
    setContact(null);

    if (mode === "contact") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // EVENT
  // ==========================================================================

  const selectEvent = useCallback((value: ComposerEvent) => {
    setEvent(value);
    setMode("event");

    setAttachment(null);
    setLocation(null);
    setContact(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearEvent = useCallback(() => {
    setEvent(null);

    if (mode === "event") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // JOB
  // ==========================================================================

  const selectJob = useCallback((value: ComposerJob) => {
    setJob(value);
    setMode("job");

    setAttachment(null);
    setLocation(null);
    setContact(null);
    setEvent(null);
    setProperty(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearJob = useCallback(() => {
    setJob(null);

    if (mode === "job") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // PROPERTY
  // ==========================================================================

  const selectProperty = useCallback((value: ComposerProperty) => {
    setProperty(value);
    setMode("property");

    setAttachment(null);
    setLocation(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setPoll(null);
    setPayment(null);
  }, []);

  const clearProperty = useCallback(() => {
    setProperty(null);

    if (mode === "property") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // POLL
  // ==========================================================================

  const selectPoll = useCallback((value: ComposerPoll) => {
    setPoll(value);
    setMode("poll");

    setAttachment(null);
    setLocation(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPayment(null);
  }, []);

  const clearPoll = useCallback(() => {
    setPoll(null);

    if (mode === "poll") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // PAYMENT
  // ==========================================================================

  const selectPayment = useCallback((value: ComposerPayment) => {
    setPayment(value);
    setMode("payment");

    setAttachment(null);
    setLocation(null);
    setContact(null);
    setEvent(null);
    setJob(null);
    setProperty(null);
    setPoll(null);
  }, []);

  const clearPayment = useCallback(() => {
    setPayment(null);

    if (mode === "payment") {
      setMode("text");
    }
  }, [mode]);

  // ==========================================================================
  // VOICE
  // ==========================================================================

  const selectVoice = useCallback(() => {
    setMode("voice");
    resetModules();
  }, [resetModules]);

  // ==========================================================================
  // ENVOI
  // ==========================================================================

  const send = useCallback(async () => {
    if (disabled || !conversationId || isSending) {
      return null;
    }

    const trimmedText = text.trim();

    /*
     * Le composer orchestre.
     *
     * Les modules spécialisés prennent en charge :
     * - Storage
     * - attachments
     * - voice
     * - location
     * - contacts
     * - events
     * - jobs
     * - immo
     * - polls
     * - payments
     *
     * Ici, l'envoi directement géré reste le message texte.
     */

    if (mode !== "text" && !trimmedText) {
      return null;
    }

    if (!trimmedText) {
      return null;
    }

    setIsSending(true);
    setError(null);

    try {
      const result = await sendMessage({
        conversationId,
        text: trimmedText,
        ...(replyTo
          ? {
              replyToId: replyTo._id,
            }
          : {}),
        ...(sharedPublicationId
          ? {
              sharedPublicationId,
            }
          : {}),
      });

      reset();

      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Impossible d'envoyer le message.";

      setError(message);

      throw err;
    } finally {
      setIsSending(false);
    }
  }, [
    disabled,
    conversationId,
    isSending,
    text,
    mode,
    replyTo,
    sharedPublicationId,
    sendMessage,
    reset,
  ]);

  return {
    text,
    setText,

    replyTo,
    selectReply,
    cancelReply,

    sharedPublicationId,
    selectPublication,
    clearPublication,

    mode,
    setMode,
    selectText,

    attachment,
    selectAttachment,
    clearAttachment,

    selectVoice,

    location,
    selectLocation,
    clearLocation,

    contact,
    selectContact,
    clearContact,

    event,
    selectEvent,
    clearEvent,

    job,
    selectJob,
    clearJob,

    property,
    selectProperty,
    clearProperty,

    poll,
    selectPoll,
    clearPoll,

    payment,
    selectPayment,
    clearPayment,

    isSending,
    error,
    disabled,

    send,
    reset,
  };
}

export default useMessageComposer;
