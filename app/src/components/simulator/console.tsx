"use client";
import { useEffect, useRef } from "react";
import { useOperatingSystemStore } from "@/lib/store/os";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShallow } from "zustand/shallow";

export default function Console() {
  const { consoleLog, consoleAppend, pendingECall, resolveECall } =
    useOperatingSystemStore(
      useShallow(
        ({ consoleLog, consoleAppend, pendingECall, resolveECall }) => ({
          consoleAppend,
          consoleLog,
          pendingECall,
          resolveECall,
        })
      )
    );

  const bottomRef = useRef<HTMLDivElement>(null);

  // Whenever consoleLog changes, scroll the "bottomRef" into view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLog]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400 font-mono">
        Console
      </h2>
      <ScrollArea className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded h-64 overflow-y-auto font-mono">
        {consoleLog.map((msg, idx) => (
          <p
            key={idx}
            className="whitespace-pre-wrap text-green-400 retro-terminal-text leading-relaxed relative z-10"
          >
            {msg}
          </p>
        ))}
        {/* invisible sentinel at the end */}
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="mt-2">
        <input
          type="text"
          placeholder="> Enter input..."
          className={`retro-terminal-input w-full p-2 rounded border-2 bg-black text-green-400 placeholder-green-600/60 focus:outline-none font-mono relative z-10 ${
            pendingECall
              ? "border-green-400 ring-2 ring-green-400/50 shadow-lg shadow-green-400/20"
              : "border-green-500/50"
          }`}
          style={{ caretColor: "#4ade80" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.currentTarget;
              consoleAppend(input.value + "\n");
              resolveECall(input.value);
              input.value = "";
            }
          }}
          autoFocus
        />
      </div>
    </div>
  );
}
