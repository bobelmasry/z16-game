"use client";
import { useSimulatorStore } from "@/lib/store/simulator";

export default function GameDisplay() {
  const _ = useSimulatorStore((s) => s.registers);
  return <div className="h-[50rem] bg-black mb-4"></div>;
}
