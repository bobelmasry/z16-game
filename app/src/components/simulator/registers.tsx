"use client";
import { Switch } from "@/components/ui/switch";
import { useSimulatorStore } from "@/lib/store/simulator";
import { formatRegisterValue } from "@/lib/utils";
import { signExtend } from "@/lib/utils/binary";
import { useState } from "react";

export default function Registers() {
  const registers = useSimulatorStore((s) => s.registers);
  const [viewMode, setViewMode] = useState<"hex" | "binary">("binary");

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold">Registers</h2>
        <div className="w-2"></div>
        <Switch
          checked={viewMode === "hex"}
          onCheckedChange={(checked) => setViewMode(checked ? "hex" : "binary")}
        />
        <span className="ml-2 text-sm font-medium">
          {viewMode === "hex" ? "Hex" : "Dec"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {registers.map((value, index) => (
          <div key={index} className="bg-neutral-700 p-2 rounded">
            x{index}: {value} |{" "}
            {formatRegisterValue(signExtend(value, 16), viewMode)}
          </div>
        ))}
      </div>
    </div>
  );
}
