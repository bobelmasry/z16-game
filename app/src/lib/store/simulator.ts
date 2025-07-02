import { create } from "zustand";
import { Opcode, type Instruction } from "../utils/decoder";
import { executeInstruction, type ExecutionState } from "../utils/executor";
import { useOperatingSystemStore } from "./os";

type SimulatorState = "running" | "paused" | "blocked" | "halted";

export type SimulatorStore = {
  pc: number;
  registers: number[];
  memory: Uint16Array<ArrayBuffer>;
  state: SimulatorState;
  prevState?: SimulatorState;
  instructions: Instruction[];
  speed: number; // Speed in Hz, e.g., 3 means 3Hz (300ms per step)

  reset: () => void;
  step: () => void;
  play: () => void;
  pause: () => void;
  resume: () => void; // Resume from paused state after ecall is handled
  exit: (code: number) => void;
  setMemory: (memory: Uint16Array<ArrayBuffer>) => void;
  setRegisters: (registers: number[]) => void;
  setInstructions: (instructions: Instruction[]) => void;
  setSpeed: (speed: number) => void;
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  pc: 0,
  registers: Array(8).fill(0),
  memory: new Uint16Array(65536),
  instructions: [],
  state: "paused",
  fileName: null,
  speed: 3, // Default speed (frequency) is 3, which means 300ms per step

  reset: () => {
    set(() => ({
      pc: 0,
      registers: Array(8).fill(0),
      state: "paused",
    }));
    useOperatingSystemStore.getState().reset();
  },

  step: () =>
    set((state) => {
      const PC = state.pc;
      if (PC > state.memory.length) return state; // TODO: Maybe throw a toast or something

      // Here, we call the executeInstruction function
      const instructionLocation = Math.floor(PC / 2);
      const instruction = state.instructions.at(instructionLocation);
      if (!instruction) return state; // No instruction to execute TODO: throw a toast or something
      const executionState: ExecutionState = {
        registers: state.registers,
        memory: state.memory,
        pc: PC,
      };
      // If the instruction is an ecall, give control to the OS
      if (instruction.opcode === Opcode.ecall) {
        const os = useOperatingSystemStore.getState();
        const request = os.handleECall(instruction.service);

        if (request) {
          os.setPendingECall(request);
          return {
            state: "blocked",
          };
        } else {
          return {
            pc: PC + 2,
          };
        }
      } else {
        const result = executeInstruction(instruction, executionState);
        return {
          pc: result.pc,
          memory: result.memory,
          registers: [...result.registers],
          prevState: state.state,
        };
      }
    }),

  play: () => {
    const runNextStep = () => {
      const { state, step, play, speed } = get();

      if (state !== "running") return; // Stop if state changed
      step(); // Execute a single instruction

      // Check again if we should continue
      if (get().state === "running") {
        const timeout = (1 / speed) * 1000; // Convert frequency to milliseconds
        setTimeout(runNextStep, timeout); // Continue after delay
      }
    };

    set((state) => {
      if (state.state === "running") return state;
      // Start loop
      const timeout = (1 / state.speed) * 1000;
      setTimeout(runNextStep, timeout); // Default speed is 300ms
      return { state: "running" };
    });
  },

  pause: () => {
    set((state) => {
      return { state: "paused" };
    });
  },

  exit: (code: number) =>
    set((state) => {
      useOperatingSystemStore
        .getState()
        .consolePrint(["Program exited with code " + code]);
      return { state: "halted" };
    }),

  resume: () => {
    set((s) => ({ pc: s.pc + 2 }));

    if (get().prevState === "running") {
      get().play();
    } else if (get().prevState === "paused") {
      set((s) => ({ state: "paused" }));
    }
  },

  setMemory: (memory) => set(() => ({ memory })),

  setRegisters: (registers) => set(() => ({ registers })),

  setInstructions: (instructions) => set(() => ({ instructions })),

  setSpeed: (speed) => set(() => ({ speed })),
}));
