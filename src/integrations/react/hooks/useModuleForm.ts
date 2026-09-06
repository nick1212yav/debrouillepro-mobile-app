import { useState, useCallback } from "react";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";
import { BackendProvider } from "../../../core/sdk/providers/BackendProvider";
import { validateData } from "../../../core/sdk/engines/ValidationEngine";
import { EventBus } from "../../../core/sdk/events/EventBus";

export function useModuleForm(moduleId: string, user: any) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const manifest = ModuleRegistry.get(moduleId);
  const adapter = manifest?.adapter;
  const lifecycle = manifest?.lifecycle;

  const mutationPath = manifest?.mutations?.create;
  const createMutation = mutationPath
    ? BackendProvider.useMutation(mutationPath)
    : null;

  const handleSubmit = useCallback(
    async (data: any) => {
      if (!user) {
        setError("Vous devez être connecté");
        return;
      }

      if (!createMutation) {
        setError(`Le module ${moduleId} ne supporte pas la création`);
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const validation = validateData(manifest?.fields || [], data);
        if (!validation.valid) {
          setError(
            validation.errors
              .map((e: { message: string }) => e.message)
              .join(", "),
          );
          return;
        }

        let normalized = data;
        if (adapter?.normalize) {
          normalized = await adapter.normalize(data);
        }

        let processed = normalized;
        if (lifecycle?.beforeCreate) {
          processed = await lifecycle.beforeCreate(normalized);
        }

        const args = adapter ? adapter.toModel(processed) : processed;
        const result = await createMutation(args);

        if (lifecycle?.afterCreate) {
          await lifecycle.afterCreate(result);
        }

        await EventBus.publish({
          type: `${moduleId}.created`,
          moduleId,
          payload: result,
          timestamp: Date.now(),
        });

        return result;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, manifest, adapter, lifecycle, moduleId, createMutation],
  );

  return { isSubmitting, error, handleSubmit };
}
