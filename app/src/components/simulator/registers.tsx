"use client";
import { Switch } from "@/components/ui/switch";
import { useSimulatorStore } from "@/lib/store/simulator";
import { abiNames, formatRegisterValue } from "@/lib/utils";
import { signExtend } from "@/lib/utils/binary";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Binary, Bold, Italic, Underline } from "lucide-react";

export default function Registers() {
  const registers = useSimulatorStore((s) => s.registers);
  const [viewMode, setViewMode] = useState<"hex" | "binary" | "decimal">("hex");
  const [nameMode, setNameMode] = useState<"register" | "abi">("abi");

  const getRegisterName = (index: number) => {
    if (nameMode === "abi") {
      return abiNames[index as keyof typeof abiNames] || `x${index}`;
    }
    return `x${index}`;
  };

  return (
    <div>
      <div className="flex items-center mb-2 flex-wrap gap-2">
        <h2 className="text-lg font-semibold text-green-400 font-mono">
          Registers
        </h2>

        {/* Register Name Toggle */}
        <ToggleGroup
          type="single"
          variant="outline"
          onValueChange={(value) => setNameMode(value as any)}
          value={nameMode}
          className="flex items-center border border-green-500/30 rounded bg-black/50"
        >
          <ToggleGroupItem
            value="register"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            <p>REG</p>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="abi"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            <p>ABI</p>
          </ToggleGroupItem>
        </ToggleGroup>

        {/* Value Format Toggle */}
        <ToggleGroup
          type="single"
          variant="outline"
          onValueChange={(value) => setViewMode(value as any)}
          value={viewMode}
          className="flex items-center border border-green-500/30 rounded bg-black/50"
        >
          <ToggleGroupItem
            value="hex"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            <p>HEX</p>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="binary"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            <p>BIN</p>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="decimal"
            className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
          >
            <p>DEC</p>
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {registers.map((value, index) => (
          <div
            key={index}
            className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded font-mono"
          >
            <span className="text-green-400 retro-terminal-text">
              {getRegisterName(index)}:{" "}
              {formatRegisterValue(signExtend(value, 16), viewMode)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
