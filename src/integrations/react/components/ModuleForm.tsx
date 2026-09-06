import { Pressable, Text, View } from "react-native";
import React from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";
import { buildSchemaFromFields } from "../../../core/sdk/engines/SchemaEngine";
import { FieldRenderer } from "./FieldRenderer";
import type { FieldConfig } from "../../../core/sdk/types";

interface Props {
  moduleId: string;
  subtype?: string;
  onSubmit: (data: any) => void;
  defaultValues?: any;
  isSubmitting?: boolean;
}

export function ModuleForm({
  moduleId,
  subtype,
  onSubmit,
  defaultValues,
  isSubmitting,
}: Props) {
  const manifest = ModuleRegistry.get(moduleId);
  if (!manifest) {
    return <View className="text-red-400">Module "{moduleId}" introuvable</View>;
  }

  const fields =
    subtype && manifest.subtypes.find((s) => s.value === subtype)?.fields
      ? manifest.subtypes.find((s) => s.value === subtype)!.fields!
      : manifest.fields;

  const schema = buildSchemaFromFields(fields);
  const methods = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || manifest.defaults || {},
    mode: "onChange",
  });

  const groups = fields.reduce(
    (acc: Record<string, FieldConfig[]>, field: FieldConfig) => {
      const group = field.group || "Général";
      if (!acc[group]) acc[group] = [];
      acc[group].push(field);
      return acc;
    },
    {},
  );

  return (
    <FormProvider {...methods}>
      <View className="space-y-6">
        {Object.entries(groups).map(([groupName, groupFields]) => (
          <View key={groupName} className="space-y-4">
            <Text className="text-sm font-semibold text-white/60 uppercase tracking-wider">
              {groupName}
            </Text>
            {groupFields.map((field: FieldConfig) => {
              const values = methods.watch();
              if (field.visibleIf && !field.visibleIf(values)) return null;
              return (
                <View key={field.key}>
                  <Text className="block text-sm font-medium text-white/70 mb-1">
                    {field.label}
                    {field.required && (
                      <Text className="text-red-400 ml-1">*</Text>
                    )}
                  </Text>
                  <FieldRenderer
                    field={field}
                    value={methods.watch(field.key)}
                    onChange={(val) => methods.setValue(field.key, val)}
                    error={
                      methods.formState.errors[field.key]?.message as string
                    }
                    disabled={isSubmitting}
                  />
                  {field.description && (
                    <Text className="text-xs text-white/40 mt-1">
                      {field.description}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <Pressable
          type="submit"
          disabled={isSubmitting || !methods.formState.isValid}
          className="w-full bg-purple-600 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Publication..." : "Publier"}
        </Pressable>
      </View>
    </FormProvider>
  );
}
