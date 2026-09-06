import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Users, Plus, Trash } from "lucide-react-native";

interface SplitMember {
  id: string;
  name: string;
  sharePercent: number;
}

interface SplitPaymentProps {
  totalAmount: number;
  onSplitConfirmed: (
    splits: Array<{ name: string; sharePercent: number; amount: number }>,
  ) => void;
}

export function SplitPayment({
  totalAmount,
  onSplitConfirmed,
}: SplitPaymentProps) {
  const [members, setMembers] = useState<SplitMember[]>([
    { id: "1", name: "Client Principal (Vous)", sharePercent: 100 },
  ]);
  const [newName, setNewName] = useState("");

  const handleAddMember = () => {
    if (!newName.trim()) return;
    const nextMembersCount = members.length + 1;
    const equalShare = Number((100 / nextMembersCount).toFixed(1));

    const nextMembers = [
      ...members.map((m) => ({ ...m, sharePercent: equalShare })),
    ];
    nextMembers.push({
      id: Date.now().toString(),
      name: newName.trim(),
      sharePercent: equalShare,
    });

    setMembers(nextMembers);
    setNewName("");
  };

  const handleRemoveMember = (id: string) => {
    const filtered = members.filter((m) => m.id !== id);
    if (filtered.length === 0) return;
    const equalShare = Number((100 / filtered.length).toFixed(1));
    setMembers(filtered.map((m) => ({ ...m, sharePercent: equalShare })));
  };

  const handleTriggerConfirm = () => {
    const calculated = members.map((m) => ({
      name: m.name,
      sharePercent: m.sharePercent,
      amount: Math.round((totalAmount * m.sharePercent) / 100),
    }));
    onSplitConfirmed(calculated);
  };

  return (
    <View className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-left space-y-4">
      <View className="flex items-center gap-2 mb-1 px-1">
        <Users size={16} className="text-orange-400" />
        <Text className="text-xs font-bold uppercase tracking-wider text-white">
          Partage de l'addition ({members.length})
        </Text>
      </View>

      <View className="flex gap-2">
        <TextInput
         
          placeholder="Nom du convive..."
          value={newName}
          onChangeText={(text) => setNewName(text)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
        />
        <Pressable
          onPress={handleAddMember}
          className="p-2.5 rounded-xl bg-orange-500 text-white shrink-0"
        >
          <Plus size={14} />
        </Pressable>
      </View>

      <View className="space-y-2">
        {members.map((member) => {
          const personalAmount = Math.round(
            (totalAmount * member.sharePercent) / 100,
          );
          return (
            <View
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs"
            >
              <View className="min-w-0 pr-2">
                <Text className="block font-bold text-white truncate">
                  {member.name}
                </Text>
                <Text className="text-[10px] text-white/40 block mt-0.5">
                  Part : {member.sharePercent}%
                </Text>
              </View>

              <View className="flex items-center gap-3 shrink-0">
                <Text className="font-extrabold text-orange-400">
                  {personalAmount.toLocaleString()} <Text>FCFA</Text></Text>
                {member.id !== "1" && (
                  <Pressable
                    onPress={() => handleRemoveMember(member.id)}
                    className="text-white/30"
                  >
                    <Trash size={12} />
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <Pressable
        onPress={handleTriggerConfirm}
        className="w-full py-4 rounded-xl bg-orange-500 text-[#020617] font-black text-xs uppercase tracking-wider shadow-md shadow-orange-500/10"
      >
        <Text>Valider et Générer les Reçus de Groupe</Text></Pressable>
    </View>
  );
}
