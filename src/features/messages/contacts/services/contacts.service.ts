// src/features/messages/contacts/services/contacts.service.ts

import type { FunctionReference } from "convex/server";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { api } from "../../../../../convex/_generated/api";

export type ContactId = Id<"users">;
export type ConversationId = Id<"conversations">;
export type MessageId = Id<"messages">;

export interface Contact {
  _id: ContactId;
  _creationTime?: number;

  name: string;
  email?: string;
  phone?: string;
  avatar?: string;

  city?: string;
  country?: string;
  profession?: string;
  bio?: string;

  isOnline?: boolean;
}

export interface ContactMessageData {
  type: "contact";
  contactId: ContactId;

  name: string;
  phone?: string;
  avatar?: string;
  email?: string;
  profession?: string;
  city?: string;
}

export interface ContactMessage {
  _id: MessageId;
  conversationId: ConversationId;
  senderId: ContactId;

  text: string;

  type: "contact";

  status: "sent" | "delivered" | "read" | "failed";

  reactions?: Array<{
    emoji: string;
    count: number;
  }>;

  metadata?: ContactMessageData;

  createdAt?: number;
  _creationTime?: number;
}

/**
 * API Convex.
 *
 * `contacts.ts` est ajouté côté backend.
 */
export const contactsApi = {
  search: api.contacts.search,
  get: api.contacts.get,
  send: api.contacts.send,
} as const;

/**
 * Normalise le résultat utilisateur renvoyé par Convex.
 */
export function normalizeContact(user: Contact): Contact {
  return {
    _id: user._id,
    _creationTime: user._creationTime,

    name: user.name,
    email: user.email,
    phone: user.phone,
    avatar: user.avatar,

    city: user.city,
    country: user.country,
    profession: user.profession,
    bio: user.bio,

    isOnline: user.isOnline,
  };
}

/**
 * Texte de fallback affiché dans les listes de messages
 * lorsque le backend ne fournit pas encore le renderer spécialisé.
 */
export function getContactMessageText(contact: Contact): string {
  return `👤 ${contact.name}${contact.phone ? ` · ${contact.phone}` : ""}`;
}
