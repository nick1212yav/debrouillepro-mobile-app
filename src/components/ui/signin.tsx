// src/components/ui/signin.tsx
import React, { forwardRef, useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  GestureResponderEvent,
  PressableProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LogIn, LogOut } from "lucide-react-native";

import {
  Button,
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { logout, signInWithGoogle } from "@/services/auth/firebaseAuth";

export interface SignInButtonProps extends Omit<PressableProps, "onPress"> {
  onPress?: (event: GestureResponderEvent) => void;
  showIcon?: boolean;
  signInText?: string;
  signOutText?: string;
  loadingText?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  className?: string;
}

export const SignInButton = forwardRef<View, SignInButtonProps>(
  function SignInButton(
    {
      onPress,
      disabled,
      showIcon = true,
      signInText = "Connexion",
      signOutText = "Déconnexion",
      loadingText,
      className: _className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) {
    const { isAuthenticated } = useFirebaseAuth();
    const [isLoading, setIsLoading] = useState(false);

    const handlePress = useCallback(
      async (event: GestureResponderEvent) => {
        onPress?.(event);

        if (isLoading) return;
        setIsLoading(true);

        try {
          if (isAuthenticated) {
            await logout();
            Alert.alert("Succès", "Déconnexion réussie");
          } else {
            const user = await signInWithGoogle();

            if (user) {
              Alert.alert("Succès", "Connexion réussie");
            }
            // user === null → annulation utilisateur, pas d'alerte
          }
        } catch (err) {
          console.error("FIREBASE GOOGLE ERROR:", err);
          Alert.alert(
            "Erreur",
            err instanceof Error ? err.message : "Erreur d'authentification",
          );
        } finally {
          setIsLoading(false);
        }
      },
      [isAuthenticated, isLoading, onPress],
    );

    const isDisabled = disabled || isLoading;

    const currentLoadingText =
      loadingText || (isAuthenticated ? "Déconnexion..." : "Connexion...");

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <ActivityIndicator size="small" color="#FFFFFF" />
    ) : isAuthenticated ? (
      <LogOut size={16} color="#FFFFFF" />
    ) : (
      <LogIn size={16} color="#FFFFFF" />
    );

    return (
      <Button
        ref={ref}
        onPress={handlePress}
        disabled={isDisabled}
        variant={variant}
        size={size}
        asChild={asChild}
        accessibilityLabel={
          isAuthenticated
            ? "Sign out of your account"
            : "Sign in to your account"
        }
        {...props}
      >
        {showIcon && icon}
        <Text style={styles.label}>{buttonText}</Text>
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";

const styles = StyleSheet.create({
  label: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
