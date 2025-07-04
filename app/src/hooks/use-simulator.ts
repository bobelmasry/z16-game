import { useEffect, useRef } from "react";
import { useSimulatorStore } from "@/lib/store/simulator";
import type { WorkerEventResponse } from "@/lib/utils/types/worker";
import { useOperatingSystemStore } from "@/lib/store/os";
import { ECALLService } from "@/lib/utils/types/instruction";

export let sharedMemory: Uint16Array;
export let sharedRegisters: Uint16Array;
export let sharedPC: Uint16Array;

export function useSimulator() {
  const setWorker = useSimulatorStore((s) => s.setWorker);
  const setTotalInstructions = useSimulatorStore((s) => s.setTotalInstructions);
  const handleECall = useOperatingSystemStore((s) => s.handleECall);
  const consolePrint = useOperatingSystemStore((s) => s.consolePrint);
  const rafRef = useRef<number>(null);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/worker.ts", import.meta.url));
    setWorker(worker);

    worker.addEventListener("message", (event) => {
      const data = event.data as WorkerEventResponse;
      switch (data.command) {
        case "init":
          console.log("TS happened");
          sharedMemory = new Uint16Array(data.payload.sharedBuffer);
          sharedRegisters = new Uint16Array(data.payload.sharedRegistersBuffer);
          sharedPC = new Uint16Array(data.payload.sharedPCBuffer);
          break;
        case "exit":
          setTotalInstructions(data.payload.totalInstructions);
          consolePrint([
            "Instructions executed: " + data.payload.totalInstructions,
          ]);
          break;
        case "ecall":
          handleECall(
            data.payload.service,
            data.payload.registers,
            data.payload.memory
          );
          break;
      }
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.length === 1) {
        worker.postMessage({
          command: "keyDown",
          payload: event.key,
        });
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.length === 1) {
        worker.postMessage({
          command: "keyUp",
          payload: event.key,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    function tick() {
      if (!sharedMemory || !sharedRegisters || !sharedPC) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const pc = new Uint16Array(sharedPC)[0];
      const regs = new Uint16Array(sharedRegisters);
      const memory = new Uint16Array(sharedMemory);

      useSimulatorStore.setState({
        pc,
        registers: regs,
        memory,
      });

      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      worker.terminate();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      cancelAnimationFrame(rafRef.current!);
    };
  }, []);
}
