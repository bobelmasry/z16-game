"use client";
import { useSimulatorStore } from "@/lib/store/simulator";

export default function GameDisplay() {
  const _ = useSimulatorStore((s) => s.registers);
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400 font-mono">
        Display
      </h2>
      <div className="h-[512px] w-[512px] retro-display"></div>
    </div>
  );
}
