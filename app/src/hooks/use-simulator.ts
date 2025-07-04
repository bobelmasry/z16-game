import { useEffect } from "react";
import { useSimulatorStore } from "@/lib/store/simulator";
import type { WorkerEventResponse } from "@/lib/utils/types/worker";
import { useOperatingSystemStore } from "@/lib/store/os";

export let sharedMemory: Uint16Array;

export function useSimulator() {
  const setWorker = useSimulatorStore((s) => s.setWorker);
  const saveSnapshot = useSimulatorStore((s) => s.saveSnapshot);
  const handleECall = useOperatingSystemStore((s) => s.handleECall);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/worker.ts", import.meta.url));
    setWorker(worker);

    worker.addEventListener("message", (event) => {
      const data = event.data as WorkerEventResponse;
      switch (data.command) {
        case "init":
          sharedMemory = new Uint16Array(data.payload.sharedBuffer);
          break;
        case "update":
          saveSnapshot(data.payload);
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

    return () => {
      worker.terminate();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}
