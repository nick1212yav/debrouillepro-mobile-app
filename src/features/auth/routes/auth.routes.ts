/**
 * Routes centralisées pour le module d'authentification.
 */
export const AUTH_ROUTES = {
  login: "/auth/login",
  register: "/auth/register",
  phone: "/auth/phone",
  forgotPassword: "/auth/forgot-password",
  verifyEmail: "/auth/verify-email",
  logout: "/auth/logout",
} as const;
