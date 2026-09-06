// src/features/agri/hooks/useAgri.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";

export function useAgri() {
  const createProduct = useMutation(api.agri.createProduct);
  const updateProduct = useMutation(api.agri.updateProduct);
  const deleteProduct = useMutation(api.agri.deleteProduct);

  return {
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
