// src/features/marketplace/validators/seller.validator.ts

export class SellerValidator {
  validateName(name: string): boolean {
    return name.trim().length >= 2 && name.trim().length <= 50;
  }

  validateBio(bio: string): boolean {
    return bio.trim().length <= 500;
  }

  validateLocation(location: string): boolean {
    return location.trim().length >= 2;
  }

  validatePhone(phone: string): boolean {
    const phoneRegex = /^[0-9+\s\-()]{8,15}$/;
    return phoneRegex.test(phone);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const sellerValidator = new SellerValidator();
