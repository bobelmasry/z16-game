"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  decodeToInstruction,
  decodeToString,
  Instruction,
  Opcode,
} from "@/utils/decoder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CodeViewer } from "../../components/code";
import { RefreshCw, Play, Pause, StepForward } from "lucide-react";
import { executeInstruction } from "@/utils/execute";
import Registers from "../../components/registers";

export default function Home() {
  // CPU state
  const [registers, setRegisters] = useState(Array(8).fill(0));
  const [PC, setPC] = useState(0);
  const [audioVolume, setAudioVolume] = useState(128); // Default volume level
  const [audioPlaying, setAudioPlaying] = useState(false); // Whether audio is currently playing

  // IO-related state
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]); // Stores console output logs

  // Data
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [memory, setMemory] = useState(new Uint16Array(65536)); // 64K memory
  const [fileName, setFileName] = useState<string>("");

  // Simulation control
  const [state, setState] = useState<"running" | "stopped" | "exited">(
    "stopped"
  );
  const intervalRef = useRef<number | null>(null);
  const delay = 500; // ms per step

  const reset = () => {
    // clear loop
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState("stopped");
    setPC(0);
    setRegisters(Array(8).fill(0));
    setConsoleMessages([]);
  };

  const execute = () => {
    const inst = instructions[PC / 2];
    // Check if the instruction is ecall
    if (inst.opcode === Opcode.ecall) {
      const service = inst.service;
      switch (service) {
        case 1: {
          /* THIS NEEDS TO BE FIXED */

          const inputString = prompt("Enter a string:");
          if (inputString !== null) {
            const maxLength = registers[7]; // a1: max length including null terminator
            const startByteAddr = registers[6]; // a0: byte address

            let totalBytesToWrite = Math.min(inputString.length, maxLength - 1); // leave space for null terminator
            let bytePos = 0;

            for (let i = 0; i < totalBytesToWrite; i++) {
              const charCode = inputString.charCodeAt(i);
              const wordIndex = Math.floor((startByteAddr + i) / 2);
              const byteOffset = (startByteAddr + i) % 2;

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
            const nullIndex = Math.floor((startByteAddr + bytePos) / 2);
            const nullOffset = (startByteAddr + bytePos) % 2;
            if (nullOffset === 0) {
              memory[nullIndex] = memory[nullIndex] & 0xff00; // clear lower byte
            } else {
              memory[nullIndex] = memory[nullIndex] & 0x00ff; // clear upper byte
            }

            registers[6] = bytePos; // set a0 to length of actual string (excluding null terminator)
          }
          break;
        }

        case 2:
          // read integer from console input and store in x0 register (t0)
          const inputInteger = prompt("Enter an integer:");
          if (inputInteger !== null) {
            registers[0] = parseInt(inputInteger, 10);
          }
          break;
        case 3:
          // Print string to console from address of a0 (x6) register
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

          setConsoleMessages((prev) => [...prev, output]);

          break;
        case 4: {
          const frequency = registers[6]; // a0
          const duration = registers[7]; // a1

          if (frequency < 0 || frequency > 65535) {
            setConsoleMessages((prev) => [
              ...prev,
              "Error: Frequency must be between 0 and 65535.",
            ]);
            return;
          }
          if (duration < 0 || duration > 65535) {
            setConsoleMessages((prev) => [
              ...prev,
              "Error: Duration must be between 0 and 65535 milliseconds.",
            ]);
            return;
          }

          const audioCtx = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          // Normalize audioVolume (0–255) to gain (0.0–1.0)
          const normalizedVolume =
            Math.max(0, Math.min(audioVolume, 255)) / 255;
          gainNode.gain.setValueAtTime(normalizedVolume, audioCtx.currentTime);

          oscillator.type = "sine";
          oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          oscillator.start();
          setAudioPlaying(true);
          setConsoleMessages((prev) => [
            ...prev,
            `Playing tone: ${frequency} Hz for ${duration} ms at volume ${audioVolume}/255`,
          ]);

          setTimeout(() => {
            oscillator.stop();
            setAudioPlaying(false);
            setConsoleMessages((prev) => [...prev, "Tone finished."]);
          }, duration);

          break;
        }
        case 5: {
          // Set audio volume, a0 = volume (0-255)
          const volume = registers[6]; // x6 is a0
          if (volume < 0 || volume > 255) {
            setConsoleMessages((prev) => [
              ...prev,
              "Error: Volume must be between 0 and 255.",
            ]);
          }
          setAudioVolume(volume);
          break;
        }
        case 6: {
          // Stop audio playback
          setAudioPlaying(false);
          break;
        }
        case 7: {
          // Read the keyboard, a0 = keycode, a1 = 1 if a key is pressed, 0 if not
          break;
        }
        case 8: {
          // registers dump, print all registers to console
          const output = registers
            .map(
              (value, index) => `x${index}: ${value} (0x${value.toString(16)})`
            )
            .join("\n");
          setConsoleMessages((prev) => [...prev, `Registers Dump:\n${output}`]);
          break;
        }
        case 9: {
          // memory dump
          const startAddress = Math.floor(registers[6] / 2); // x6 is a0
          let length = Math.ceil(registers[7] / 2); // x7 is a1
          const skipFirstByte = (registers[6] / 2) % 1 !== 0;
          length += skipFirstByte ? 1 : 0; // Adjust length if skipping first byte

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

          setConsoleMessages((prev) => [
            ...prev,
            `Memory Dump from 0x${startAddress
              .toString(16)
              .padStart(4, "0")} (${length} words):`,
            ...output,
          ]);

          break;
        }
        case 10: // Program exit
          exit(); // Stop the simulation
          break;
        default:
          break;
      }
      setPC(PC + 2);
      return;
    }

    const newState = executeInstruction(inst, {
      registers,
      memory,
      pc: PC,
    });
    setRegisters(newState.registers);
    setMemory(newState.memory);
    setPC(newState.pc);
    return newState;
  };

  const exit = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState("exited");
    setPC(0);
    // setRegisters(Array(8).fill(0));
    setConsoleMessages((m) => [...m, "Program exited."]);
  };

  const step = () => {
    if (PC < instructions.length) {
      execute();
    } else {
      // stop if beyond
      pause();
    }
  };

  const play = () => {
    if (state == "running") return;
    setState("running");
    intervalRef.current = window.setInterval(() => {
      setPC((prevPC) => {
        if (prevPC < instructions.length) {
          const inst = instructions[prevPC];
          const newState = executeInstruction(inst, {
            registers,
            memory,
            pc: PC,
          });
          setRegisters(newState.registers);
          setMemory(newState.memory);
          setPC(newState.pc);
          return newState.pc;
        } else {
          // end
          pause();
          return prevPC;
        }
      });
    }, delay);
  };

  const pause = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState("stopped");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name); // Store the filename
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const binary = new Uint16Array(arrayBuffer);
      setMemory(binary); // Store the binary data in memory
      setInstructions(
        Array.from(binary).map((value) => decodeToInstruction(value))
      );
      // Clear the input value to allow selecting the same file again
      e.target.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => pause();
  }, []);

  return (
    <div className="">
      <div className="w-screen h-12 bg-neutral-900 flex items-center justify-between px-4 py-2">
        {/* Simulation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={reset}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </Button>
          {state == "running" ? (
            <Button
              onClick={pause}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Pause className="w-4 h-4" /> Pause
            </Button>
          ) : (
            <Button
              onClick={play}
              variant="outline"
              className="flex items-center gap-2"
              disabled={state === "exited" || instructions.length === 0}
            >
              <Play className="w-4 h-4" /> Start
            </Button>
          )}
          <Button
            onClick={step}
            variant="outline"
            className="flex items-center gap-2"
            disabled={state === "exited" || instructions.length === 0}
          >
            <StepForward className="w-4 h-4" /> Step
          </Button>
        </div>
        <h1 className="text-emerald-600 font-bold text-2xl">Zx16 Simulator</h1>
      </div>
      <div className="flex h-[calc(100vh-3rem)]">
        <CodeViewer
          width={350}
          PC={PC}
          empty={instructions.length === 0}
          code={
            instructions.length === 0
              ? "# Upload a binary file\n# to get started!"
              : instructions
                  .map((instruction) => decodeToString(instruction))
                  .join("\n")
          }
        />
        <div className="flex-1 p-4 overflow-y-auto bg-neutral-800 text-white">
          <div className="h-[50rem] bg-black mb-4"></div>
          <div className="mb-4">
            <Label htmlFor="file-upload" className="block mb-2">
              Upload Z16 Binary File
            </Label>
            <div className="relative">
              <Input
                type="file"
                id="file-upload"
                accept=".bin"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <Input
                type="text"
                value={fileName || "Choose a file..."}
                placeholder="Choose a file..."
                readOnly
                className="cursor-pointer"
              />
            </div>
          </div>
          <Registers registers={registers} />
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">PC</h2>
            <div className="bg-neutral-700 p-2 rounded">{PC}</div>
          </div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Console Output</h2>
            <div className="bg-neutral-700 p-2 rounded h-64 overflow-y-auto">
              {consoleMessages.map((msg, index) => (
                <p key={index}>{msg}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
