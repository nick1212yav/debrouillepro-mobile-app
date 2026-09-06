import { RendererRegistry } from "../../../core/sdk/registry/RendererRegistry";
import * as renderers from "./index";

// Enregistrer tous les renderers
export function registerAllRenderers() {
  const mappings: Record<string, keyof typeof renderers> = {
    text: "TextRenderer",
    textarea: "TextareaRenderer",
    number: "NumberRenderer",
    select: "SelectRenderer",
    tags: "TagsRenderer",
    date: "DateRenderer",
    boolean: "BooleanRenderer",
    group: "GroupRenderer",
    repeatable: "RepeatableRenderer",
    // Ajouter ici tous les autres types
  };

  Object.entries(mappings).forEach(([type, rendererName]) => {
    const component = renderers[rendererName];
    if (component) {
      RendererRegistry.register(type as any, component);
    } else {
      console.warn(`Renderer ${rendererName} not found for type ${type}`);
    }
  });
}
