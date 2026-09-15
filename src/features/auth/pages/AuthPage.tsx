import { Pressable, Text, View } from "react-native";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { LoginForm } from "../components/LoginForm";
import { RegisterForm } from "../components/RegisterForm";
import { ForgotPassword } from "../components/ForgotPassword";
import { GoogleButton } from "../components/GoogleButton";
import { PhoneButton } from "../components/PhoneButton"; // ✅ Nouveau bouton téléphone
import { Divider } from "../components/Divider"; // ✅ Composant séparateur
import { useAuthRedirect } from "../hooks/useAuthRedirect";

type AuthMode = "login" | "register" | "phone" | "forgot";

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as AuthMode) || "login";
  const [mode, setMode] = useState<AuthMode>(initialMode);
  useAuthRedirect();

  const renderContent = () => {
    switch (mode) {
      case "login":
        return (
          <>
            {/* ✅ Ordre : Google → Téléphone → Séparateur → Email */}
            <GoogleButton />
            <PhoneButton />
            <Divider />
            <LoginForm
              onRegisterClick={() => setMode("register")}
              onForgotPasswordClick={() => setMode("forgot")}
            />
          </>
        );

      case "register":
        return <RegisterForm onLoginClick={() => setMode("login")} />;

      case "phone":
        // Le modal du téléphone est géré par PhoneButton,
        // cette vue n'est plus nécessaire mais on garde le fallback
        return (
          <View className="text-center py-8">
            <Text className="text-white/50 text-sm">
              Utilisez le bouton "Continuer avec Téléphone" sur l'écran de
              connexion.
            </Text>
            <Pressable onPress={() => setMode("login")} className="mt-4 text-violet-400">
              ← Retour à la connexion
            </Pressable>
          </View>
        );

      case "forgot":
        return <ForgotPassword onBack={() => setMode("login")} />;

      default:
        return null;
    }
  };

  const titles = {
    login: { title: "Bienvenue", subtitle: "Connectez-vous à votre compte" },
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

  const { title, subtitle } = titles[mode];

  return (
    <AuthLayout title={title} subtitle={subtitle}>
      {renderContent()}
    </AuthLayout>
  );
}
