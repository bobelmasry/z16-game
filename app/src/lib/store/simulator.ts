import { create } from "zustand";
import type { Instruction } from "../utils/types/instruction";
import { generateInstructions } from "../utils/decoder";
import { Command, SimulatorState } from "../utils/types";
import type { WorkerEventData } from "../utils/types/worker";
import { useOperatingSystemStore } from "./os";
import { sendCommand } from "../utils/command";
import { BUFS } from "@/hooks/use-simulator";

export type SimulatorStore = {
  speed: number;
  instructions: Instruction[]; // Array of decoded instructions
  totalInstructions: number; // used to track total instructions executed

  reset: () => void;
  step: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void; // Resume from blocked state

  setSpeed: (speed: number) => void;
  setTotalInstructions: (total: number) => void;

  updateRegisters: (registers: Uint16Array) => void;
  loadMemory: (memory: Uint16Array<ArrayBuffer>) => void; // Set memory and generate instructions
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  state: SimulatorState.Paused,
  speed: 3, // Default speed (frequency) is 3, which means 300ms per step
  instructions: [], // Initialize with an empty array
  totalInstructions: 0,

  reset: () => {
    useOperatingSystemStore.getState().reset();
    sendCommand(Command.RESET);
  },

  step: () => {
    sendCommand(Command.STEP);
  },

  start: () => {
    sendCommand(Command.START);
  },

  pause: () => {
    sendCommand(Command.PAUSE);
  },

  resume() {
    sendCommand(Command.RESUME);
    // TODO: // Implement resume logic if needed
  },

  loadMemory: (memory) => {
    const memoryView = new Uint16Array(BUFS.memory);
    memoryView.set(memory);
    sendCommand(Command.LOAD);
    set({ instructions: generateInstructions(memory) });
  },

  setSpeed: (speed) => {
    sendCommand(Command.SET_SPEED, speed);
    set({ speed });
  },

  updateRegisters: (registers) => {
    const registersView = new Uint16Array(BUFS.registers);
    registersView.set(registers);
  },

  setTotalInstructions: (total) => set(() => ({ totalInstructions: total })),
}));
