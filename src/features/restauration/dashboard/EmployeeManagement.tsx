import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { Users, Plus, Trash, ShieldCheck } from "lucide-react-native";

interface Employee {
  id: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface EmployeeManagementProps {
  employees: Employee[];
  onToggleStatus: (id: string) => void;
  onAddEmployee: (name: string, role: string) => void;
  onRemoveEmployee: (id: string) => void;
}

export function EmployeeManagement({
  employees,
  onToggleStatus,
  onAddEmployee,
  onRemoveEmployee,
}: EmployeeManagementProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("Serveur");

  const handleAddSubmit = (e: unknown) => {
    if (!name.trim()) return;
    onAddEmployee(name.trim(), role);
    setName("");
  };

  return (
    <View className="space-y-6 text-left">
      {/* Formulaire d'ajout rapide */}
      <View
       
        className="p-4 rounded-2xl bg-white/[0.01] border border-white/[0.04] space-y-3"
      >
        <Text className="block text-[10px] text-white/40 uppercase font-black tracking-wider">
          Ajouter un Collaborateur
        </Text>
        <View className="gap-3">
          <TextInput
           
            placeholder="Nom complet..."
            value={name}
            onChangeText={(text) => setName(text)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none placeholder:text-white/20"
          />
          <Picker
           
            onValueChange={(val) => setRole(val)}
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
           selectedValue={role}>
            <Picker.Item label="Serveur / Serveuse" value="Serveur" />
            <Picker.Item label="Cuisinier / Sous-chef" value="Cuisinier" />
            <Picker.Item label="Plongeur / Services" value="Plongeur" />
          </Picker>
        </View>
        <Pressable
         
          disabled={!name.trim()}
          className="w-full py-2.5 rounded-xl bg-orange-500 disabled:bg-white/5 disabled:text-white/20 text-[#020617] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1"
        >
          <Plus size={13} /> <Text>Ajouter l'employé</Text></Pressable>
      </View>

      {/* Liste d'administration des fiches d'employés */}
      <View className="space-y-3">
        {employees.map((emp) => (
          <View
            key={emp.id}
            className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4"
          >
            <View>
              <Text className="block font-bold text-sm text-white">
                {emp.name}
              </Text>
              <Text className="block text-[10px] text-white/40 mt-0.5 uppercase tracking-wider font-semibold">
                {emp.role}
              </Text>
            </View>

            <View className="flex items-center gap-3">
              <Pressable
                onPress={() => onToggleStatus(emp.id)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border active:scale-95 transition-all cursor-pointer ${
                  emp.isActive
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}
              >
                {emp.isActive ? "Actif" : "En congé"}
              </Pressable>

              <Pressable
                onPress={() => onRemoveEmployee(emp.id)}
                className="text-white/30"
              >
                <Trash size={14} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
