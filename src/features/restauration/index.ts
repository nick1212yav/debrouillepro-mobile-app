import RestaurationPage from "./pages/RestaurationPage";
import RestaurationDetailPage from "./pages/RestaurationDetailPage";
import RestaurationSearchPage from "./pages/RestaurationSearchPage";
import RestaurationCartPage from "./pages/RestaurationCartPage";
import RestaurationOrderPage from "./pages/RestaurationOrderPage";
import RestaurationReservationPage from "./pages/RestaurationReservationPage";
import RestaurationChefPage from "./pages/RestaurationChefPage";
import RestaurationDashboardPage from "./pages/RestaurationDashboardPage";

export {
  RestaurationPage,
  RestaurationDetailPage,
  RestaurationSearchPage,
  RestaurationCartPage,
  RestaurationOrderPage,
  RestaurationReservationPage,
  RestaurationChefPage,
  RestaurationDashboardPage,
};

// Exportation des sous-modules métiers (AI, Analytique)
export * as AI from "./ai";
export * as Analytics from "./analytics";
export * from "./actions";
export * from "./adapter";
export * from "./fields";
export * from "./lifecycle";
export * from "./manifest";
export * from "./metrics";
export * from "./permissions";
export * from "./register";
export * from "./search";
export * from "./subtypes";
