"use client";
import { useSimulatorStore } from "@/lib/store/simulator";

export default function PcCounter() {
  const PC = useSimulatorStore((s) => s.pc);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400">PC</h2>
      <div className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded font-mono">
        <span className="text-green-400 retro-terminal-text">{PC}</span>
      </div>
    </div>
  );
}
