export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/[^0-9+]/g, "");
    return cleaned.length >= 8 && cleaned.length <= 15;
  }

  static isValidCardNumber(cardNumber: string): boolean {
    const cleaned = cardNumber.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleaned)) return false;

    // Algorithme de Luhn
    let sum = 0;
    let shouldDouble = false;
    for (let i = cleaned.length - 1; i >= 0; i--) {
      let digit = parseInt(cleaned.charAt(i), 10);
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }
}
