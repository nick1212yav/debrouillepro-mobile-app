import { usePaginatedQuery } from "convex/react";
import { resolveQueryReference } from "../../../core/sdk/resolvers/QueryResolver";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";

export function useModulePaginatedQuery(
  moduleId: string,
  queryName: string,
  args: any,
  options?: { initialNumItems?: number },
) {
  const manifest = ModuleRegistry.get(moduleId);
  const path = manifest?.queries?.[queryName];
  if (!path) {
    console.warn(`Query ${queryName} not found in module ${moduleId}`);
    return { results: [], status: "LoadingFirstPage", loadMore: () => {} };
  }
  const ref = resolveQueryReference(path);
  if (!ref) {
    console.warn(`Cannot resolve query reference for ${path}`);
    return { results: [], status: "LoadingFirstPage", loadMore: () => {} };
  }
  // ✅ Corrigé : s'assurer que initialNumItems est un nombre
  const opts = options || {};
  const initialNumItems = opts.initialNumItems ?? 10;
  return usePaginatedQuery(ref, args, { initialNumItems });
}
