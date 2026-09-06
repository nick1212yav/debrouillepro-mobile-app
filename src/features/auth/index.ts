// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  UserRole,
  AuthError,
  PhoneAuthStep,
  AuthUser,
  ConvexUser,
  UserSyncData,
} from "./types/auth.types";

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useFirebaseUser } from "./hooks/useFirebaseUser";
export { useConvexUser } from "./hooks/useConvexUser";
export { useAuth } from "./hooks/useAuth";
export { useLogin } from "./hooks/useLogin";
export { useRegister } from "./hooks/useRegister";
export { usePhoneAuth } from "./hooks/usePhoneAuth";
export { useForgotPassword } from "./hooks/useForgotPassword";
export { useAuthRedirect } from "./hooks/useAuthRedirect";

// ─── Providers ──────────────────────────────────────────────────────────────
export { AuthProvider } from "./providers/AuthProvider";
export { ConvexUserProvider } from "./providers/ConvexUserProvider";

// ─── Context ─────────────────────────────────────────────────────────────────
export { AuthContext, useAuthContext } from "./context/AuthContext";

// ─── Guards ──────────────────────────────────────────────────────────────────
export { AuthGuard } from "./guards/AuthGuard";

// ─── Components ──────────────────────────────────────────────────────────────
export {
  AuthLayout,
  LoginForm,
  RegisterForm,
  PhoneForm,
  ForgotPassword,
  GoogleButton,
  RoleSelector,
  EmailVerificationBanner,
} from "./components";

// ─── Services ────────────────────────────────────────────────────────────────
export { ConvexUserService } from "./services/convex/user.service";

// ─── Routes ──────────────────────────────────────────────────────────────────
export { AUTH_ROUTES } from "./routes/auth.routes";
