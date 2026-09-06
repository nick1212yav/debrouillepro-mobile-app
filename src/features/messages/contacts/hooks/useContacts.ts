// src/features/messages/contacts/hooks/useContacts.ts

import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  contactsApi,
  normalizeContact,
  type Contact,
  type ContactId,
  type ConversationId,
} from "../services/contacts.service";

export interface UseContactsOptions {
  search?: string;
  limit?: number;
  enabled?: boolean;
}

export function useContacts(options: UseContactsOptions = {}) {
  const { search = "", limit = 30, enabled = true } = options;

  const normalizedSearch = search.trim();

  const contacts = useQuery(
    contactsApi.search,
    enabled
      ? {
          search: normalizedSearch,
          limit,
        }
      : "skip",
  );

  const getContact = (contactId: ContactId) => {
    return useQuery(
      contactsApi.get,
      contactId
        ? {
            userId: contactId,
          }
        : "skip",
    );
  };

  const sendContactMutation = useMutation(contactsApi.send);

  const normalizedContacts = useMemo<Contact[]>(
    () => (contacts ?? []).map((contact) => normalizeContact(contact)),
    [contacts],
  );

  const sendContact = async ({
    conversationId,
    contactId,
    message,
  }: {
    conversationId: ConversationId;
    contactId: ContactId;
    message?: string;
  }) => {
    return sendContactMutation({
      conversationId,
      contactId,
      message,
    });
  };

  return {
    contacts: normalizedContacts,

    isLoading: contacts === undefined,

    search: normalizedSearch,

    getContact,

    sendContact,
  };
}
