import { InvoiceGenerator } from "./InvoiceGenerator";
import type { InvoiceMetadata } from "./InvoiceGenerator";

export class ReceiptService {
  private static receiptsArchive: Map<string, InvoiceMetadata> = new Map();

  /**
   * Archive un reçu comptable généré et simule son envoi au client
   */
  public static async archiveAndDispatchReceipt(
    meta: InvoiceMetadata,
    clientEmail?: string,
  ): Promise<boolean> {
    this.receiptsArchive.set(meta.invoiceNumber, meta);
    console.log(
      `[ReceiptService] Reçu ${meta.invoiceNumber} archivé avec succès en base de données comptable.`,
    );

    if (clientEmail) {
      const printableReceipt = InvoiceGenerator.formatToTextReceipt(meta);
      console.log(
        `[ReceiptService] Dispatch de l'email de confirmation de facturation à ${clientEmail}.`,
      );
      // Simulation d'un envoi de mail asynchrone réussi
    }

    return true;
  }

  /**
   * Récupère un reçu archivé à partir de son numéro de facture
   */
  public static getArchivedReceipt(
    invoiceNumber: string,
  ): InvoiceMetadata | null {
    return this.receiptsArchive.get(invoiceNumber) || null;
  }
}
