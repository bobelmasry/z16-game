import { Simulator } from "./simulator";
import type {
  WorkerEventData,
  WorkerEventResponse,
} from "./utils/types/worker";

const MEMORY_SIZE = 65536; // words
const REGISTERS_SIZE = 8; // 8 registers, each 16 bits
const sharedMemoryBuf = new SharedArrayBuffer(
  MEMORY_SIZE * Uint16Array.BYTES_PER_ELEMENT
);
const sharedRegistersBuf = new SharedArrayBuffer(
  REGISTERS_SIZE * Uint16Array.BYTES_PER_ELEMENT
);
const sharedPCBuf = new SharedArrayBuffer(Uint16Array.BYTES_PER_ELEMENT);

const simulator = new Simulator(
  sharedMemoryBuf,
  sharedRegistersBuf,
  sharedPCBuf
);

(function () {
  // Initialize the simulator with the shared buffer, which allows
  // the main thread and worker to share memory efficiently.
  self.postMessage({
    command: "init",
    payload: {
      sharedBuffer: sharedMemoryBuf,
      sharedRegistersBuffer: sharedRegistersBuf,
      sharedPCBuffer: sharedPCBuf,
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
        simulator.step();
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

  simulator.on("exit", (event) => {
    self.postMessage({
      command: "exit",
      payload: event,
    } satisfies WorkerEventResponse);
  });

  simulator.on("update", (state) => {
    self.postMessage({
      command: "update",
      payload: state,
    } satisfies WorkerEventResponse);
  });
})();
