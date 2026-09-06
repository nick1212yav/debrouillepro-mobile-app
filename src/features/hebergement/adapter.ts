import { AccommodationBridge } from "./integrations/AccommodationBridge";

export const adapter = {
  adapt: (rawItem: any) => {
    return AccommodationBridge.formatAccommodation(rawItem);
  },

  adaptList: (rawItems: any[]): any[] => {
    if (!rawItems || !Array.isArray(rawItems)) return [];
    return rawItems.map((item) =>
      AccommodationBridge.formatAccommodation(item),
    );
  },
};
