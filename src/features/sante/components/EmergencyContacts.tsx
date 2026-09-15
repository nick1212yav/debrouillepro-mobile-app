import { View, Text, Pressable, Linking } from "react-native";

// src/features/sante/components/EmergencyContacts.tsx
import { Phone, User, Edit2, Trash2, Plus } from "lucide-react-native";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  isPrimary: boolean;
}

interface EmergencyContactsProps {
  contacts: EmergencyContact[];
  onAdd: () => void;
  onEdit: (contact: EmergencyContact) => void;
  onDelete: (id: string) => void;
}

export function EmergencyContacts({
  contacts,
  onAdd,
  onEdit,
  onDelete,
}: EmergencyContactsProps) {
  if (contacts.length === 0) {
    return (
      <View className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center"><User size={32} className="mx-auto text-white/20 mb-2" /><Text className="text-white/40 text-sm">Aucun contact d'urgence</Text><Pressable onPress={onAdd} className="mt-3 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium transition-colors"><Plus size={14} className="inline mr-1" /><Text>Ajouter un contact</Text></Pressable></View>
    );
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><View className="flex items-center justify-between mb-3"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2"><User size={14} />Contacts d'urgence
        </Text><Pressable onPress={onAdd} className="text-xs text-red-400 transition-colors"><Plus size={14} className="inline mr-0.5" /><Text>Ajouter</Text></Pressable></View><View className="space-y-2">{contacts.map((contact) => (
          <View key={contact.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/10"><View className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"><User size={14} className="text-red-400" /></View><View className="flex-1 min-w-0"><Text className="text-white text-sm font-medium">{contact.name}{contact.isPrimary && (
                  <Text className="ml-1.5 text-[10px] text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded-full">Principal
                  </Text>
                )}</Text><Text className="text-white/40 text-xs flex items-center gap-1"><Phone size={10} />{contact.phone}· {contact.relation}</Text></View><View className="flex gap-1 flex-shrink-0"><Pressable onPress={() => (Linking.openURL(`tel:${contact.phone}`))} className="p-1.5 rounded-lg bg-green-500/20 text-green-400 transition-colors"><Phone size={14} /></Pressable><Pressable onPress={() => onEdit(contact)} className="p-1.5 rounded-lg bg-white/10 text-white/40 transition-colors"><Edit2 size={14} /></Pressable><Pressable onPress={() => onDelete(contact.id)} className="p-1.5 rounded-lg bg-white/10 text-white/40 transition-colors"><Trash2 size={14} /></Pressable></View></View>
        ))}</View></View>
  );
}
