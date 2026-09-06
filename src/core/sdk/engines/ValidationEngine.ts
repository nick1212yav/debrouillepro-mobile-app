import type { FieldConfig } from "../types";
import { buildSchemaFromFields } from "./SchemaEngine";

export function validateData(fields: FieldConfig[], data: any) {
  const schema = buildSchemaFromFields(fields);
  try {
    schema.parse(data);
    return { valid: true, errors: [] };
  } catch (err: any) {
    const errors = err.errors.map((e: any) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return { valid: false, errors };
  }
}
