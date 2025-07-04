import { create } from "zustand";
import type { Instruction } from "../utils/types/instruction";
import { generateInstructions } from "../utils/decoder";
import { Command, SimulatorState } from "../utils/types";
import type { WorkerEventData } from "../utils/types/worker";
import { useOperatingSystemStore } from "./os";
import { sharedMemory, sharedRegisters } from "@/hooks/use-simulator";
import { sendCommand } from "../utils/command";

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

  setSpeed: (speed: number) => void;
  setWorker: (worker: Worker) => void;
  sendToWorker: (message: WorkerEventData) => void;
  setTotalInstructions: (total: number) => void;
  setState: (state: SimulatorState) => void; // Set the simulator state

  updateRegisters: (registers: Uint16Array) => void;
  loadMemory: (memory: Uint16Array<ArrayBuffer>) => void; // Set memory and generate instructions
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  memory: new Uint16Array(65536), // Initialize with 64 KB of memory
  pc: 0,
  registers: new Uint16Array(8), // 8 registers, each 16 bits
  state: SimulatorState.Paused,
  speed: 3, // Default speed (frequency) is 3, which means 300ms per step
  instructions: [], // Initialize with an empty array
  totalInstructions: 0,

  reset: () => {
    useOperatingSystemStore.getState().reset();
    sendCommand(Command.RESET);
    set({ state: SimulatorState.Paused });
  },

  step: () => {
    sendCommand(Command.STEP);
  },

  start: () => {
    sendCommand(Command.START);
    // Optionally, you can also set the state to Running
    set({ state: SimulatorState.Running });
  },

  pause: () => {
    sendCommand(Command.PAUSE);
    // Optionally, you can also set the state to Paused
    set(() => ({ state: SimulatorState.Paused }));
  },

  resume() {
    sendCommand(Command.RESUME);
  },

  loadMemory: (memory) => {
    sharedMemory.set(memory);
    sendCommand(Command.LOAD);
    set({ instructions: generateInstructions(memory) });
  },

  setSpeed: (speed) => {
    sendCommand(Command.SET_SPEED, speed);
    set(() => ({ speed }));
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
    sharedRegisters.set(registers);
  },

  setTotalInstructions: (total) => set(() => ({ totalInstructions: total })),

  setState: (state) => set(() => ({ state })),
}));
