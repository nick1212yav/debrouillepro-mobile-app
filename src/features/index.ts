import { ModuleRegistry } from "../core/sdk/registry/ModuleRegistry";
import { RouteRegistry } from "../core/sdk/registry/RouteRegistry";
import { jobManifest } from "./job/manifest";

// Enregistrer les modules
ModuleRegistry.register(jobManifest);

// Enregistrer les routes
RouteRegistry.register("job", {
  detail: "/job/:id",
  list: "/jobs",
});

console.log("✅ Modules enregistrés");
