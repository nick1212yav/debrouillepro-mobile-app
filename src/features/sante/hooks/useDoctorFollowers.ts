// src/features/sante/hooks/useDoctorFollowers.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useDoctorFollowers(
  doctorId: Id<"medicalProfessionals"> | null,
) {
  const followers = useQuery(
    api.health.getFollowers,
    doctorId ? { professionalId: doctorId } : "skip",
  );
  const mutate = useMutation(api.health.toggleFollow);
  const toggleFollow = async () => {
    if (!doctorId) return { followed: false };
    const result = await mutate({ professionalId: doctorId });
    return result;
  };
  return { followers, toggleFollow, isLoading: followers === undefined };
}
