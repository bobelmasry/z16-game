// worker.ts

import { Simulator } from "./simulator";
import { Command, SimulatorState } from "./utils/types";
import type {
  WorkerEventData,
  WorkerEventResponse,
} from "./utils/types/worker";

// 1) set up and handshake
let BUFS: {
  memory: SharedArrayBuffer;
  registers: SharedArrayBuffer;
  pc: SharedArrayBuffer;
  control: SharedArrayBuffer;
  event: SharedArrayBuffer;
};
self.onmessage = (event) => {
  const data = event.data as WorkerEventData;
  if (data.command === "init") {
    BUFS = {
      memory: data.payload.memory,
      registers: data.payload.registers,
      pc: data.payload.pc,
      control: data.payload.control,
      event: data.payload.event,
    };
    main();
  }
};

function main() {
  // 2) create our views
  const controlView = new Int32Array(BUFS.control);

  // 3) simulator
  const sim = new Simulator(BUFS.memory, BUFS.registers, BUFS.pc);

  // 4) wire sim events back to main
  sim.on("ecall", (payload) => postMessage({ command: "ecall", payload }));
  sim.on("exit", (payload) => {
    postMessage({ command: "exit", payload });
  });

  // 5) an async generator that yields { cmd, arg } whenever controlView[0] changes
  async function* commands() {
    while (true) {
      Atomics.wait(controlView, 0, Command.NONE);
      const cmd = Atomics.load(controlView, 0) as Command;
      const arg = Atomics.load(controlView, 1);
      Atomics.store(controlView, 0, Command.NONE);
      yield { cmd, arg };
    }
  }

  // 6) handlers map
  const handlers: Record<Command, (arg: number) => void> = {
    [Command.LOAD]: () => sim.load(),
    [Command.START]: () => runLoop(),
    [Command.PAUSE]: () => sim.pause(),
    [Command.STEP]: () => sim.step(),
    [Command.RESET]: () => sim.reset(),
    [Command.RESUME]: (arg) => {
      /*…handle resume…*/
    },
    [Command.SET_SPEED]: (arg) => sim.setSpeed(arg),
    [Command.KEY_DOWN]: (arg) => sim.keyDown(String.fromCharCode(arg)),
    [Command.KEY_UP]: (arg) => sim.keyUp(String.fromCharCode(arg)),
    [Command.NONE]: (_) => {},
  };

  // 7) main loop
  (async () => {
    for await (const { cmd, arg } of commands()) {
      const h = handlers[cmd];
      if (h) h(arg);
    }
  })();

  // 8) the “run at speed” loop extracted into its own async fn
  async function runLoop() {
    if (sim.state === SimulatorState.Running) return;
    sim.state = SimulatorState.Running;

    while (sim.state === SimulatorState.Running) {
      const interval = 1000 / sim.speed;
      const t0 = performance.now();
      if (!sim.step()) break;

      // busy-wait—but still check for incoming control commands
      while (performance.now() - t0 < interval) {
        const nxt = Atomics.load(controlView, 0) as Command;
        if (nxt !== Command.NONE) {
          const arg = Atomics.load(controlView, 1);
          Atomics.store(controlView, 0, Command.NONE);
          if (nxt === Command.PAUSE || nxt === Command.RESET) {
            handlers[nxt](arg);
            return; // break out of runLoop
          }
          handlers[nxt](arg); // speed, keys…
        }
      }
    }
  }
}
