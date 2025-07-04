import { create } from "zustand";
import type { Instruction } from "../utils/types/instruction";
import { generateInstructions } from "../utils/decoder";
import type { SimulatorState } from "../utils/types";
import type { WorkerEventData } from "../utils/types/worker";
import { useOperatingSystemStore } from "./os";

export type SimulatorStore = {
  memory: Uint16Array;
  pc: number;
  registers: Uint16Array;
  state: SimulatorState;
  speed: number;
  instructions: Instruction[]; // Array of decoded instructions
  totalInstructions: number; // used to track total instructions executed

  worker?: Worker;

  reset: () => void;
  step: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void; // Resume from blocked state

  loadMemory: (memory: Uint16Array<ArrayBuffer>) => void; // Set memory and generate instructions
  setSpeed: (speed: number) => void;
  setWorker: (worker: Worker) => void;
  sendToWorker: (message: WorkerEventData) => void;
  updateRegisters: (registers: Uint16Array) => void;
  setTotalInstructions: (total: number) => void;
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  memory: new Uint16Array(65536), // Initialize with 64 KB of memory
  pc: 0,
  registers: new Uint16Array(8), // 8 registers, each 16 bits
  state: "paused",
  speed: 3, // Default speed (frequency) is 3, which means 300ms per step
  instructions: [], // Initialize with an empty array
  totalInstructions: 0,

  reset: () => {
    useOperatingSystemStore.getState().reset();
    get().sendToWorker({ command: "reset" });
  },

  step: () => {
    get().sendToWorker({ command: "step" });
  },

  start: () => {
    get().sendToWorker({ command: "start" });
  },

  pause: () => {
    get().sendToWorker({ command: "pause" });
  },

  resume() {
    get().sendToWorker({ command: "resume" });
  },

  loadMemory: (memory) => {
    set({ instructions: generateInstructions(memory) });
    get().sendToWorker({ command: "load", payload: memory });
  },

  setSpeed: (speed) => {
    set(() => ({ speed }));
    get().sendToWorker({ command: "setSpeed", payload: speed });
  },

  setWorker: (worker) => set(() => ({ worker })),

  sendToWorker(message) {
    const worker = get().worker;
    if (worker) {
      worker.postMessage(message);
    } else {
      console.error("Worker is not set");
    }
  },

  updateRegisters: (registers) => {
    get().sendToWorker({ command: "updateRegisters", payload: registers });
  },

  setTotalInstructions: (total) => set(() => ({ totalInstructions: total })),
}));
