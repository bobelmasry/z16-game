"use client";
import { useEffect, useRef, useState } from "react";
import { abiNames, formatRegisterValue } from "@/lib/utils";
import { signExtend } from "@/lib/utils/binary";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { BUFS } from "@/hooks/use-simulator";

export default function Registers() {
  const [viewMode, setViewMode] = useState<"hex" | "binary" | "decimal">("hex");
  const [nameMode, setNameMode] = useState<"register" | "abi">("abi");

  // Refs for each register's text span
  const spanRefs = useRef<HTMLSpanElement[]>([]);

  // Helper to get register name
  const getRegisterName = (index: number) => {
    if (nameMode === "abi") {
      return abiNames[index as keyof typeof abiNames] || `x${index}`;
    }
    return `x${index}`;
  };

  // Imperative update loop using requestAnimationFrame
  useEffect(() => {
    const view = new Uint16Array(BUFS.registers);
    let rafId: number;
    const update = () => {
      for (let i = 0; i < view.length; i++) {
        const span = spanRefs.current[i];
        if (span) {
          // sign-extend 16-bit then format
          const val = signExtend(view[i], 16);
          span.textContent = formatRegisterValue(val, viewMode);
        }
      }
      rafId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafId);
  }, [viewMode]);

  // Number of registers
  const registerCount = 8;

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center mb-2 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-green-400 font-mono">
          Registers
        </h2>
        {/* Name toggle */}
        <ToggleGroup
          type="single"
          variant="outline"
          onValueChange={(val) => setNameMode(val as any)}
          value={nameMode}
          className="flex items-center border border-green-500/30 rounded bg-black/50"
        >
          <ToggleGroupItem
            value="register"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            REG
          </ToggleGroupItem>
          <ToggleGroupItem
            value="abi"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            ABI
          </ToggleGroupItem>
        </ToggleGroup>
        {/* Format toggle */}
        <ToggleGroup
          type="single"
          variant="outline"
          onValueChange={(val) => setViewMode(val as any)}
          value={viewMode}
          className="flex items-center border border-green-500/30 rounded bg-black/50"
        >
          <ToggleGroupItem
            value="hex"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            HEX
          </ToggleGroupItem>
          <ToggleGroupItem
            value="binary"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            BIN
          </ToggleGroupItem>
          <ToggleGroupItem
            value="decimal"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            DEC
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Register grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: registerCount }).map((_, idx) => (
          <div
            key={idx}
            className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded font-mono"
          >
            <span
              ref={(el) => {
                if (el) spanRefs.current[idx] = el;
              }}
              className="text-green-400 retro-terminal-text"
            >
              {getRegisterName(idx)}: {/* initial value overwritten by loop */}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
