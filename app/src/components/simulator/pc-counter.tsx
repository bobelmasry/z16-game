"use client";
import { useSimulatorStore } from "@/lib/store/simulator";

export default function PcCounter() {
  const PC = useSimulatorStore((s) => s.pc);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">PC</h2>
      <div className="bg-neutral-700 p-2 rounded">{PC}</div>
    </div>
  );
}
