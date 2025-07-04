import type { ECallRequest, ExitEvent } from "@/lib/simulator";
import type { SimulatorState } from ".";

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
  | {
      command: "init";
      payload: {
        sharedBuffer: SharedArrayBuffer;
        sharedRegistersBuffer: SharedArrayBuffer;
        sharedPCBuffer: SharedArrayBuffer;
      };
    }
  | { command: "ecall"; payload: ECallRequest }
  | { command: "memory"; payload: Uint16Array }
  | { command: "debug"; payload: any }
  | { command: "update"; payload: SimulatorState }
  | { command: "exit"; payload: ExitEvent };
