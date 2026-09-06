// src/features/transport/payments/MobileMoneyAdapter.ts

export interface MobileMoneyRequest {
  phone: string;
  amount: number;
  currency: string;
  operator: "orange" | "mtn" | "airtel" | "mpesa";
}

export interface MobileMoneyResponse {
  success: boolean;
  momoReference: string;
  operatorStatus: "SUCCESS" | "PENDING_OTP" | "FAILED";
}

export class MobileMoneyAdapter {
  /**
   * Initier une transaction Push USSD de débit immédiat [2]
   */
  static async initiateDebit(
    req: MobileMoneyRequest,
  ): Promise<MobileMoneyResponse> {
    const cleanPhone = req.phone.replace(/\s+/g, "");
    const momoReference = `MOMO-API-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return new Promise((resolve) => {
      // Simulation d'interfaçage réseau avec Orange, MTN, Airtel ou Vodacom [2]
      setTimeout(() => {
        if (cleanPhone.length < 8) {
          resolve({
            success: false,
            momoReference,
            operatorStatus: "FAILED",
          });
          return;
        }

        resolve({
          success: true,
          momoReference,
          operatorStatus:
            req.operator === "orange" || req.operator === "mtn"
              ? "PENDING_OTP"
              : "SUCCESS",
        });
      }, 1000);
    });
  }
}
