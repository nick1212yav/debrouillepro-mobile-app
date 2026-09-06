import { MobileMoneyAdapter } from "./MobileMoneyAdapter";
import type { MobileMoneyProvider } from "./MobileMoneyAdapter";

import { CardAdapter } from "./CardAdapter";
import type { CardPaymentInput } from "./CardAdapter";

import { InvoiceGenerator } from "./InvoiceGenerator";
import type { InvoiceMetadata } from "./InvoiceGenerator";
import { CryptoAdapter } from "./CryptoAdapter";
import { EscrowService } from "./EscrowService";
import { ReceiptService } from "./ReceiptService";

export interface CheckoutSessionPayload {
  orderId: string;
  clientName: string;
  clientEmail?: string;
  restaurantName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  deliveryFee: number;
  paymentMethod:
    | "orange_money"
    | "wave"
    | "moov"
    | "mtn"
    | "card"
    | "crypto"
    | "cash";
  paymentDetails: {
    phoneNumber?: string;
    cardDetails?: CardPaymentInput;
    cryptoCurrency?: "USDT" | "USDC" | "BTC";
  };
}

export class PaymentService {
  /**
   * Initialise et valide un flux complet de paiement de commande
   */
  public static async executeCheckout(
    payload: CheckoutSessionPayload,
  ): Promise<{
    success: boolean;
    referenceCode: string;
    invoice?: InvoiceMetadata;
    cryptoPayload?: any;
    errorMessage?: string;
  }> {
    const invoice = InvoiceGenerator.compileInvoice(
      payload.orderId,
      payload.clientName,
      payload.restaurantName,
      payload.items,
      payload.deliveryFee,
    );

    const amountToPay = invoice.totalAmount;

    // 1. Branche de paiement cash (aucun prélèvement numérique)
    if (payload.paymentMethod === "cash") {
      await ReceiptService.archiveAndDispatchReceipt(
        invoice,
        payload.clientEmail,
      );
      return {
        success: true,
        referenceCode: `CASH-${Date.now().toString().slice(-6)}`,
        invoice,
      };
    }

    // 2. Branche de prélèvement Mobile Money
    const mobileMoneyMethods: Record<string, MobileMoneyProvider> = {
      orange_money: "orange",
      wave: "wave",
      moov: "moov",
      mtn: "mtn",
    };

    if (payload.paymentMethod in mobileMoneyMethods) {
      if (!payload.paymentDetails.phoneNumber) {
        return {
          success: false,
          referenceCode: "",
          errorMessage: "Numéro Mobile Money requis.",
        };
      }

      const provider = mobileMoneyMethods[payload.paymentMethod];
      const mmResponse = await MobileMoneyAdapter.initiatePayment(
        payload.paymentDetails.phoneNumber,
        amountToPay,
        provider,
      );

      if (mmResponse.success) {
        // Enregistrement différé du reçu (sera marqué payé à la confirmation du Push)
        await ReceiptService.archiveAndDispatchReceipt(
          invoice,
          payload.clientEmail,
        );
        return {
          success: true,
          referenceCode: mmResponse.transactionId,
          invoice,
        };
      }
    }

    // 3. Branche de règlement par carte bancaire
    if (payload.paymentMethod === "card") {
      if (!payload.paymentDetails.cardDetails) {
        return {
          success: false,
          referenceCode: "",
          errorMessage: "Informations de carte bancaire manquantes.",
        };
      }

      const cardResponse = await CardAdapter.processPayment(
        payload.paymentDetails.cardDetails,
        amountToPay,
      );

      if (cardResponse.success) {
        await ReceiptService.archiveAndDispatchReceipt(
          invoice,
          payload.clientEmail,
        );
        return {
          success: true,
          referenceCode: cardResponse.referenceCode,
          invoice,
        };
      }
    }

    // 4. Branche de règlement Crypto
    if (payload.paymentMethod === "crypto") {
      const cryptoCurrency = payload.paymentDetails.cryptoCurrency || "USDT";
      const cryptoInvoice = CryptoAdapter.generateInvoice(
        amountToPay,
        cryptoCurrency,
      );

      await ReceiptService.archiveAndDispatchReceipt(
        invoice,
        payload.clientEmail,
      );

      return {
        success: true,
        referenceCode: `CRYPTO-${cryptoInvoice.address.slice(0, 8)}`,
        invoice,
        cryptoPayload: cryptoInvoice,
      };
    }

    return {
      success: false,
      referenceCode: "",
      errorMessage: "Moyen de paiement non pris en charge.",
    };
  }

  /**
   * Optionnel : Exécute le blocage d'un paiement en séquestre (Escrow) pour les services de Chef à domicile
   */
  public static async holdChefBookingPayment(
    orderId: string,
    amount: number,
  ): Promise<string> {
    return EscrowService.holdFunds(orderId, amount);
  }
}
