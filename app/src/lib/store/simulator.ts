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

  reset: () => void;
  step: () => void;
  play: () => void;
  pause: () => void;
  resume: () => void; // Resume from paused state after ecall is handled
  exit: () => void;
  setMemory: (memory: Uint16Array<ArrayBuffer>) => void;
  setRegisters: (registers: number[]) => void;
  setInstructions: (instructions: Instruction[]) => void;
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  pc: 0,
  registers: Array(8).fill(0),
  memory: new Uint16Array(65536),
  instructions: [],
  state: "paused",
  fileName: null,

  reset: () => {
    set(() => ({
      pc: 0,
      registers: Array(8).fill(0),
      memory: new Uint16Array(65536),
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

  play: () =>
    set((state) => {
      if (state.state === "running") return state; // Already running

      return { state: "running" }; // TODO: Start the execution loop
    }),

  pause: () => {
    // TODO: Stop the execution loop

    set((state) => {
      return { state: "paused" };
    });
  },

  exit: () =>
    set((state) => {
      return { state: "halted" };
    }),

  resume: () => {
    console.log("Resuming execution from PC:", get().pc);
    set((s) => ({ pc: s.pc + 2, state: s.prevState }));
    console.log("Resuming execution to PC:", get().pc);

    if (get().prevState === "running") {
      get().play();
    }
  },

  setMemory: (memory) => set(() => ({ memory })),

  setRegisters: (registers) => set(() => ({ registers })),

  setInstructions: (instructions) => set(() => ({ instructions })),
}));
