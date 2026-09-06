import type { NavSection, UserPermissions } from "./navigation.types";
import { hasPermission } from "./constants/permissions";
import {
  mainNavigation,
  modulesNavigation,
  creationNavigation,
  travelNavigation,
  accountNavigation,
  supportNavigation,
  adminNavigation,
} from "./config";

export function buildNavigation(perms: UserPermissions): NavSection[] {
  const allSections: NavSection[] = [
    mainNavigation,
    modulesNavigation,
    creationNavigation,
    travelNavigation,
    accountNavigation,
    supportNavigation,
  ];

  // Filtrer les éléments selon les permissions
  const filteredSections = allSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => hasPermission(item.id, perms)),
    }))
    .filter((section) => section.items.length > 0);

  // Ajouter la section Admin si nécessaire
  if (perms.isAdmin) {
    filteredSections.push(adminNavigation);
  }

  return filteredSections;
}
