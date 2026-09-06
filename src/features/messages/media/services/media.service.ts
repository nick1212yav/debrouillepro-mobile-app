import type { Id } from "@/convex/_generated/dataModel";

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
   */
  async uploadFile(
    generateUploadUrl: GenerateUploadUrlMutation,
    file: File,
  ): Promise<string> {
    if (!(file instanceof File)) {
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
      body: file,
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

  async prepareUpload(
    generateUploadUrl: GenerateUploadUrlMutation,
    file: File,
  ): Promise<UploadFileResult> {
    if (file.size <= 0) {
      throw new Error("Le fichier est vide.");
    }

    const dimensions = await this.getImageDimensions(file);
    const duration = await this.getVideoDuration(file);

    const fileId = await this.uploadFile(generateUploadUrl, file);

    return {
      fileId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      ...dimensions,
      duration,
    };
  },

  async addAttachment(
    mutation: AddAttachmentMutation,
    args: AddAttachmentArgs,
  ) {
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

  async getAttachments(query: GetAttachmentsQuery, messageId: Id<"messages">) {
    return query({ messageId });
  },

  async deleteAttachment(
    mutation: DeleteAttachmentMutation,
    attachmentId: Id<"attachments">,
  ) {
    return mutation({ attachmentId });
  },

  async getImageDimensions(
    file: File,
  ): Promise<{ width?: number; height?: number }> {
    if (!file.type.startsWith("image/")) {
      return {};
    }

    if (typeof undefined === "undefined") {
      return {};
    }

    return new Promise((resolve) => {
      const image = new Image();
      const url = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(url);

        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({});
      };

      image.src = url;
    });
  },

  async getVideoDuration(file: File): Promise<number | undefined> {
    if (!file.type.startsWith("video/")) {
      return undefined;
    }

    if (typeof undefined === "undefined") {
      return undefined;
    }

    return new Promise((resolve) => {
      const video = undefined("video");
      const url = URL.createObjectURL(file);

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const duration = Number.isFinite(video.duration)
          ? video.duration
          : undefined;

        URL.revokeObjectURL(url);
        resolve(duration);
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(undefined);
      };

      video.src = url;
    });
  },

  createLocalPreviewUrl(file: File) {
    return URL.createObjectURL(file);
  },

  revokeLocalPreviewUrl(url: string) {
    if (typeof URL !== "undefined") {
      URL.revokeObjectURL(url);
    }
  },
};

export default mediaService;
