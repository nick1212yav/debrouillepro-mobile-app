export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceMetadata {
  invoiceNumber: string;
  orderId: string;
  clientName: string;
  restaurantName: string;
  lines: InvoiceLine[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  totalAmount: number;
  issuedAt: string;
}

export class InvoiceGenerator {
  /**
   * Génère l'ensemble des métadonnées d'une facture commerciale d'achat
   */
  public static compileInvoice(
    orderId: string,
    clientName: string,
    restaurantName: string,
    items: Array<{ name: string; quantity: number; price: number }>,
    deliveryFee: number,
  ): InvoiceMetadata {
    const lines: InvoiceLine[] = items.map((item) => ({
      description: item.name,
      quantity: item.quantity,
      unitPrice: item.price,
      total: item.price * item.quantity,
    }));

    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    const tax = Math.round(subtotal * 0.05); // TVA locale simulée à 5%
    const totalAmount = subtotal + tax + deliveryFee;

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;

    return {
      invoiceNumber,
      orderId,
      clientName,
      restaurantName,
      lines,
      subtotal,
      deliveryFee,
      tax,
      totalAmount,
      issuedAt: new Date().toISOString(),
    };
  }

  /**
   * Formate la facture au format textuel brut pour impression ou reçu SMS
   */
  public static formatToTextReceipt(meta: InvoiceMetadata): string {
    let text = `=================================\n`;
    text += `        FACTURE COMMERCIALE      \n`;
    text += `       N° : ${meta.invoiceNumber}\n`;
    text += `=================================\n`;
    text += `Date : ${new Date(meta.issuedAt).toLocaleDateString("fr-FR")}\n`;
    text += `Établissement : ${meta.restaurantName}\n`;
    text += `Client : ${meta.clientName}\n`;
    text += `---------------------------------\n`;

    meta.lines.forEach((line) => {
      text += `${line.description}\n`;
      text += `  ${line.quantity} x ${line.unitPrice.toLocaleString()} FCFA = ${line.total.toLocaleString()} FCFA\n`;
    });

    text += `---------------------------------\n`;
    text += `Sous-total : ${meta.subtotal.toLocaleString()} FCFA\n`;
    text += `Frais Livraison : ${meta.deliveryFee.toLocaleString()} FCFA\n`;
    text += `Taxes (5%) : ${meta.tax.toLocaleString()} FCFA\n`;
    text += `=================================\n`;
    text += `TOTAL PAYÉ : ${meta.totalAmount.toLocaleString()} FCFA\n`;
    text += `=================================\n`;
    text += `Merci pour votre confiance !\n`;

    return text;
  }
}
