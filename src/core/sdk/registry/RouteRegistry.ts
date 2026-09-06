type RouteConfig = {
  detail: string;
  list?: string;
  create?: string;
  edit?: string;
};

const routes = new Map<string, RouteConfig>();

export const RouteRegistry = {
  register: (moduleId: string, config: RouteConfig) => {
    routes.set(moduleId, config);
  },
  get: (moduleId: string): RouteConfig | undefined => routes.get(moduleId),
  getDetail: (moduleId: string, id: string) => {
    const route = routes.get(moduleId);
    if (!route) return null;
    return route.detail.replace(":id", id);
  },
};
