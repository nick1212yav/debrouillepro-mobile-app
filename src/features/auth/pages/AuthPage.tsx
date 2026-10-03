// src/features/auth/pages/AuthPage.tsx

import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { AuthLayout } from "../components/AuthLayout";
import { Divider } from "../components/Divider";
import { ForgotPassword } from "../components/ForgotPassword";
import { GoogleButton } from "../components/GoogleButton";
import { LoginForm } from "../components/LoginForm";
import { PhoneButton } from "../components/PhoneButton";
import { RegisterForm } from "../components/RegisterForm";
import { useAuthRedirect } from "../hooks/useAuthRedirect";

type AuthMode = "login" | "register" | "phone" | "forgot";

interface AuthPageProps {
  initialMode?: AuthMode;
  onNavigate?: (path: string) => void;
}

const AUTH_MODES: readonly AuthMode[] = [
  "login",
  "register",
  "phone",
  "forgot",
];

const TITLES: Record<AuthMode, { title: string; subtitle: string }> = {
  login: {
    title: "Bienvenue",
    subtitle: "Connectez-vous à votre compte",
  },
  register: {
    title: "Créer un compte",
    subtitle: "Rejoignez la communauté Débrouille",
  },
  phone: {
    title: "Connexion par téléphone",
    subtitle: "Recevez un code par SMS",
  },
  forgot: {
    title: "Mot de passe oublié",
    subtitle: "Réinitialisez votre mot de passe",
  },
};

function normalizeInitialMode(value?: string): AuthMode {
  return value && AUTH_MODES.includes(value as AuthMode)
    ? (value as AuthMode)
    : "login";
}

export function AuthPage({ initialMode = "login", onNavigate }: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>(normalizeInitialMode(initialMode));

  useAuthRedirect({
    redirectTo: "/",
    onRedirect: onNavigate,
  });

  const titleContent = useMemo(() => TITLES[mode], [mode]);

  const goToLogin = () => setMode("login");
  const goToRegister = () => setMode("register");
  const goToForgot = () => setMode("forgot");

  const renderContent = () => {
    switch (mode) {
      case "login":
        return (
          <View className="w-full">
            {/* Authentification rapide */}
            <GoogleButton />

            <View className="mt-3">
              <PhoneButton />
            </View>

            <Divider />

            {/* Authentification email */}
            <LoginForm
              onRegisterClick={goToRegister}
              onForgotPasswordClick={goToForgot}
            />
          </View>
        );

      case "register":
        return <RegisterForm onLoginClick={goToLogin} />;

      case "phone":
        return (
          <View className="w-full items-center py-8">
            <Text className="text-center text-sm leading-5 text-white/50">
              Utilisez le bouton{" "}
              <Text className="font-semibold text-white/70">
                « Continuer avec Téléphone »
              </Text>{" "}
              depuis l'écran de connexion.
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retour à la connexion"
              onPress={goToLogin}
              className="mt-5 rounded-xl px-3 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-violet-400">
                ← Retour à la connexion
              </Text>
            </Pressable>
          </View>
        );

      case "forgot":
        return <ForgotPassword onBack={goToLogin} />;

      default:
        return null;
    }
  };

  return (
    <AuthLayout title={titleContent.title} subtitle={titleContent.subtitle}>
      {renderContent()}
    </AuthLayout>
  );
}
