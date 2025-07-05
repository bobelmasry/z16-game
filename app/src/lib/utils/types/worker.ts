import type { ECallRequest, ExitEvent } from "@/lib/simulator";

export type WorkerEventData = {
  command: "init";
  payload: {
    memory: SharedArrayBuffer;
    registers: SharedArrayBuffer;
    pc: SharedArrayBuffer;
    state: SharedArrayBuffer;
    control: SharedArrayBuffer;
    event: SharedArrayBuffer;
  };
};
export type WorkerEventResponse =
  | { command: "ecall"; payload: ECallRequest }
  | { command: "exit"; payload: ExitEvent };
