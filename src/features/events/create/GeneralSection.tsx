import { View, Text, Pressable, TextInput } from "react-native";
import {
  Calendar,
  FileText,
  MapPin,
  Tag,
  Users,
  LocateFixed,
  Loader2,
} from "lucide-react-native";
import { CATEGORY_LABELS } from "@/features/events/types";
import { FieldInput, FieldTextarea, CategoryPills, TagsInput } from "./shared";
import AIWriteAssist from "@/components/AIWriteAssist";
import type { EventFormData } from "@/features/events/types";

interface Props {
  form: EventFormData;
  update: (key: keyof EventFormData, value: any) => void;
  color: string;
  detectingLocation: boolean;
  onDetectLocation: () => void;
}

export function GeneralSection({
  form,
  update,
  color,
  detectingLocation,
  onDetectLocation,
}: Props) {
  return (
    <View className="pt-2">
      <CategoryPills
        cats={Object.entries(CATEGORY_LABELS) as [string, string][]}
        active={form.category}
        color={color}
        onChange={(c) => update("category", c)}
      />

      <FieldInput
        icon={Tag}
        color={color}
        placeholder="Nom de l'événement"
        value={form.title}
        onChange={(v) => update("title", v)}
        required
      />

      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder="Description"
        value={form.description}
        onChange={(v) => update("description", v)}
        rows={3}
        required
      />

      <AIWriteAssist
        contentType="event_description"
        topic={form.title}
        onGenerated={(text) => update("description", text)}
        description={form.description}
        onTagsSuggested={(tags) => {
          const newTags = tags.filter((t) => !form.tags.includes(t));
          if (newTags.length > 0) {
            update("tags", [...form.tags, ...newTags]);
          }
        }}
        category={form.category}
        color={color}
      />

      <View className="gap-2">
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color }} />
            <TextInput
             
              value={form.startDate}
              onChangeText={(text) => update("startDate", text)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
          </View>
        </View>
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <Calendar size={14} style={{ color, opacity: 0.5 }} />
            <TextInput
             
              value={form.endDate}
              onChangeText={(text) => update("endDate", text)}
              placeholder="Fin"
              className="flex-1 bg-transparent text-white text-sm outline-none"
            />
          </View>
        </View>
      </View>

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <MapPin size={14} style={{ color }} />
          <TextInput
            value={form.location}
            onChangeText={(text) => update("location", text)}
            placeholder="Lieu *"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
          />
          <Pressable
           
            onPress={onDetectLocation}
            disabled={detectingLocation}
            className="flex-shrink-0 disabled:opacity-40"
           
          >
            {detectingLocation ? (
              <Loader2 size={14} className="animate-spin" style={{ color }} />
            ) : (
              <LocateFixed size={14} style={{ color }} />
            )}
          </Pressable>
        </View>
      </View>

      <FieldInput
        icon={MapPin}
        color={color}
        placeholder="Adresse complète (optionnel)"
        value={form.address || ""}
        onChange={(v) => update("address", v)}
      />

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center justify-between mb-2">
          <View className="flex items-center gap-2.5">
            <Tag size={14} style={{ color }} />
            <Text className="text-xs text-white/40">Gratuit ?</Text>
          </View>
          <Pressable
            onPress={() => update("isFree", !form.isFree)}
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={
              form.isFree
                ? { backgroundColor: "rgba(16,185,129,0.2)", borderWidth: 1, borderColor: "rgba(16,185,129,0.3)", borderStyle: "solid" }
                : { backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }
            }
          >
            {form.isFree ? "Oui" : "Non"}
          </Pressable>
        </View>
        {!form.isFree && (
          <TextInput
            value={form.price}
            onChangeText={(text) => update("price", text)}
            placeholder="Ex: 15 000 FCFA"
            className="w-full bg-transparent text-white text-sm outline-none placeholder:text-white/25 mt-1"
          />
        )}
      </View>

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <Users size={14} style={{ color }} />
          <TextInput
           
            value={form.maxAttendees || ""}
            onChangeText={(text) =>
              update(
                "maxAttendees",
                text ? parseInt(text) : undefined,
              )
            }
            placeholder="Places disponibles (optionnel)"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
           keyboardType="numeric"/>
        </View>
      </View>

      <TagsInput
        value={form.tags}
        onChange={(tags) => update("tags", tags)}
        placeholder="Tags (ex: Musique, Festival, Gratuit...)"
        color={color}
      />
    </View>
  );
}
