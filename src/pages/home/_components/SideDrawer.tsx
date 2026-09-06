import { View, Pressable } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

import { useCurrentUser, getDisplayName } from "@/hooks/use-current-user";

import {
  DrawerHeader,
  DrawerSection,
  DrawerFooter,
} from "@/navigation/components";

import { useNavigation } from "@/navigation/hooks";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

export default function SideDrawer({
  isOpen,
  onClose,
  onNavigate,
}: SideDrawerProps) {
  const user = useCurrentUser();

  const displayName = getDisplayName(user);
  const email = user?.email ?? "";

  const { navSections, badges } = useNavigation();

  /**
   * Navigation centralisée.
   *
   * On transmet l'identifiant au routeur/page parent,
   * puis on ferme immédiatement le drawer.
   */
  const handleNav = (id: string) => {
    onNavigate(id);
    onClose();
  };

  /**
   * Déconnexion Firebase.
   *
   * Firebase reste la source d'authentification.
   * Convex récupère ensuite l'identité correspondante
   * via son intégration d'authentification.
   */
  const handleLogout = async () => {
    try {
      await signOut(auth);
      onClose();
    } catch (error) {
      console.error("[SideDrawer] Erreur lors de la déconnexion :", error);
    }
  };

  return (
    <>
      {isOpen && (
        <>
          {/* =====================================================
              BACKDROP
              ===================================================== */}

          <Pressable
            onPress={onClose}
            accessibilityElementsHidden={true}
            className="absolute inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.72)" }}
          />

          {/* =====================================================
              DRAWER
              ===================================================== */}

          <View
            accessibilityRole="dialog"
            aria-modal="true"
            accessibilityLabel="Menu DébrouillePro"
            className="absolute bottom-0 left-0 top-0 z-50 flex w-[78%] max-w-[380px] flex-col overflow-hidden"
            style={{ borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.07)", borderRightStyle: "solid" }}
          >
            {/* =================================================
                HEADER
                ================================================= */}

            <DrawerHeader
              user={user ?? null}
              displayName={displayName}
              email={email}
              onClose={onClose}
              onProfile={() => handleNav("profile")}
            />

            {/* =================================================
                NAVIGATION
                ================================================= */}

            <View
              className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
              style={{  }}
            >
              {navSections.map((section) => (
                <DrawerSection
                  key={section.title}
                  section={section}
                  onItemClick={handleNav}
                  badges={badges}
                />
              ))}
            </View>

            {/* =================================================
                FOOTER
                ================================================= */}

            <DrawerFooter onLogout={handleLogout} />
          </View>
        </>
      )}
    </>
  );
}
