import type { Publication } from "@/features/publications/types";

export interface ActionContext {
  publication: Publication;
  user: any;
  services: any;
  navigate: (path: string) => void;
  ui: {
    openSheet: (id: string, props: any) => void;
    openModal: (id: string, props: any) => void;
    openDrawer: (id: string, props: any) => void;
    openPlayer: (props: any) => void;
    openViewer: (props: any) => void;
    openToast: (
      message: string,
      type?: "success" | "error" | "info" | "warning",
    ) => void;
  };
}

export interface ActionConfig {
  id: string;
  label: string;
  icon?: string;
  execute: (context: ActionContext) => void | Promise<void>;
  visible?: (context: ActionContext) => boolean;
  enabled?: (context: ActionContext) => boolean;
  variant?: "default" | "outline" | "ghost" | "destructive";
  order?: number;
}
