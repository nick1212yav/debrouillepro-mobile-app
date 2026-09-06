import { z } from "zod";
import type { FieldConfig } from "../types";

export function buildSchemaFromFields(fields: FieldConfig[]): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    if (field.hidden) continue;

    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "text":
      case "textarea":
      case "email":
      case "phone":
      case "url":
      case "country":
      case "province":
      case "city":
      case "address":
      case "language": {
        if (field.required) {
          schema = z.string().min(1, `${field.label} est requis`);
        } else {
          schema = z.string().optional();
        }
        break;
      }

      case "number":
      case "currency":
      case "price": {
        if (field.required) {
          schema = z.number().min(0);
        } else {
          schema = z.number().optional();
        }
        break;
      }

      case "boolean":
        schema = z.boolean().default(false);
        break;

      case "date":
      case "datetime":
        schema = z.number().optional();
        break;

      case "tags":
      case "skills":
      case "chips": {
        if (field.required) {
          schema = z.array(z.string()).min(1).default([]);
        } else {
          schema = z.array(z.string()).default([]);
        }
        break;
      }

      case "select":
      case "multiselect": {
        if (field.required) {
          schema = z.string().min(1);
        } else {
          schema = z.string().optional();
        }
        break;
      }

      case "repeatable": {
        if (field.required) {
          schema = z.array(z.any()).min(1).default([]);
        } else {
          schema = z.array(z.any()).default([]);
        }
        break;
      }

      default:
        schema = z.any().optional();
        break;
    }

    if (field.validator) {
      schema = field.validator;
    }

    shape[field.key] = schema;
  }

  return z.object(shape);
}
