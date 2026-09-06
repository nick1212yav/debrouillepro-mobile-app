// src/features/community/register.ts
import { ModuleRegistry } from "@/core/sdk/registry";
import { communityManifest } from "./manifest";
import { registerCommunityModule as registerIntegration } from "./integrations/CommunityRegistry";

export function registerCommunityModule() {
  // Register the module manifest
  ModuleRegistry.register(communityManifest);

  // Register integrations (UI components, forms, etc.)
  registerIntegration();

  console.log("[Community] Module registered successfully");
}
