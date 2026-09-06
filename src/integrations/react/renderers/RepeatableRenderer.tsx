import { View, Text, Pressable } from "react-native";
import React from "react";
import type { FieldRendererProps } from "../components/FieldRenderer";
import { FieldRenderer } from "../components/FieldRenderer";
import { Plus, X } from "lucide-react-native";

export function RepeatableRenderer({
  field,
  value,
  onChange,
  error,
  disabled,
}: FieldRendererProps) {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    const newItem: any = {};
    field.itemFields?.forEach((subField) => {
      newItem[subField.key] = subField.defaultValue || "";
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, subFieldKey: string, subValue: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [subFieldKey]: subValue };
    onChange(newItems);
  };

  return (
    <View className="space-y-3">
      {items.map((item, index) => (
        <View
          key={index}
          className="relative bg-white/5 border border-white/10 rounded-lg p-4"
        >
          <Pressable
           
            onPress={() => removeItem(index)}
            className="absolute top-2 right-2 text-white/40"
            disabled={disabled}
          >
            <X size={16} />
          </Pressable>
          <View className="space-y-3 pr-6">
            {field.itemFields?.map((subField) => (
              <View key={subField.key}>
                <Text className="block text-sm font-medium text-white/60 mb-1">
                  {subField.label}
                  {subField.required && (
                    <Text className="text-red-400 ml-1">*</Text>
                  )}
                </Text>
                <FieldRenderer
                  field={subField}
                  value={item[subField.key]}
                  onChange={(val) => updateItem(index, subField.key, val)}
                  disabled={disabled}
                />
              </View>
            ))}
          </View>
        </View>
      ))}

      <Pressable
        onPress={addItem}
        disabled={disabled}
        className="w-full py-2 border border-dashed border-white/20 rounded-lg text-white/50 flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        <Text>Ajouter</Text></Pressable>
    </View>
  );
}
