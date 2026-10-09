// src/features/messages/media/services/media.service.ts

import type { Id } from "@/convex/_generated/dataModel";

export interface NativeMediaFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface AddAttachmentArgs {
  messageId: Id<"messages">;
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface Attachment {
  _id: Id<"attachments">;
  _creationTime: number;
  messageId: Id<"messages">;
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  createdAt: string;
}

export interface UploadFileResult {
  fileId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
}

type GenerateUploadUrlMutation = () => Promise<string>;

type AddAttachmentMutation = (
  args: AddAttachmentArgs,
) => Promise<Id<"attachments">>;

type GetAttachmentsQuery = (args: {
  messageId: Id<"messages">;
}) => Promise<Attachment[]>;

type DeleteAttachmentMutation = (args: {
  attachmentId: Id<"attachments">;
}) => Promise<boolean>;

export const mediaService = {
  /**
   * Upload réel dans Convex Storage.
   *
   * Flux :
   * generateUploadUrl()
   *       ↓
   * POST multipart/octet-stream
   *       ↓
   * storageId
   */
  async uploadFile(
    generateUploadUrl: GenerateUploadUrlMutation,
    file: NativeMediaFile,
  ): Promise<string> {
    if (!file.uri.trim()) {
      throw new Error("Fichier invalide.");
    }

    if (file.size <= 0) {
      throw new Error("Le fichier est vide.");
    }

    const uploadUrl = await generateUploadUrl();

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: await this.createUploadBody(file),
    });

    if (!response.ok) {
      throw new Error(`Échec de l'upload du fichier (${response.status}).`);
    }

    const result = (await response.json()) as {
      storageId?: string;
    };

    if (!result.storageId) {
      throw new Error("Convex n'a pas retourné de storageId.");
    }

    return result.storageId;
  },

  /**
   * Prépare puis envoie un fichier.
   */
  async prepareUpload(
    generateUploadUrl: GenerateUploadUrlMutation,
    file: NativeMediaFile,
  ): Promise<UploadFileResult> {
    if (!file.uri.trim()) {
      throw new Error("Fichier invalide.");
    }

    if (file.size <= 0) {
      throw new Error("Le fichier est vide.");
    }

    const dimensions = await this.getImageDimensions(file);

    const duration = await this.getVideoDuration(file);

    const fileId = await this.uploadFile(generateUploadUrl, file);

    return {
      fileId,
      fileName: file.name || "fichier",
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      ...dimensions,
      duration,
    };
  },

  /**
   * Crée le body attendu par fetch
   * pour un fichier local React Native.
   */
  async createUploadBody(file: NativeMediaFile): Promise<Blob> {
    const response = await fetch(file.uri);

    if (!response.ok) {
      throw new Error("Impossible de lire le fichier local.");
    }

    return response.blob();
  },

  async addAttachment(
    mutation: AddAttachmentMutation,
    args: AddAttachmentArgs,
  ): Promise<Id<"attachments">> {
    if (!args.fileId.trim()) {
      throw new Error("Identifiant du fichier manquant.");
    }

    if (!args.fileName.trim()) {
      throw new Error("Nom du fichier manquant.");
    }

    if (!args.mimeType.trim()) {
      throw new Error("Type MIME du fichier manquant.");
    }

    if (args.fileSize < 0) {
      throw new Error("La taille du fichier est invalide.");
    }

    return mutation(args);
  },

  async getAttachments(
    query: GetAttachmentsQuery,
    messageId: Id<"messages">,
  ): Promise<Attachment[]> {
    return query({ messageId });
  },

  async deleteAttachment(
    mutation: DeleteAttachmentMutation,
    attachmentId: Id<"attachments">,
  ): Promise<boolean> {
    return mutation({ attachmentId });
  },

  /**
   * Les dimensions sont normalement fournies
   * directement par expo-image-picker.
   *
   * Le service conserve donc ces métadonnées
   * lorsqu'elles existent déjà.
   */
  async getImageDimensions(file: NativeMediaFile): Promise<{
    width?: number;
    height?: number;
  }> {
    if (!file.type.startsWith("image/")) {
      return {};
    }

    if (file.width === undefined || file.height === undefined) {
      return {};
    }

    return {
      width: file.width,
      height: file.height,
    };
  },

  /**
   * La durée vidéo est fournie par
   * expo-image-picker lorsqu'elle est disponible.
   */
  async getVideoDuration(file: NativeMediaFile): Promise<number | undefined> {
    if (!file.type.startsWith("video/")) {
      return undefined;
    }

    return file.duration;
  },

  /**
   * En React Native, il n'existe pas
   * d'équivalent direct et universel à
   * URL.createObjectURL(File).
   *
   * L'URI locale du picker est déjà
   * utilisable comme preview.
   */
  createLocalPreviewUrl(file: NativeMediaFile): string {
    return file.uri;
  },

  /**
   * Les URI locales RN ne nécessitent pas
   * URL.revokeObjectURL().
   */
  revokeLocalPreviewUrl(_url: string): void {
    // No-op volontairement :
    // les URI locales RN sont gérées
    // par le système / picker.
  },
};

export default mediaService;
