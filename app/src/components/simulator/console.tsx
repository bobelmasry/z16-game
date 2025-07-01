"use client";
import { useEffect, useRef } from "react";
import { useOperatingSystemStore } from "@/lib/store/os";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useShallow } from "zustand/shallow";

export default function Console() {
  const { consoleLog, pendingECall, resolveECall } = useOperatingSystemStore(
    useShallow(({ consoleLog, pendingECall, resolveECall }) => ({
      consoleLog,
      pendingECall,
      resolveECall,
    }))
  );

  const bottomRef = useRef<HTMLDivElement>(null);

  // Whenever consoleLog changes, scroll the "bottomRef" into view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLog]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Console</h2>
      <ScrollArea className="bg-neutral-700 p-2 rounded h-64 overflow-y-auto">
        {consoleLog.map((msg, idx) => (
          <p key={idx}>{msg}</p>
        ))}
        {/* invisible sentinel at the end */}
        <div ref={bottomRef} />
      </ScrollArea>
      <div className="mt-2">
        <input
          type="text"
          placeholder="Enter input..."
          className={`w-full p-2 rounded border-2 bg-neutral-800 text-white placeholder-gray-400 focus:outline-none ${
            pendingECall
              ? "border-yellow-400 ring-2 ring-yellow-400/50"
              : "border-neutral-600"
          }`}
          style={{ caretColor: "white" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const input = e.currentTarget;
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
