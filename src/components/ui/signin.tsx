import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, GestureResponderEvent } from "react-native";
import { forwardRef, useCallback, useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { Loader2, LogIn, LogOut } from "lucide-react-native";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { loginWithGoogle, logout } from "@/services/auth/firebaseAuth";

export interface SignInButtonProps
  extends
    Omit<React.ComponentProps<typeof Pressable>, "onClick">,
    VariantProps<typeof buttonVariants> {
  onClick?: (event: GestureResponderEvent) => void;

  showIcon?: boolean;

  signInText?: string;

  signOutText?: string;

  loadingText?: string;

  asChild?: boolean;
}

export const SignInButton = forwardRef<Pressable, SignInButtonProps>(
  (
    {
      onClick,
      disabled,
      showIcon = true,
      signInText = "Connexion",
      signOutText = "Déconnexion",
      loadingText,
      className,
      variant,
      size,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const { isAuthenticated } = useFirebaseAuth();

    const [isLoading, setIsLoading] = useState(false);

    const handleClick = useCallback(
      async (event: GestureResponderEvent) => {
        onClick?.(event);

        try {
          setIsLoading(true);

          if (isAuthenticated) {
            await logout();

            UIService.openToast("Déconnexion réussie", "success");
          } else {
            await loginWithGoogle();

            UIService.openToast("Connexion réussie", "success");
          }
        } catch (err: unknown) {
          console.error("FIREBASE ERROR:", err);

          const message =
            err instanceof Error ? err.message : "Erreur d'authentification";

          UIService.openToast(message, "error");
        } finally {
          setIsLoading(false);
        }
      },
      [isAuthenticated, onClick],
    );

    const isDisabled = disabled || isLoading;

    const defaultLoadingText = isAuthenticated
      ? "Déconnexion..."
      : "Connexion...";

    const currentLoadingText = loadingText || defaultLoadingText;

    const buttonText = isLoading
      ? currentLoadingText
      : isAuthenticated
        ? signOutText
        : signInText;

    const icon = isLoading ? (
      <Loader2 className="size-4 animate-spin" />
    ) : isAuthenticated ? (
      <LogOut className="size-4" />
    ) : (
      <LogIn className="size-4" />
    );

    return (
      <Button
        ref={ref}
        onPress={handleClick}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={className}
        asChild={asChild}
        accessibilityLabel={
          isAuthenticated
            ? "Sign out of your account"
            : "Sign in to your account"
        }
        {...props}
      >
        {showIcon && icon}
        {buttonText}
      </Button>
    );
  },
);

SignInButton.displayName = "SignInButton";
