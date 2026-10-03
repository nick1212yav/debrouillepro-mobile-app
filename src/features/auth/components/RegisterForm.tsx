// src/features/auth/components/RegisterForm.tsx

import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Eye, EyeOff, Loader2 } from "lucide-react-native";

import { useRegister } from "../hooks/useRegister";
import { RoleSelector } from "./RoleSelector";

interface RegisterFormProps {
  onLoginClick: () => void;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

export function RegisterForm({ onLoginClick }: RegisterFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState<string[]>(["particulier"]);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const { register, loading } = useRegister();

  const validate = () => {
    const newErrors: FormErrors = {};
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      newErrors.name = "Le nom est requis";
    }

    if (!normalizedEmail) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      newErrors.email = "Adresse email invalide";
    }

    if (!password) {
      newErrors.password = "Le mot de passe est requis";
    } else if (password.length < 6) {
      newErrors.password = "Minimum 6 caractères";
    }

    if (!confirmPassword) {
      newErrors.confirm = "Veuillez confirmer votre mot de passe";
    } else if (password !== confirmPassword) {
      newErrors.confirm = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (loading) return;

    if (!validate()) return;

    if (!acceptedTerms) return;

    await register(email.trim(), password, name.trim());
  };

  const updateField = (
    field: keyof FormErrors,
    setter: (value: string) => void,
    value: string,
  ) => {
    setter(value);

    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }
  };

  return (
    <View className="w-full">
      {/* Nom complet */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">
          Nom complet *
        </Text>

        <TextInput
          value={name}
          onChangeText={(value) => updateField("name", setName, value)}
          placeholder="Votre nom"
          placeholderTextColor="rgba(255,255,255,0.25)"
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="name"
          textContentType="name"
          editable={!loading}
          returnKeyType="next"
          accessibilityLabel="Nom complet"
          className={`w-full rounded-2xl border bg-white/[0.06] px-4 py-3.5 text-sm text-white ${
            errors.name ? "border-red-500/50" : "border-white/10"
          }`}
        />

        {errors.name ? (
          <Text className="mt-1 text-xs text-red-400">{errors.name}</Text>
        ) : null}
      </View>

      {/* Email */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">Email *</Text>

        <TextInput
          value={email}
          onChangeText={(value) => updateField("email", setEmail, value)}
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
          className={`w-full rounded-2xl border bg-white/[0.06] px-4 py-3.5 text-sm text-white ${
            errors.email ? "border-red-500/50" : "border-white/10"
          }`}
        />

        {errors.email ? (
          <Text className="mt-1 text-xs text-red-400">{errors.email}</Text>
        ) : null}
      </View>

      {/* Mot de passe */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">
          Mot de passe *
        </Text>

        <View className="relative">
          <TextInput
            value={password}
            onChangeText={(value) =>
              updateField("password", setPassword, value)
            }
            placeholder="Minimum 6 caractères"
            placeholderTextColor="rgba(255,255,255,0.25)"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!loading}
            returnKeyType="next"
            accessibilityLabel="Mot de passe"
            className={`w-full rounded-2xl border bg-white/[0.06] px-4 py-3.5 pr-12 text-sm text-white ${
              errors.password ? "border-red-500/50" : "border-white/10"
            }`}
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
            onPress={() => setShowPassword((current) => !current)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 active:opacity-60 disabled:opacity-40"
          >
            {showPassword ? (
              <EyeOff size={18} color="rgba(255,255,255,0.45)" />
            ) : (
              <Eye size={18} color="rgba(255,255,255,0.45)" />
            )}
          </Pressable>
        </View>

        {errors.password ? (
          <Text className="mt-1 text-xs text-red-400">{errors.password}</Text>
        ) : null}
      </View>

      {/* Confirmation */}
      <View className="mb-4">
        <Text className="mb-2 text-xs font-medium text-white/50">
          Confirmer le mot de passe *
        </Text>

        <TextInput
          value={confirmPassword}
          onChangeText={(value) =>
            updateField("confirm", setConfirmPassword, value)
          }
          placeholder="Confirmez le mot de passe"
          placeholderTextColor="rgba(255,255,255,0.25)"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          textContentType="newPassword"
          editable={!loading}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel="Confirmation du mot de passe"
          className={`w-full rounded-2xl border bg-white/[0.06] px-4 py-3.5 text-sm text-white ${
            errors.confirm ? "border-red-500/50" : "border-white/10"
          }`}
        />

        {errors.confirm ? (
          <Text className="mt-1 text-xs text-red-400">{errors.confirm}</Text>
        ) : null}
      </View>

      {/* Type de compte */}
      <View className="mb-5">
        <RoleSelector
          label="Type de compte"
          selected={roles}
          onChange={setRoles}
          multiple
        />
      </View>

      {/* Conditions */}
      <View className="mb-5 flex-row items-start">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="J'accepte les conditions d'utilisation et la politique de confidentialité"
          accessibilityState={{
            checked: acceptedTerms,
            disabled: loading,
          }}
          disabled={loading}
          onPress={() => setAcceptedTerms((current) => !current)}
          className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${
            acceptedTerms
              ? "border-violet-500 bg-violet-600"
              : "border-white/20 bg-white/[0.04]"
          }`}
        >
          {acceptedTerms ? (
            <Text className="text-xs font-bold text-white">✓</Text>
          ) : null}
        </Pressable>

        <Text className="flex-1 text-xs leading-5 text-white/40">
          J'accepte les{" "}
          <Text className="font-medium text-violet-400">
            Conditions d'utilisation
          </Text>{" "}
          et la{" "}
          <Text className="font-medium text-violet-400">
            Politique de confidentialité
          </Text>
          .
        </Text>
      </View>

      {/* Register */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Créer mon compte"
        accessibilityState={{
          disabled: loading || !acceptedTerms,
          busy: loading,
        }}
        disabled={loading || !acceptedTerms}
        onPress={handleSubmit}
        className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3.5 active:opacity-80 disabled:opacity-50"
      >
        <View className="min-h-[20px] flex-row items-center justify-center">
          {loading ? (
            <>
              <Loader2 size={20} color="#ffffff" className="mr-2" />

              <Text className="text-sm font-bold text-white">Création...</Text>
            </>
          ) : (
            <Text className="text-sm font-bold text-white">
              Créer mon compte
            </Text>
          )}
        </View>
      </Pressable>

      {/* Login */}
      <View className="mt-5 flex-row items-center justify-center">
        <Text className="text-sm text-white/40">
          Vous avez déjà un compte ?{" "}
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Se connecter"
          accessibilityState={{ disabled: loading }}
          disabled={loading}
          onPress={onLoginClick}
          className="rounded-lg px-1 py-1 active:opacity-70 disabled:opacity-50"
        >
          <Text className="text-sm font-semibold text-violet-400">
            Se connecter
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
