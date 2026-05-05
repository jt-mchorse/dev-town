import Phaser from "phaser";
import { EVENTS } from "../config";
import type { DialogLine, DialogRequest } from "../types";

class DialogBus extends Phaser.Events.EventEmitter {
  show(req: DialogRequest): void {
    this.emit(EVENTS.DialogShow, req);
  }
  advance(): void {
    this.emit(EVENTS.DialogAdvance);
  }
  close(): void {
    this.emit(EVENTS.DialogClose);
  }
}

export const DialogManager = new DialogBus();

export function lines(...texts: (string | DialogLine)[]): DialogLine[] {
  return texts.map((t) => (typeof t === "string" ? { text: t } : t));
}
