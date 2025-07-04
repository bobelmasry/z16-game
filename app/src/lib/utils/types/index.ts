export enum SimulatorState {
  Paused = 0,
  Running = 1,
  Halted = 2,
  Blocked = 3,
}

export enum Command {
  NONE = 0,
  LOAD = 1,
  START = 2,
  PAUSE = 3,
  STEP = 4,
  RESET = 5,
  RESUME = 6,
  SET_SPEED = 7,
  KEY_DOWN = 8,
  KEY_UP = 9,
}

export enum EventCode {
  NONE = 0,
  ECALL = 1,
  EXIT = 2,
}
