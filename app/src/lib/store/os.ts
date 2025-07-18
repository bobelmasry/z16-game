import { create } from "zustand";
import { useSimulatorStore } from "./simulator";
import { Command, SimulatorState } from "../utils/types";
import { sendCommand } from "../utils/command";
import { BUFS } from "@/hooks/use-simulator";
import { playTone } from "../audio";
import { ECALLService } from "../utils/types/instruction";

type ECallRequest =
  | { type: "readString"; maxLen: number; addr: number }
  | { type: "readInt" }
  | { type: "random"; min: number; max: number };

export interface OperatingSystemStore {
  consoleLog: string[];
  fileName: string | null;
  pendingECall: ECallRequest | null;

  resolveECall: (value: string) => void;
  handleECall: (
    service: number,
    registers: Uint16Array,
    memory: Uint16Array
  ) => void;
  setPendingECall: (ecall: ECallRequest | null) => void;
  // Appends to the last line of the console log
  consoleAppend(message: string): void;
  // Prints messages to the console log, each message on a new line
  consolePrint(messages: string[]): void;
  // Clears the console log
  consoleClear(): void;
  setFileName: (fileName: string | null) => void;
  handleFileChange: (file: File) => void;
  reset: () => void;
}

export const useOperatingSystemStore = create<OperatingSystemStore>()(
  (set, get) => ({
    fileName: null,
    pendingECall: null,
    consoleLog: [],

    resolveECall(value: string) {
      const req = get().pendingECall;
      if (!req) return;

      const registers = new Uint16Array(BUFS.registers);
      const memory = new Uint16Array(BUFS.memory);

      switch (req.type) {
        case "readString": {
          const { addr, maxLen } = req;
          let totalBytesToWrite = Math.min(value.length, maxLen - 1); // leave space for null terminator
          let bytePos = 0;
          for (let i = 0; i < totalBytesToWrite; i++) {
            const charCode = value.charCodeAt(i);
            const wordIndex = Math.floor((addr + i) / 2);
            const byteOffset = (addr + i) % 2;
            if (byteOffset === 0) {
              memory[wordIndex] =
                (memory[wordIndex] & 0xff00) | (charCode & 0xff); // write to lower byte
            } else {
              memory[wordIndex] =
                (memory[wordIndex] & 0x00ff) | ((charCode & 0xff) << 8); // upper byte
            }
            bytePos++;
          }
          // Null-terminate
          const nullIndex = Math.floor((addr + bytePos) / 2);
          const nullOffset = (addr + bytePos) % 2;
          if (nullOffset === 0) {
            memory[nullIndex] = memory[nullIndex] & 0xff00; // clear lower byte
          } else {
            memory[nullIndex] = memory[nullIndex] & 0x00ff; // clear upper byte
          }
          registers[6] = bytePos; // set a0 to length of actual string (excluding null terminator)
          break;
        }
        case "readInt":
          registers[6] = parseInt(value, 10); // set a0 to the integer value
          break;
        case "random": {
          // Generate random number between a0 and a1 inclusive, and put it a0
          const min = (registers[6] << 16) >> 16; // a0 as signed 16-bit
          const max = (registers[7] << 16) >> 16; // a1 as signed 16-bit
          if (min > max) {
            get().consolePrint([
              `Invalid random range: ${min} to ${max}. a0 should be less than or equal to a1.`,
            ]);
            return;
          }
          const randomValue = Math.floor(
            Math.random() * (max - min + 1) + min
          );
          registers[6] = randomValue; // Set the random value in a0
        }
      }

      // Resume the worker
      sendCommand(Command.RESUME);

      set({
        pendingECall: null,
      });
    },

    handleECall(service, registers, memory) {
      switch (service) {
        // TODO: Use the enums
        case 1: {
          // Read String
          const addr = registers[6]; // a0
          const maxLen = registers[7]; // a1
          set(() => ({
            pendingECall: {
              type: "readString",
              maxLen,
              addr,
            },
          }));
          return;
        }
        case 2: {
          // Read Integer
          set(() => ({
            pendingECall: { type: "readInt" },
          }));
          return;
        }
        case 3: {
          // Print String
          const byteOffset = registers[6] % 2; // start at lower (0) or upper (1) byte
          const startWord = Math.floor(registers[6] / 2); // word index
          let done = false;
          let output = "";
          let first = true;
          for (let i = startWord; i < memory.length; i++) {
            const memoryWord = memory[i];
            const startByte = first ? byteOffset : 0;
            first = false;
            for (let k = startByte; k < 2; k++) {
              const charCode = (memoryWord >> (k * 8)) & 0xff; // Extract byte
              if (charCode === 0) {
                done = true;
                break;
              }
              output += String.fromCharCode(charCode);
            }
            if (done) break;
          }

          get().consolePrint([output]);
          break;
        }
        case 4: {
          const frequency = registers[6]; // a0
          const duration = registers[7]; // a1

          if (frequency < 0 || frequency > 65535) {
            return;
          }
          if (duration < 0 || duration > 65535) {
            return;
          }

          playTone(frequency, duration);

          break;
        }
        case 5: {
          // Set audio volume, a0 = volume (0-255)
          const volume = registers[6]; // x6 is a0
          if (volume < 0 || volume > 255) {
          }
          break;
        }
        case 6: {
          // Stop audio playback
          break;
        }
        case 8: {
          // registers dump, print all registers to console
          const output = [...registers]
            .map(
              (value, index) => `x${index}: ${value} (0x${value.toString(16)})`
            )
            .join("\n");

          get().consolePrint([`Registers Dump:\n${output}`]);
          break;
        }
        case 9: {
          // memory dump
          const startAddress = Math.floor(registers[6] / 2); // x6 is a0
          let length = Math.ceil(registers[7] / 2); // x7 is a1
          const skipFirstByte = (registers[6] / 2) % 1 !== 0;
          length += skipFirstByte ? 1 : 0; // Adjust length if skipping first byte

          // Calculate byte addresses
          const byteStart = registers[6];
          const byteEnd = byteStart + registers[7] - 1;

          // Check for out-of-bounds access
          if (byteStart < 0x0000 || byteEnd > 0xFFFF) {
            get().consolePrint([
              `Memory Error: Address range 0x${byteStart.toString(16).padStart(4, "0")}-0x${byteEnd.toString(16).padStart(4, "0")} is out of memory bounds (0x0000-0xFFFF).`
            ]);
            break;
          }

          const printByte = (byte: number | null) =>
            byte === null ? "----" : `0x${byte.toString(16).padStart(2, "0")}`;

          const printChar = (byte: number | null) =>
            byte === null
              ? "-"
              : String.fromCharCode(byte < 32 || byte > 126 ? 0 : byte);

          const output: string[] = [];
          for (let i = startAddress; i < startAddress + length; i++) {
            const memoryWord = memory[i];
            const byte1 = memoryWord & 0xff; // Get first byte
            const byte2 = (memoryWord >> 8) & 0xff; // Get second byte
            const bytes: (number | null)[] = [byte1, byte2];
            if (skipFirstByte && i === startAddress) {
              bytes[0] = null;
            }
            if (i === startAddress + length - 1 && skipFirstByte) {
              bytes[1] = null; // Last byte is null if skipping first byte
            }

            // Print the address and the two bytes
            output.push(
              `${(i * 2).toString(16).padStart(4, "0")}: ${printByte(
                bytes[0]
              )} ${printByte(bytes[1])} (${printChar(bytes[0])} ${printChar(
                bytes[1]
              )})`
            );
          }

          get().consolePrint([
            `Memory Dump from 0x${(startAddress * 2)
              .toString(16)
              .padStart(4, "0")} (${registers[7]} bytes):`,
            ...output,
          ]);

          break;
        }
        case 10: {
          // Exit the program
          get().consolePrint(["Exiting program with code " + registers[6]]);
          return;
        }
        case 11: {
          set(() => ({
            pendingECall: { type: "random", min: registers[6], max: registers[7] },
          }));

          get().resolveECall("");
        }
        default:
          break;
      }

      return;
    },

    setPendingECall(ecall) {
      set({ pendingECall: ecall });
    },

    consoleAppend(message) {
      set((state) => ({
        consoleLog:
          state.consoleLog.length > 0
            ? [
              ...state.consoleLog.slice(0, -1),
              state.consoleLog[state.consoleLog.length - 1] + message,
            ]
            : [message],
      }));
    },

    consolePrint(messages) {
      set((state) => ({
        consoleLog: [...state.consoleLog, ...messages],
      }));
    },

    consoleClear() {
      set(() => ({ consoleLog: [] }));
    },

    setFileName: (fileName) => set(() => ({ fileName })),

    handleFileChange(file) {
      const simulationStore = useSimulatorStore.getState();
      simulationStore.reset();
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const binary = new Uint16Array(arrayBuffer);
        simulationStore.loadMemory(binary);
        get().setFileName(file.name);
      });
      reader.readAsArrayBuffer(file);
    },

    reset() {
      set(() => ({
        consoleLog: [],
        pendingECall: null,
      }));
    },
  })
);
