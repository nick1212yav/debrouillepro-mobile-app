// src/features/marketplace/types/shipping.types.ts
export interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  estimatedDays: number;
  available: boolean;
}

export interface DeliveryAddress {
  street: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone?: string;
}

export interface TrackingInfo {
  carrier: string;
  trackingNumber: string;
  status: string;
  estimatedDelivery?: string;
  updates: { date: string; status: string; location?: string }[];
}
