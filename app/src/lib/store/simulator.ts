import { create } from "zustand";
import { Opcode, type Instruction } from "../utils/decoder";
import { executeInstruction, type ExecutionState } from "../utils/executor";
import { useOperatingSystemStore } from "./os";
import { stepPerformanceMonitor } from "../utils/performance";

type SimulatorState = "running" | "paused" | "blocked" | "halted";

export type SimulatorStore = {
  pc: number;
  registers: number[];
  memory: Uint16Array<ArrayBuffer>;
  state: SimulatorState;
  prevState?: SimulatorState;
  instructions: Instruction[];
  speed: number; // Speed in Hz, e.g., 3 means 3Hz (300ms per step)
  animationFrameId?: number; // For canceling animation frames
  totalInstructions: number; // Total instructions executed
  executionStartTime?: number; // Timestamp when execution started
  executionEndTime?: number; // Timestamp when execution ended
  audioVolume: number; // Volume for audio playback, if applicable
  audioPlaying: boolean; // Whether audio is currently playing

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
  setAudioVolume: (volume: number) => void; // Optional method for setting audio volume
  setAudioPlaying: (isPlaying: boolean) => void; // Optional method for setting audio playing state
};

export const useSimulatorStore = create<SimulatorStore>()((set, get) => ({
  pc: 0,
  registers: Array(8).fill(0),
  memory: new Uint16Array(65536),
  instructions: [],
  state: "paused",
  fileName: null,
  speed: 3, // Default speed (frequency) is 3, which means 300ms per step
  animationFrameId: undefined,
  totalInstructions: 0,
  executionStartTime: undefined,
  executionEndTime: undefined,
  audioVolume: 1.0, // Default volume for audio playback
  audioPlaying: false, // Initial state for audioPlaying

  setAudioVolume: (volume) => {
    if (volume < 0 || volume > 1) {
      console.warn("Volume must be between 0 and 1");
      return;
    }
    set(() => ({ audioVolume: volume }));
  },

  setAudioPlaying: (isPlaying) => {
    set(() => ({ audioPlaying: isPlaying }));
  },

  reset: () => {
    const { animationFrameId } = get();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    set(() => ({
      pc: 0,
      registers: Array(8).fill(0),
      state: "paused",
      animationFrameId: undefined,
      totalInstructions: 0,
      executionStartTime: undefined,
      executionEndTime: undefined,
    }));
    useOperatingSystemStore.getState().reset();
  },

  step: () => {
    stepPerformanceMonitor.startTiming();

    const state = get();

    // Set execution start time on first step
    if (
      state.executionStartTime === undefined &&
      state.totalInstructions === 0
    ) {
      set({ executionStartTime: performance.now() });
    }

    const PC = state.pc;
    if (PC > state.memory.length) return; // TODO: Maybe throw a toast or something

    // Here, we call the executeInstruction function
    const instructionLocation = Math.floor(PC / 2);
    const instruction = state.instructions[instructionLocation]; // Use direct array access instead of .at()
    if (!instruction) return; // No instruction to execute TODO: throw a toast or something

    // If the instruction is an ecall, give control to the OS
    if (instruction.opcode === Opcode.ecall) {
      const os = useOperatingSystemStore.getState();
      const request = os.handleECall(instruction.service);

      if (request) {
        os.setPendingECall(request);
        set({
          state: "blocked",
          totalInstructions: state.totalInstructions + 1,
        });
      } else {
        set({
          pc: PC + 2,
          totalInstructions: state.totalInstructions + 1,
        });
      }
    } else {
      const executionState: ExecutionState = {
        registers: state.registers,
        memory: state.memory,
        pc: PC,
      };
      const result = executeInstruction(instruction, executionState);

      set({
        pc: result.pc,
        memory: result.memory,
        registers: result.registers, // executor now returns a new array
        prevState: state.state,
        totalInstructions: state.totalInstructions + 1,
      });
    }

    stepPerformanceMonitor.endTiming();
  },

  play: () => {
    let lastTime = performance.now();
    let executionBatch = 1; // Number of instructions to execute per frame

    const runLoop = (currentTime: number) => {
      const { state, step, speed } = get();

      if (state !== "running") {
        set({ animationFrameId: undefined });
        return;
      }

      const deltaTime = currentTime - lastTime;
      const targetInterval = 1000 / speed;

      // Adaptive batching for high speeds to reduce overhead
      if (speed > 100) {
        executionBatch = Math.ceil(speed / 60); // Execute multiple instructions per frame
        for (let i = 0; i < executionBatch && get().state === "running"; i++) {
          step();
        }
        // For very high speeds, minimize frame delays
        const frameId = requestAnimationFrame(runLoop);
        set({ animationFrameId: frameId });
      } else if (speed > 60) {
        // Medium-high speeds: execute multiple per frame but respect timing somewhat
        const instructionsToExecute = Math.max(1, Math.floor(speed / 60));
        for (
          let i = 0;
          i < instructionsToExecute && get().state === "running";
          i++
        ) {
          step();
        }
        const frameId = requestAnimationFrame(runLoop);
        set({ animationFrameId: frameId });
      } else {
        // Lower speeds: use time-based execution for accuracy
        if (deltaTime >= targetInterval) {
          step();
          lastTime = currentTime;
        }
        const frameId = requestAnimationFrame(runLoop);
        set({ animationFrameId: frameId });
      }
    };

    set((state) => {
      if (state.state === "running") return state;

      // Cancel any existing animation frame
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
      }

      // Start the loop
      const frameId = requestAnimationFrame(runLoop);
      return {
        state: "running",
        animationFrameId: frameId,
      };
    });
  },

  pause: () => {
    const { animationFrameId } = get();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    set(() => ({
      state: "paused",
      animationFrameId: undefined,
    }));
  },

  exit: (code: number) => {
    const { animationFrameId, executionStartTime, totalInstructions } = get();
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }

    const executionEndTime = performance.now();
    const executionTimeMs = executionStartTime
      ? executionEndTime - executionStartTime
      : 0;
    const executionTimeSec = executionTimeMs / 1000;
    const avgInstructionsPerSec =
      executionTimeSec > 0 ? totalInstructions / executionTimeSec : 0;

    set({ executionEndTime });

    useOperatingSystemStore
      .getState()
      .consolePrint([
        "Program exited with code " + code,
        "Total instructions executed: " + totalInstructions,
        "Execution time: " + executionTimeSec.toFixed(3) + " seconds",
        "Average frequency: " + avgInstructionsPerSec.toFixed(1) + " Hz",
      ]);
    set((state) => {
      return { state: "halted" };
    });
  },

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
