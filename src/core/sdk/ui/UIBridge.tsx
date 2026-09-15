import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { EventBus } from "../events/EventBus";
import { UIRegistry } from "../registry/UIRegistry";
import type { DomainEvent } from "../types";

interface UIState {
  id: string;
  type: "sheet" | "modal" | "drawer" | "dialog";
  props: any;
}

export function UIBridge() {
  const [openUI, setOpenUI] = useState<UIState | null>(null);

  useEffect(() => {
    // ── Écoute des événements UI via EventBus ───────────────────────
    const unsubscribe = EventBus.subscribe(
      "ui.sheet.open",
      (event: DomainEvent) => {
        const { id, props } = event.payload;
        console.log("[UIBridge] open sheet:", id, props);
        setOpenUI({
          id,
          type: "sheet",
          props: props ?? {},
        });
      },
    );

    const unsubscribeClose = EventBus.subscribe("ui.sheet.close", () => {
      setOpenUI(null);
    });

    // ── Écoute d'événement custom "job-apply" — WEB UNIQUEMENT ──────
    // window.addEventListener n'existe pas sur RN natif (Android/iOS)
    let handleJobApply: ((e: Event) => void) | null = null;

    if (Platform.OS === "web" && typeof window !== "undefined") {
      handleJobApply = (e: Event) => {
        const custom = e as CustomEvent;
        const { publication } = custom.detail;
        if (publication) {
          EventBus.publish({
            type: "ui.sheet.open",
            moduleId: "job",
            payload: {
              id: "job.apply",
              props: { publication },
            },
            timestamp: Date.now(),
          });
        }
      };

      window.addEventListener("job-apply", handleJobApply as EventListener);
    }

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      if (typeof unsubscribeClose === "function") unsubscribeClose();

      if (
        Platform.OS === "web" &&
        typeof window !== "undefined" &&
        handleJobApply
      ) {
        window.removeEventListener(
          "job-apply",
          handleJobApply as EventListener,
        );
      }
    };
  }, []);

  const handleClose = () => {
    setOpenUI(null);
  };

  if (!openUI) return null;

  const config = UIRegistry.get(openUI.id);
  if (!config) {
    console.warn(`UI sheet ${openUI.id} not registered`);
    return null;
  }

  const Component = config.component as React.ComponentType<any>;
  return <Component {...openUI.props} onClose={handleClose} />;
}
