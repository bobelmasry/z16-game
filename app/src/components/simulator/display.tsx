"use client";
import { useSimulatorStore } from "@/lib/store/simulator";

export default function GameDisplay() {
  const memory = useSimulatorStore((s) => s.memory);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400 font-mono">
        Display
      </h2>
      <div className="w-[640px] h-[480px]  retro-display"></div>
    </div>
  );
}
