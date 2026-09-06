// src/features/marketplace/validators/checkout.validator.ts

export interface CheckoutValidation {
  address: boolean;
  items: boolean;
  payment: boolean;
}

export class CheckoutValidator {
  validateAddress(address: string): boolean {
    return address.trim().length > 5;
  }

  validateItems(items: Array<{ quantity: number; stock: number }>): boolean {
    return items.every(
      (item) => item.quantity <= item.stock && item.quantity > 0,
    );
  }

  validatePayment(method: string): boolean {
    const validMethods = ["card", "mobile_money", "cash_on_delivery"];
    return validMethods.includes(method);
  }

  validateAll(
    address: string,
    items: Array<{ quantity: number; stock: number }>,
    paymentMethod: string,
  ): CheckoutValidation {
    return {
      address: this.validateAddress(address),
      items: this.validateItems(items),
      payment: this.validatePayment(paymentMethod),
    };
  }
}

export const checkoutValidator = new CheckoutValidator();
