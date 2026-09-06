import { ModuleRegistry } from "../registry/ModuleRegistry";

export const DependencyResolver = {
  checkAll: (): string[] => {
    const issues: string[] = [];
    const modules = ModuleRegistry.getAll();
    for (const m of modules) {
      const deps = m.dependencies?.required || [];
      for (const dep of deps) {
        if (!ModuleRegistry.has(dep)) {
          issues.push(`Module ${m.info.id} requires ${dep} but it's missing`);
        }
      }
    }
    return issues;
  },
};
