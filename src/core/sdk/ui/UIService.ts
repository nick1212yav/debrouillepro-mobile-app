import { EventBus } from "../events/EventBus";

export class UIService {
  static openSheet(id: string, props: any) {
    EventBus.publish({
      type: "ui.sheet.open",
      moduleId: "ui",
      payload: { id, props },
      timestamp: Date.now(),
    });
  }

  static closeSheet(id: string) {
    EventBus.publish({
      type: "ui.sheet.close",
      moduleId: "ui",
      payload: { id },
      timestamp: Date.now(),
    });
  }

  static openModal(id: string, props: any) {
    EventBus.publish({
      type: "ui.modal.open",
      moduleId: "ui",
      payload: { id, props },
      timestamp: Date.now(),
    });
  }

  static closeModal(id: string) {
    EventBus.publish({
      type: "ui.modal.close",
      moduleId: "ui",
      payload: { id },
      timestamp: Date.now(),
    });
  }

  static openDrawer(id: string, props: any) {
    EventBus.publish({
      type: "ui.drawer.open",
      moduleId: "ui",
      payload: { id, props },
      timestamp: Date.now(),
    });
  }

  static closeDrawer(id: string) {
    EventBus.publish({
      type: "ui.drawer.close",
      moduleId: "ui",
      payload: { id },
      timestamp: Date.now(),
    });
  }

  static openPlayer(props: any) {
    EventBus.publish({
      type: "ui.player.open",
      moduleId: "ui",
      payload: { props },
      timestamp: Date.now(),
    });
  }

  static closePlayer() {
    EventBus.publish({
      type: "ui.player.close",
      moduleId: "ui",
      payload: {},
      timestamp: Date.now(),
    });
  }

  static openViewer(props: any) {
    EventBus.publish({
      type: "ui.viewer.open",
      moduleId: "ui",
      payload: { props },
      timestamp: Date.now(),
    });
  }

  static closeViewer() {
    EventBus.publish({
      type: "ui.viewer.close",
      moduleId: "ui",
      payload: {},
      timestamp: Date.now(),
    });
  }

  static openToast(
    message: string,
    type: "success" | "error" | "info" | "warning" = "info",
  ) {
    EventBus.publish({
      type: "ui.toast.show",
      moduleId: "ui",
      payload: { message, type },
      timestamp: Date.now(),
    });
  }
}
