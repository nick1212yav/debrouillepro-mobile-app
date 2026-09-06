// src/features/network/components/Company/index.ts
export { CompanyCard } from "./CompanyCard";
export { CompanyEmployees } from "./CompanyEmployees";
export { CompanyHeader } from "./CompanyHeader";
export { CompanyJobs } from "./CompanyJobs";
export { CompanyServices } from "./CompanyServices";

// Transtypages génériques pour satisfaire la compilation sans conflit d'exports locaux
export type Employee = any;
export type Job = any;
export type Service = any;
