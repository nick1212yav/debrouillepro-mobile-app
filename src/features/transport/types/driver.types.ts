// src/features/transport/types/driver.types.ts
import type { Id } from "@/convex/_generated/dataModel";

export interface DriverLicenseMeta {
  licenseNumber: string;
  licenseType: "A" | "B" | "C" | "D" | "E";
  issuerCountry: string;
  expirationDate: string;
}

export interface DriverVerificationRecord {
  driverId: Id<"medicalProfessionals"> | string; // ID unifié
  isIdentityVerified: boolean;
  isBackgroundChecked: boolean;
  isVehicleInsured: boolean;
  lastCheckedDate: string;
  license: DriverLicenseMeta;
}
