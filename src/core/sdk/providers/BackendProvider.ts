import { useMutation, useQuery } from "convex/react";
import {
  resolveQueryReference,
  resolveMutationReference,
} from "../resolvers/QueryResolver";

export class BackendProvider {
  static useQuery(path: string, args: any) {
    const ref = resolveQueryReference(path);
    if (!ref) return null;
    return useQuery(ref, args);
  }

  static useMutation(path: string) {
    const ref = resolveMutationReference(path);
    if (!ref) return null;
    return useMutation(ref);
  }
}
