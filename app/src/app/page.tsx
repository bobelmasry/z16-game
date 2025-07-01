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
        case 1:
        case 2:
          break;
        case 3:
          // Print string to console from address of a0 (x6) register
          const startAddress = registers[6] / 2; // x6 is a0
          let done = false;
          let output = "";
          for (let i = startAddress; i < memory.length; i++) {
            const memoryWord = memory[i];
            for (let j = 0; j < 16; j += 8) {
              const charCode = (memoryWord >> j) & 0xff; // Extract each byte
              if (charCode === 0) {
                done = true; // Stop if we hit a null terminator
                break;
              } // Stop at null terminator
              output += String.fromCharCode(charCode);
            }
            if (done) break; // Stop if we hit a null terminator
          }

          setConsoleMessages((prev) => [...prev, `Output: ${output}`]);

          break;
        case 8: {
          // registers dump, print all registers to console
          const output = registers
            .map((value, index) => `x${index}: ${value} (0x${value.toString(16)})`)
            .join("\n");
          setConsoleMessages((prev) => [...prev, `Registers Dump:\n${output}`]);
          break;
        }
        case 9: {
          const startAddress = Math.floor(registers[6]) / 2; // x6 is a0
          const length = registers[7]; // x7 is a1

          const output: string[] = [];
          for (let i = startAddress; i < startAddress + length; i++) {
            const memoryWord = memory[i];
            const byte1 = memoryWord & 0xff; // Get first byte
            const byte2 = (memoryWord >> 8) & 0xff; // Get second byte
            // Print the address and the two bytes
            output.push(
              `0x${i.toString(16).padStart(4, "0")}: 0x${byte1
                .toString(16) // // Also display as characters
                .padStart(2, "0")} 0x${byte2
                .toString(16)
                .padStart(2, "0")}  (${String.fromCharCode(
                byte1
              )}, ${String.fromCharCode(byte2)})`
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
    // setConsoleMessages((m) => [...m, "Program exited."]);
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
