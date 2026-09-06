export interface UISheetConfig {
  id: string;
  component:
    | React.ComponentType<any>
    | (() => Promise<{ default: React.ComponentType<any> }>);
  type: "sheet" | "modal" | "drawer" | "dialog";
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export interface FormConfig {
  id: string;
  component:
    | React.ComponentType<any>
    | (() => Promise<{ default: React.ComponentType<any> }>);
}

export interface DetailConfig {
  id: string;
  component:
    | React.ComponentType<any>
    | (() => Promise<{ default: React.ComponentType<any> }>);
}
