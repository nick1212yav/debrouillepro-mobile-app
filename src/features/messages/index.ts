// src/features/messages/index.ts

// ============================================================================
// TYPES
// ============================================================================

export * from "./types";

// ============================================================================
// PAGE PRINCIPALE
// ============================================================================

export { default as MessagesPage } from "./MessagesPage";

// ============================================================================
// CHAT
// ============================================================================

export { default as ChatView } from "./chat/components/ChatView";
export { default as ChatHeader } from "./chat/components/ChatHeader";
export { default as MessagesArea } from "./chat/components/MessagesArea";
export { default as MessageBubble } from "./chat/components/MessageBubble";
export { default as MessageComposer } from "./chat/components/MessageComposer";

// ============================================================================
// CONVERSATIONS
// ============================================================================

export { default as ConversationList } from "./conversations/components/ConversationList";
export { default as ConversationItem } from "./conversations/components/ConversationItem";
export { default as ConversationHeader } from "./conversations/components/ConversationHeader";

// ============================================================================
// GROUPES
// ============================================================================

export { default as GroupList } from "./groups/components/GroupList";
export { default as GroupItem } from "./groups/components/GroupItem";
export { default as GroupHeader } from "./groups/components/GroupHeader";

// ============================================================================
// MÉDIA
// ============================================================================

export { default as AttachmentPicker } from "./media/components/AttachmentPicker";
export { default as AttachmentPreview } from "./media/components/AttachmentPreview";
export { default as ImagePreview } from "./media/components/ImagePreview";
export { default as VideoPreview } from "./media/components/VideoPreview";
export { default as AudioPlayer } from "./media/components/AudioPlayer";
export { default as FilePreview } from "./media/components/FilePreview";
export { default as MediaGallery } from "./media/components/MediaGallery";
export { default as MediaViewer } from "./media/components/MediaViewer";

// ============================================================================
// VOCAL
// ============================================================================

export { default as VoiceRecorder } from "./voice/components/VoiceRecorder";
export { default as VoiceMessage } from "./voice/components/VoiceMessage";
export { default as VoicePlayer } from "./voice/components/VoicePlayer";
export { default as VoiceWaveform } from "./voice/components/VoiceWaveform";

// ============================================================================
// PRÉSENCE
// ============================================================================

export { default as PresenceIndicator } from "./presence/components/PresenceIndicator";
export { default as PresenceStatus } from "./presence/components/PresenceStatus";

// ============================================================================
// ACCUSÉS DE LECTURE
// ============================================================================

export { default as ReadReceipt } from "./readReceipts/components/ReadReceipt";

// ============================================================================
// TYPING
// ============================================================================

export { default as TypingIndicator } from "./typing/components/TypingIndicator";

// ============================================================================
// RECHERCHE
// ============================================================================

export { default as MessageSearch } from "./search/components/MessageSearch";
export { default as SearchResults } from "./search/components/SearchResults";
export { default as SearchFilters } from "./search/components/SearchFilters";

// ============================================================================
// TRANSFERT
// ============================================================================

export { default as ForwardDialog } from "./forwarding/components/ForwardDialog";
export { default as ForwardPreview } from "./forwarding/components/ForwardPreview";

// ============================================================================
// MESSAGES ÉPINGLÉS
// ============================================================================

export { default as PinnedMessages } from "./pins/components/PinnedMessages";
export { default as PinnedMessageItem } from "./pins/components/PinnedMessageItem";

// ============================================================================
// LOCALISATION
// ============================================================================

export { default as LocationPicker } from "./locations/components/LocationPicker";
export { default as LocationMessage } from "./locations/components/LocationMessage";
export { default as LiveLocation } from "./locations/components/LiveLocation";

// ============================================================================
// CONTACTS
// ============================================================================

export { default as ContactPicker } from "./contacts/components/ContactPicker";
export { default as ContactMessage } from "./contacts/components/ContactMessage";

// ============================================================================
// ÉVÉNEMENTS
// ============================================================================

export { default as EventMessage } from "./events/components/EventMessage";

// ============================================================================
// JOBS
// ============================================================================

// JobMessage expose un export nommé, pas un export default.
export { JobMessage } from "./jobs/components/JobMessage";

// ============================================================================
// IMMOBILIER
// ============================================================================

export { default as PropertyMessage } from "./immo/components/PropertyMessage";
export { default as PropertyPreview } from "./immo/components/PropertyPreview";

// ============================================================================
// PAIEMENTS
// ============================================================================

export { default as PaymentMessage } from "./payments/components/PaymentMessage";
export { default as PaymentComposer } from "./payments/components/PaymentComposer";

// ============================================================================
// IA
// ============================================================================

export { default as AiActions } from "./ai/components/AiActions";
export { default as ConversationSummary } from "./ai/components/ConversationSummary";
export { default as SuggestedReply } from "./ai/components/SuggestedReply";
export { default as TranslationPanel } from "./ai/components/TranslationPanel";

// ============================================================================
// SÉCURITÉ
// ============================================================================

export { default as BlockUserDialog } from "./security/components/BlockUserDialog";
export { default as ReportMessageDialog } from "./security/components/ReportMessageDialog";
export { default as ConversationSecurity } from "./security/components/ConversationSecurity";

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export { default as MessageNotification } from "./notifications/components/MessageNotification";

// ============================================================================
// ANALYTICS
// ============================================================================

export { default as AnalyticsDashboard } from "./analytics/components/AnalyticsDashboard";
export { default as AnalyticsSummary } from "./analytics/components/AnalyticsSummary";
export { default as AnalyticsChart } from "./analytics/components/AnalyticsChart";
export { default as AnalyticsCard } from "./analytics/components/AnalyticsCard";

export type { AnalyticsPeriod } from "./analytics/components/AnalyticsPeriod";

export { default as TopPublications } from "./analytics/components/TopPublications";

// ============================================================================
// HOOKS PRINCIPAUX
// ============================================================================

export { default as useMessagesFeature } from "./hooks/useMessagesFeature";
export { default as useMessagePermissions } from "./hooks/useMessagePermissions";

// ============================================================================
// HOOK ANALYTICS
// ============================================================================

export { default as useAnalytics } from "./analytics/hooks/useAnalytics";

// ============================================================================
// STORES
// ============================================================================

export { default as messagesStore } from "./stores/messages.store";
export { default as conversationsStore } from "./stores/conversations.store";
export { default as chatStore } from "./stores/chat.store";
export { default as callsStore } from "./stores/calls.store";
