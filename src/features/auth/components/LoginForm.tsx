import { View, Text, TextInput, NativeSyntheticEvent, Pressable } from "react-native";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react-native";
import { useLogin } from "../hooks/useLogin";

interface LoginFormProps {
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

export function LoginForm({
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useLogin();

  const handleSubmit = async (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <View className="space-y-4"><View><Text className="text-xs text-white/50 font-medium mb-1.5 block">Email
        </Text><TextInput value={email} onChangeText={(value) => setEmail(value)} placeholder="exemple@email.com" className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} required keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!(loading)} /></View><View><Text className="text-xs text-white/50 font-medium mb-1.5 block">Mot de passe
        </Text><View className="relative"><TextInput value={password} onChangeText={(value) => setPassword(value)} placeholder="••••••••" className="w-full px-4 py-3 rounded-2xl text-sm text-white placeholder:text-white/25 outline-none pr-10" style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }} required editable={!(loading)} /><Pressable onPress={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</Pressable></View></View><View className="text-right"><Pressable onPress={onForgotPasswordClick} className="text-xs text-violet-400">Mot de passe oublié ?
        </Pressable></View><Pressable disabled={loading} className="w-full py-3.5 rounded-2xl font-bold text-white transition-all active:scale-95 disabled:opacity-60" style={{  }}>{loading ? (
          <Loader2 size={20} className="animate-spin mx-auto" />
        ) : (
          "Se connecter"
        )}</Pressable><Text className="text-center text-sm text-white/40">Vous n'avez pas de compte ?{" "}<Pressable onPress={onRegisterClick} className="text-violet-400 font-semibold">Créer un compte
        </Pressable></Text></View>
  );
}
