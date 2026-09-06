import type { ComponentType } from "react";
import type { FieldType } from "../types";

const renderers = new Map<FieldType, ComponentType<any>>();

export const RendererRegistry = {
  register: (type: FieldType, component: ComponentType<any>) => {
    renderers.set(type, component);
  },
  get: (type: FieldType): ComponentType<any> | undefined => renderers.get(type),
  getAll: () => Object.fromEntries(renderers),
};
