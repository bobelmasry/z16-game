import type { ECallRequest, ExitEvent } from "@/lib/simulator";
import type { SimulatorState } from ".";

export type WorkerEventData = {
  command: "init";
  payload: {
    memory: SharedArrayBuffer;
    registers: SharedArrayBuffer;
    pc: SharedArrayBuffer;
    control: SharedArrayBuffer;
    event: SharedArrayBuffer;
  };
};
export type WorkerEventResponse =
  | { command: "ecall"; payload: ECallRequest }
  | { command: "memory"; payload: Uint16Array }
  | { command: "debug"; payload: any }
  | { command: "update"; payload: SimulatorState }
  | { command: "exit"; payload: ExitEvent };
