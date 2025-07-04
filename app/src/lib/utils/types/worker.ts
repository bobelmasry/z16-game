import type { ECallRequest, SimulatorSnapshot } from "@/lib/simulator";

export type WorkerEventData =
  | { command: "load"; payload: Uint16Array }
  | { command: "start" }
  | { command: "pause" }
  | { command: "step" }
  | { command: "reset" }
  | { command: "resume" }
  | { command: "setSpeed"; payload: number }
  | { command: "updateRegisters"; payload: Uint16Array }
  | { command: "keyDown"; payload: string }
  | { command: "keyUp"; payload: string };

export type WorkerEventResponse =
  | { command: "init"; payload: { sharedBuffer: SharedArrayBuffer } }
  | { command: "ecall"; payload: ECallRequest }
  | { command: "update"; payload: SimulatorSnapshot }
  | { command: "memory"; payload: Uint16Array }
  | { command: "debug"; payload: any };
