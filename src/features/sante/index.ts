// src/features/sante/index.ts

// ── Exports des couches principales ──
export * from "./components";
export * from "./forms"; // ✅ exporte maintenant tous les FormValues
export * from "./constants";

// ── Hooks (export explicite) ──
export {
  useDoctor,
  useDoctors,
  useDoctorAvailability,
  useDoctorBooking,
  useDoctorFollowers,
  useDoctorReviews,
  useDoctorQuestions,
  useDoctorArticles,
  useDoctorVideos,
  useDoctorStories,
  useAppointments,
  useEmergency,
  useHospital,
  useHospitals,
  usePharmacy,
  usePharmacies,
  useLab,
  useLabs,
  useMedicalRecords,
  usePrescriptions,
  useHealthAI,
  useProcessPayment,
} from "./hooks";

// ── Services ──
export {
  useBookAppointment,
  useCancelAppointment,
  useAvailability,
  useShareEmergencyLocation,
  useEmergencyCenters,
  getEmergencyNumbers,
  useStartTeleconsultation,
  useCompleteTeleconsultation,
} from "./services";

// ── Types ──
export type {
  Doctor,
  DoctorFilters,
  DoctorSpecialty,
  DoctorStatus,
  DoctorAvailability,
  Hospital,
  HospitalFilters,
  HospitalType,
  HospitalService,
  Pharmacy,
  PharmacyFilters,
  PharmacyService,
  PharmacyProduct,
  Laboratory,
  Clinic,
  Appointment,
  AppointmentFilters,
  AppointmentStats,
  AppointmentType,
  AppointmentStatus,
  Prescription,
  PrescriptionStatus,
  MedicalRecord,
  MedicalRecordType,
  Review,
  ReviewStats,
  Question,
  Vaccination,
  EmergencyType,
  EmergencySeverity,
  EmergencyContact,
  EmergencyCenter,
  EmergencyNumber,
  EmergencyAdvice,
  Payment,
  PaymentMethod,
  PaymentStatus,
  DoctorStatistics,
  RevenueStats,
  HealthAnalytics,
} from "./types";

// ── Formulaires (types) ──
export type {
  DoctorFormValues,
  AppointmentFormValues,
  AmbulanceFormValues,
  ClinicFormValues,
  HospitalFormValues,
  LaboratoryFormValues,
  PharmacyFormValues,
  PrescriptionFormValues,
  VaccinationFormValues,
} from "./forms";

// ── Validators ──
export {
  doctorSchema,
  appointmentSchema,
  appointmentStatusSchema,
  appointmentStatsSchema,
  pharmacySchema,
  ambulanceSchema,
  clinicSchema,
  hospitalSchema,
  laboratorySchema,
  prescriptionSchema,
  vaccinationSchema,
} from "./validators";

// ── Module config ──
export { SANTE_MODULE_MANIFEST } from "./manifest";
export { SANTE_LIFECYCLE } from "./lifecycle";
export { SANTE_PERMISSIONS } from "./permissions";
export { SANTE_ACTIONS } from "./actions";
export { SANTE_FIELDS } from "./fields";
export { SANTE_SEARCH_CONFIG } from "./search";
export { SANTE_SUBTYPES } from "./subtypes";
export { SANTE_ADAPTER } from "./adapter";
export { SANTE_METRICS } from "./metrics";
export { registerSanteModule } from "./register";
