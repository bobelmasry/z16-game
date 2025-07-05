import { Simulator } from "./simulator";
import { Command, EventCode, SimulatorState } from "./utils/types";
import type {
  WorkerEventData,
  WorkerEventResponse,
} from "./utils/types/worker";

// --- 1) Create all SharedArrayBuffers ---
const MEMORY_SIZE = 65536; // words
const REGISTERS_SIZE = 8; // x0–x7
const CONTROL_SLOTS = 2; // [ cmd, arg ]
const EVENT_SLOTS = 3; // [ code, arg0, arg1 ]

const sharedMemoryBuf = new SharedArrayBuffer(
  MEMORY_SIZE * Uint16Array.BYTES_PER_ELEMENT
);
const sharedRegistersBuf = new SharedArrayBuffer(
  REGISTERS_SIZE * Uint16Array.BYTES_PER_ELEMENT
);
const sharedPCBuf = new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT);
const sharedControlBuf = new SharedArrayBuffer(
  CONTROL_SLOTS * Int32Array.BYTES_PER_ELEMENT
);
const sharedEventBuf = new SharedArrayBuffer(
  EVENT_SLOTS * Int32Array.BYTES_PER_ELEMENT
);

// --- 2) Handshake: send buffers to UI once, then never postMessage again ---
self.postMessage({
  command: "init",
  payload: {
    sharedBuffer: sharedMemoryBuf,
    sharedRegistersBuffer: sharedRegistersBuf,
    sharedPCBuffer: sharedPCBuf,
    sharedControlBuffer: sharedControlBuf,
    sharedEventBuffer: sharedEventBuf,
  },
});

// --- 3) Wrap views around them ---
const memoryView = new Uint16Array(sharedMemoryBuf);
const registersView = new Uint16Array(sharedRegistersBuf);
const pcView = new Uint16Array(sharedPCBuf);
const controlView = new Int32Array(sharedControlBuf);
const eventView = new Int32Array(sharedEventBuf);

// --- 4) Enums for commands and events ---

// --- 5) Instantiate the simulator on those buffers ---
const simulator = new Simulator(
  sharedMemoryBuf,
  sharedRegistersBuf,
  sharedPCBuf
);

// --- 6) Wire up simulator events into the event buffer ---
simulator.on("ecall", (req) => {
  self.postMessage({
    command: "ecall",
    payload: req,
  } satisfies WorkerEventResponse);
});

simulator.on("exit", (ev) => {
  self.postMessage({
    command: "exit",
    payload: ev,
  } satisfies WorkerEventResponse);
});

// --- 7) Command‐loop: wait for UI to write `controlView[0]` != 0 ---
(async function commandLoop() {
  while (true) {
    // block until UI calls Atomics.notify(controlView, 0)
    Atomics.wait(controlView, 0, Command.NONE);

    const cmd = Atomics.load(controlView, 0);
    const arg = Atomics.load(controlView, 1);

    // clear for the next command
    Atomics.store(controlView, 0, Command.NONE);

    const startTS = () => {
      if (simulator.state === SimulatorState.Running) return;
      simulator.state = SimulatorState.Running;

      let tickDuration = 1000 / simulator.speed; // in ms

      while (simulator.state === SimulatorState.Running) {
        tickDuration = 1000 / simulator.speed; // recalculate in case speed changed
        const t0 = performance.now();
        if (!simulator.step()) break;
        while (performance.now() - t0 < tickDuration) {
          let leave = false;
          // _also_ check if UI has poked the control buffer:
          if (Atomics.load(controlView, 0) !== Command.NONE) {
            const newArg = Atomics.load(controlView, 1);
            switch (Atomics.load(controlView, 0)) {
              case Command.PAUSE:
                simulator.pause();
                leave = true;
                break;
              case Command.RESET:
                simulator.reset();
                leave = true;
                break;
              case Command.SET_SPEED:
                simulator.setSpeed(newArg);
                break;
              case Command.KEY_DOWN:
                simulator.keyDown(String.fromCharCode(newArg));
                break;
              case Command.KEY_UP:
                simulator.keyUp(String.fromCharCode(newArg));
                break;
            }
            // clear for the next command
            Atomics.store(controlView, 0, Command.NONE);
          }
          if (leave) break; // leave the inner loop to re-check state
        }
      }
    };

    switch (cmd) {
      case Command.LOAD:
        simulator.load();
        break;
      case Command.START:
        startTS();
        break;
      case Command.PAUSE:
        simulator.pause();
        break;
      case Command.STEP:
        simulator.step();
        break;
      case Command.RESET:
        simulator.reset();
        break;
      case Command.RESUME:
        if (simulator.state !== SimulatorState.Blocked) return; // Only resume if blocked
        simulator.pc += 2; // Move to the next instruction
        // if we were running, go back into the run loop;
        // otherwise just emit an update so the UI redraws
        if (simulator.prevState === SimulatorState.Running) {
          startTS();
        } else {
          simulator.setState(SimulatorState.Paused);
        }
        break;
      case Command.SET_SPEED:
        simulator.setSpeed(arg);
        break;
      case Command.KEY_DOWN:
        simulator.keyDown(String.fromCharCode(arg));
        break;
      case Command.KEY_UP:
        simulator.keyUp(String.fromCharCode(arg));
        break;
      // ignore unknown or NONE
    }
  }
})();
