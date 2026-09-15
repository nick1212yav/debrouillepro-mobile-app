import { View, Text, Pressable } from "react-native";

// src/features/network/components/Profile/ProfileServices.tsx
import { Wrench, Plus, Edit3, Trash2, Tag, Clock, MapPin } from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Service {
  _id: string;
  title: string;
  description?: string;
  price?: string;
  category: string;
  location?: string;
  deliveryTime?: string;
}

interface ProfileServicesProps {
  services?: Service[];
  editable?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
  className?: string;
}

function ServiceItem({
  service,
  editable,
  onEdit,
  onDelete,
}: {
  service: Service;
  editable: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <View initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="p-3 rounded-xl bg-white/5 border border-white/5 transition-colors">
      <View className="flex items-start justify-between gap-2"><View className="min-w-0 flex-1"><Text className="text-white font-semibold text-sm truncate">{service.title}</Text><View className="flex items-center gap-2 flex-wrap mt-1 text-xs text-white/40"><Text className="flex items-center gap-1"><Tag size={11} />{service.category}</Text>{service.location && (
              <Text className="flex items-center gap-1"><MapPin size={11} />{service.location}</Text>
            )}{service.deliveryTime && (
              <Text className="flex items-center gap-1"><Clock size={11} />{service.deliveryTime}</Text>
            )}{service.price && (
              <Text className="text-emerald-400 font-medium">{service.price}</Text>
            )}</View>{service.description && (
            <Text className="text-white/50 text-xs mt-1 leading-relaxed">{service.description}</Text>
          )}</View>{editable && (
          <View className="flex items-center gap-1 flex-shrink-0"><Pressable onPress={() => onEdit?.(service._id)} className="p-1.5 rounded-lg transition-colors"><Edit3 size={13} className="text-white/40" /></Pressable><Pressable onPress={() => onDelete?.(service._id)} className="p-1.5 rounded-lg transition-colors"><Trash2 size={13} className="text-red-400/60" /></Pressable></View>
        )}</View>
    </View>
  );
}

export function ProfileServices({
  services = [],
  editable = false,
  onAdd,
  onEdit,
  onDelete,
  isLoading = false,
  className,
}: ProfileServicesProps) {
  if (isLoading) {
    return (
      <View className={cn("space-y-3", className)}><View className="flex items-center justify-between"><View className="flex items-center gap-2"><Skeleton className="w-8 h-8 rounded-xl" /><Skeleton className="h-4 w-24 rounded-lg" /></View><Skeleton className="h-8 w-20 rounded-xl" /></View><Skeleton className="h-16 w-full rounded-xl" /><Skeleton className="h-16 w-full rounded-xl" /></View>
    );
  }

  const hasServices = services.length > 0;

  return (
    <View initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn(
        "rounded-3xl p-5",
        "bg-white/5 border border-white/10",
        className,
      )}>
      <View className="flex items-center justify-between mb-4"><View className="flex items-center gap-2"><View className="w-8 h-8 rounded-xl flex items-center justify-center bg-orange-500/10 text-orange-400"><Wrench size={15} /></View><Text className="text-white font-bold text-sm">Services proposés</Text><Text className="text-white/30 text-xs">({services.length})</Text></View>{editable && (
          <Pressable onPress={onAdd} className="flex items-center gap-1 text-xs text-orange-400 transition-colors">
            <Plus size={12} />
            Ajouter
          </Pressable>
        )}</View>

      {hasServices ? (
        <View className="space-y-2">
          {services.map((service) => (
            <ServiceItem
              key={service._id}
              service={service}
              editable={editable}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </View>
      ) : (
        <Text className="text-white/30 text-sm italic">
          {editable
            ? "Ajoutez vos services professionnels"
            : "Aucun service proposé"}
        </Text>
      )}
    </View>
  );
}
