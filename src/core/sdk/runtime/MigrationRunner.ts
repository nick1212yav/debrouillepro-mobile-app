import { ModuleRegistry } from "../registry/ModuleRegistry";

export const MigrationRunner = {
  runAll: async () => {
    const modules = ModuleRegistry.getAll();
    for (const m of modules) {
      if (m.migration) {
        console.log(`Migrating ${m.info.id} from ${m.migration.from}`);
      }
    }
  },
};
