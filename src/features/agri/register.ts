// src/features/agri/register.ts
import { AgriRegistry } from "./integrations/AgriRegistry";
import { AgriLifecycle } from "./lifecycle";

export function registerAgriFeature() {
  AgriLifecycle.onMount();
  AgriRegistry.registerModule();
}
