// src/features/auth/components/LoginForm.tsx

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
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

  const canSubmit = email.trim().length > 0 && password.length > 0 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    await login(email.trim(), password);
  };

  return (
    <View className="w-full">
      {/* Email */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">Email</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="exemple@email.com"
          placeholderTextColor="rgba(255,255,255,0.25)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          editable={!loading}
          returnKeyType="next"
          accessibilityLabel="Adresse email"
          className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 text-sm text-white"
        />
      </View>

      {/* Password */}
      <View className="mb-3">
        <Text className="mb-2 text-xs font-medium text-white/50">
          Mot de passe
        </Text>

        <View className="relative">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="rgba(255,255,255,0.25)"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
            textContentType="password"
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            accessibilityLabel="Mot de passe"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 pr-12 text-sm text-white"
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              showPassword
                ? "Masquer le mot de passe"
                : "Afficher le mot de passe"
            }
            accessibilityState={{ disabled: loading }}
            disabled={loading}
            onPress={() => setShowPassword((visible) => !visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 active:opacity-60 disabled:opacity-40"
          >
            {showPassword ? (
              <EyeOff size={18} color="rgba(255,255,255,0.45)" />
            ) : (
              <Eye size={18} color="rgba(255,255,255,0.45)" />
            )}
          </Pressable>
        </View>
      </View>

      {/* Forgot password */}
      <View className="mb-5 items-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mot de passe oublié"
          disabled={loading}
          onPress={onForgotPasswordClick}
          className="rounded-lg px-1 py-1 active:opacity-70 disabled:opacity-50"
        >
          <Text className="text-xs font-medium text-violet-400">
            Mot de passe oublié ?
          </Text>
        </Pressable>
      </View>

      {/* Login */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Se connecter"
        accessibilityState={{
          disabled: !canSubmit,
          busy: loading,
        }}
        disabled={!canSubmit}
        onPress={handleSubmit}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 active:opacity-80 disabled:opacity-60"
      >
        <View className="min-h-[20px] flex-row items-center justify-center">
          {loading ? (
            <>
              <Loader2 size={20} color="#ffffff" className="mr-2" />
              <Text className="text-sm font-bold text-white">Connexion...</Text>
            </>
          ) : (
            <Text className="text-sm font-bold text-white">Se connecter</Text>
          )}
        </View>
      </Pressable>

      {/* Register */}
      <View className="mt-5 flex-row items-center justify-center">
        <Text className="text-sm text-white/40">
          Vous n'avez pas de compte ?{" "}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Créer un compte"
          disabled={loading}
          onPress={onRegisterClick}
          className="rounded-lg px-1 py-1 active:opacity-70 disabled:opacity-50"
        >
          <Text className="text-sm font-semibold text-violet-400">
            Créer un compte
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
