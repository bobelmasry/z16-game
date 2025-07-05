"use client";
import { BUFS } from "@/hooks/use-simulator";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useEffect, useRef } from "react";

export default function PcCounter() {
  // Refs for each register's text span
  const spanRef = useRef<HTMLSpanElement>(null);

  // Imperative update loop using requestAnimationFrame
  useEffect(() => {
    const view = new Uint16Array(BUFS.pc);
    let rafId: number;
    const update = () => {
      if (spanRef.current) {
        spanRef.current.textContent = view[0].toString();
      }
      rafId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400">PC</h2>
      <div className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded font-mono">
        <span className="text-green-400 retro-terminal-text" ref={spanRef}>
          {0}
        </span>
      </div>
    </div>
  );
}
