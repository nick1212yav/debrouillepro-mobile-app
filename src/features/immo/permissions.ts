import type { ModulePermissions } from "@/core/sdk/types";

export const permissions: ModulePermissions = {
  view: ["all"],
  create: ({ user }) =>
    user?.roles?.includes("particulier") ||
    user?.roles?.includes("entreprise") ||
    user?.roles?.includes("admin"),
  edit: ({ user }) =>
    user?.roles?.includes("particulier") ||
    user?.roles?.includes("entreprise") ||
    user?.roles?.includes("admin"),
  delete: ({ user }) => user?.roles?.includes("admin"),
};
