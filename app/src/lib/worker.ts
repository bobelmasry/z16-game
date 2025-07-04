import { Simulator } from "./simulator";
import type {
  WorkerEventData,
  WorkerEventResponse,
} from "./utils/types/worker";

const MEMORY_SIZE = 65536; // words
const BYTES_PER_WORD = 2;
const sharedMemoryBuf = new SharedArrayBuffer(MEMORY_SIZE * BYTES_PER_WORD);

const simulator = new Simulator(sharedMemoryBuf);

(function () {
  // Initialize the simulator with the shared buffer, which allows
  // the main thread and worker to share memory efficiently.
  self.postMessage({
    command: "init",
    payload: {
      sharedBuffer: sharedMemoryBuf,
    },
  } satisfies WorkerEventResponse);

  self.addEventListener("message", (event) => {
    const data: WorkerEventData = event.data;

    switch (data.command) {
      case "load":
        simulator.load(data.payload);
        break;
      case "start":
        simulator.start();
        break;
      case "pause":
        simulator.pause();
        break;
      case "step":
        simulator.step(true);
        break;
      case "reset":
        simulator.reset();
        break;
      case "resume":
        simulator.resume();
        break;
      case "setSpeed":
        simulator.setSpeed(data.payload);
        break;
      case "updateRegisters":
        simulator.updateRegisters(data.payload);
        break;
      case "keyDown":
        simulator.keyDown(data.payload);
        break;
      case "keyUp":
        simulator.keyUp(data.payload);
        break;
      default:
        console.warn("Unknown command:", data);
    }
  });

  simulator.on("ecall", (request) => {
    self.postMessage({
      command: "ecall",
      payload: request,
    } satisfies WorkerEventResponse);
  });
})();
