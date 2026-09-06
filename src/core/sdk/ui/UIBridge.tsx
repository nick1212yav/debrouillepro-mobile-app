import { useEffect, useState } from "react";
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
    // Écoute des événements UI via EventBus
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

    // ✅ Écoute des événements custom pour job-apply (compatibilité)
    const handleJobApply = (e: Event) => {
      const custom = e as CustomEvent;
      const { publication } = custom.detail;
      if (publication) {
        // On ouvre directement ApplySheet via EventBus
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

    undefined;

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
      if (typeof unsubscribeClose === "function") unsubscribeClose();
      undefined;
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
