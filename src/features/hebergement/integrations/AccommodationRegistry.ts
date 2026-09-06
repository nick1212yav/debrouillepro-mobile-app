export class AccommodationRegistry {
  private static renderers = new Map<string, any>();

  static registerRenderer(type: string, component: any) {
    this.renderers.set(type, component);
  }

  static getRenderer(type: string) {
    return this.renderers.get(type);
  }
}
