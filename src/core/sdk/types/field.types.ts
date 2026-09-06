import { z } from "zod";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "price"
  | "phone"
  | "email"
  | "url"
  | "location"
  | "map"
  | "images"
  | "video"
  | "audio"
  | "file"
  | "pdf"
  | "tags"
  | "chips"
  | "rating"
  | "color"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "duration"
  | "skills"
  | "user"
  | "company"
  | "category"
  | "country"
  | "province"
  | "city"
  | "address"
  | "gps"
  | "social"
  | "select"
  | "multiselect"
  | "group"
  | "repeatable"
  | "money"
  | "iban"
  | "mobileMoney"
  | "wallet"
  | "schedule"
  | "openingHours"
  | "workingHours"
  | "gallery"
  | "document"
  | "identityCard"
  | "passport"
  | "license"
  | "vehicle"
  | "plate"
  | "qr"
  | "barcode"
  | "socialLinks"
  | "languages"
  | "availability"
  | "calendar"
  | "appointment"
  | "serviceList"
  | "packageList"
  | "variants"
  | "inventory"
  | "stock"
  | "priceRange"
  | "language"; // ✅ Ajouté

export interface FieldConfig {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  validator?: z.ZodTypeAny;
  placeholder?: string;
  description?: string;
  defaultValue?: any;
  options?: { label: string; value: string }[];
  group?: string;
  order?: number;
  visibleIf?: (values: any) => boolean;
  repeatable?: boolean;
  minItems?: number;
  maxItems?: number;
  itemFields?: FieldConfig[];
  hidden?: boolean;
  readonly?: boolean;
  disabled?: boolean;
}
