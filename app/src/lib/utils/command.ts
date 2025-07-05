import { BUFS } from "@/hooks/use-simulator";
import type { Command } from "./types";

export function sendCommand(cmd: Command, arg = 0) {
  const control = new Int32Array(BUFS.control); // view as Int32Array for Atomics
  Atomics.store(control, 1, arg); // slot[1] = optional arg
  Atomics.store(control, 0, cmd); // slot[0] = command
  Atomics.notify(control, 0); // wake worker
}
