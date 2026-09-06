// src/features/agri/validators/agri.validator.ts
import { validateAgriProduct } from "./product.validator";
import { validateAgriSeller } from "./seller.validator";

export const AgriValidator = {
  validateProduct: validateAgriProduct,
  validateSeller: validateAgriSeller,
};
