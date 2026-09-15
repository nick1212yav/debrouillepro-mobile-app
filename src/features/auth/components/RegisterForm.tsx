import { View, Text, TextInput, Pressable, NativeSyntheticEvent } from "react-native";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react-native";

import { useRegister } from "../hooks/useRegister";
import { RoleSelector } from "./RoleSelector";

interface RegisterFormProps {
  onLoginClick: () => void;
}

export function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<string[]>(["particulier"]);

  const { register, loading } = useRegister();

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});

  const validate = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Le nom est requis";
    }

    if (!email.trim()) {
      newErrors.email = "L'email est requis";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 caractères";
    }

    if (password !== confirmPassword) {
      newErrors.confirm = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();

    if (!validate()) return;

    await register(email.trim(), password, name.trim());
  };

  return (
    <View className="space-y-5"><View><Text className="block mb-1.5 text-xs font-medium text-white/50">Nom complet *
        </Text><TextInput value={name} onChangeText={(value) => setName(value)} placeholder="Votre nom" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.10)", borderStyle: "solid" }} editable={!(loading)} />{errors.name && (
          <Text className="mt-1 text-xs text-red-400">{errors.name}</Text>
        )}</View><View><Text className="block mb-1.5 text-xs font-medium text-white/50">Email *
        </Text><TextInput value={email} onChangeText={(value) => setEmail(value)} placeholder="exemple@email.com" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.10)", borderStyle: "solid" }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!(loading)} />{errors.email && (
          <Text className="mt-1 text-xs text-red-400">{errors.email}</Text>
        )}</View><View><Text className="block mb-1.5 text-xs font-medium text-white/50">Mot de passe *
        </Text><View className="relative"><TextInput value={password} onChangeText={(value) => setPassword(value)} placeholder="Minimum 6 caractères" className="w-full rounded-2xl px-4 py-3 pr-10 text-sm text-white placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.10)", borderStyle: "solid" }} editable={!(loading)} /><Pressable onPress={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/35">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Pressable></View>{errors.password && (
          <Text className="mt-1 text-xs text-red-400">{errors.password}</Text>
        )}</View><View><Text className="block mb-1.5 text-xs font-medium text-white/50">Confirmer le mot de passe *
        </Text><TextInput value={confirmPassword} onChangeText={(value) => setConfirmPassword(value)} placeholder="Confirmez le mot de passe" className="w-full rounded-2xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,.06)", borderWidth: 1, borderColor: "rgba(255,255,255,.10)", borderStyle: "solid" }} editable={!(loading)} />{errors.confirm && (
          <Text className="mt-1 text-xs text-red-400">{errors.confirm}</Text>
        )}</View><RoleSelector label="Type de compte" selected={roles} onChange={setRoles} multiple /><View className="flex items-start gap-2 text-xs text-white/40"><Pressable required className="mt-1 accent-violet-500" accessibilityRole="checkbox" /><Text>J'accepte les{" "}<Pressable className="text-violet-400">Conditions d'utilisation
          </Pressable>{" "}et la{" "}<Pressable className="text-violet-400">Politique de confidentialité
          </Pressable>.
        </Text></View><Pressable disabled={loading} className="w-full rounded-2xl py-3.5 font-bold text-white transition-all active:scale-95 disabled:opacity-50" style={{  }}>{loading ? (
          <Loader2 className="mx-auto animate-spin" size={20} />
        ) : (
          "Créer mon compte"
        )}</Pressable><Text className="text-center text-sm text-white/40">Vous avez déjà un compte ?{" "}<Pressable onPress={onLoginClick} className="font-semibold text-violet-400">Se connecter
        </Pressable></Text></View>
  );
}
