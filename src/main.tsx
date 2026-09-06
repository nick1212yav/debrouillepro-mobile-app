import { createRoot } from "react-dom/client";
import App from "./App";

import { Boot } from "@/core/sdk/runtime/Boot";
import { jobManifest } from "@/features/job/manifest";
import { registerJob } from "@/features/job/register";
import { immoManifest } from "@/features/immo/manifest";
import { registerImmo } from "@/features/immo/register";

import { ActionRegistry } from "@/core/sdk/registry/ActionRegistry";
import { UIRegistry } from "@/core/sdk/registry/UIRegistry";

async function bootstrap() {
  // Enregistrer les modules
  registerJob();
  registerImmo();

  console.log(
    "🔍 [main] ActionRegistry.get('job.apply') =",
    ActionRegistry.get("job.apply"),
  );
  console.log(
    "🔍 [main] ActionRegistry.get('immo.contact') =",
    ActionRegistry.get("immo.contact"),
  );
  console.log(
    "🔍 [main] UIRegistry.get('job.apply') =",
    UIRegistry.get("job.apply"),
  );
  console.log(
    "🔍 [main] UIRegistry.get('immo.contact') =",
    UIRegistry.get("immo.contact"),
  );

  await Boot.start({
    modules: [jobManifest, immoManifest],
  });

  createRoot(undefined("root")!).render(<App />);
}

bootstrap();
