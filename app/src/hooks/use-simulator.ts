import { useEffect, useRef } from "react";
import { useSimulatorStore } from "@/lib/store/simulator";
import type {
  WorkerEventData,
  WorkerEventResponse,
} from "@/lib/utils/types/worker";
import { useOperatingSystemStore } from "@/lib/store/os";
import { ECALLService } from "@/lib/utils/types/instruction";
import { Command, SimulatorState } from "@/lib/utils/types";
import { sendCommand } from "@/lib/utils/command";

export const BUFS = {
  memory: new SharedArrayBuffer(65536 * Uint16Array.BYTES_PER_ELEMENT),
  registers: new SharedArrayBuffer(8 * Uint16Array.BYTES_PER_ELEMENT),
  pc: new SharedArrayBuffer(1 * Uint16Array.BYTES_PER_ELEMENT),
  control: new SharedArrayBuffer(2 * Int32Array.BYTES_PER_ELEMENT),
  event: new SharedArrayBuffer(3 * Int32Array.BYTES_PER_ELEMENT),
};

export function useSimulator() {
  const setTotalInstructions = useSimulatorStore((s) => s.setTotalInstructions);
  const setState = useSimulatorStore((s) => s.setState);
  const handleECall = useOperatingSystemStore((s) => s.handleECall);
  const consolePrint = useOperatingSystemStore((s) => s.consolePrint);

  useEffect(() => {
    const worker = new Worker(new URL("../lib/worker.ts", import.meta.url));

    worker.postMessage({
      command: "init",
      payload: {
        memory: BUFS.memory,
        registers: BUFS.registers,
        pc: BUFS.pc,
        control: BUFS.control,
        event: BUFS.event,
      },
    } satisfies WorkerEventData);

    worker.addEventListener("message", (event) => {
      const data = event.data as WorkerEventResponse;
      switch (data.command) {
        case "exit":
          setState(SimulatorState.Halted);
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
        sendCommand(Command.KEY_DOWN, event.key.charCodeAt(0));
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key.length === 1) {
        sendCommand(Command.KEY_UP, event.key.charCodeAt(0));
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
