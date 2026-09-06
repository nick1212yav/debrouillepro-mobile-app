import { api } from "@/convex/_generated/api";

export function resolveQueryReference(path: string): any {
  const parts = path.split(".");
  let current: any = api;
  for (const part of parts) {
    if (!current[part]) {
      console.warn(`Query ${path} not found in Convex API`);
      return null;
    }
    current = current[part];
  }
  return current;
}

export function resolveMutationReference(path: string): any {
  const parts = path.split(".");
  let current: any = api;
  for (const part of parts) {
    if (!current[part]) {
      console.warn(`Mutation ${path} not found in Convex API`);
      return null;
    }
    current = current[part];
  }
  return current;
}
