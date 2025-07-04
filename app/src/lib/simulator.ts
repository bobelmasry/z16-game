import { signExtend } from "./utils/binary";
import {
  Instruction,
  Opcode,
  RTypeInstruction,
  ITypeInstruction,
  BTypeInstruction,
  STypeInstruction,
  LTypeInstruction,
  JTypeInstruction,
  UTypeInstruction,
  ECALLService,
} from "./utils/types/instruction";
import { EventEmitter } from "./utils/event-emitter";
import { generateInstructions } from "./utils/decoder";
import type { SimulatorState } from "./utils/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface SimulatorSnapshot {
  pc: number;
  registers: Uint16Array;
  state: SimulatorState;
  totalInstructions: number;
}

export interface ECallRequest {
  service: ECALLService;
  registers: Uint16Array;
  memory: Uint16Array;
}

interface SimulatorEvents {
  ecall: [ECallRequest];
  update: [SimulatorSnapshot];
  exit: [];
}

export class Simulator extends EventEmitter<SimulatorEvents> {
  private instructions: Instruction[] = []; // Array of instructions to execute
  private memory: Uint16Array; // 64KB memory
  private registers: Uint16Array = new Uint16Array(8); // 8 registers (x0 to x7) (16-bit each)
  private pc: number = 0; // Program Counter starts at 0
  private speed: number = 3; // Default frequency (3 Hz)
  private lastUpdateTs = 0;
  private readonly minFrameMs = 1000 / 60; // ~16.7ms
  private state: SimulatorState = "paused";
  private prevState: SimulatorState = "paused";
  private totalInstructions: number = 0; // Total instructions executed
  private pressedKeys: Set<string> = new Set(); // Track pressed keys for ecall
  // Timing control
  private lastInstructionTime = 0;
  private instructionInterval = 1000 / 3; // ms per instruction (default 3 Hz)
  private animationFrameId: number | null = null;
  private accumulatedTime = 0;

  constructor(sharedBuf: SharedArrayBuffer) {
    super();
    this.memory = new Uint16Array(sharedBuf);
  }

  load(memory: Uint16Array): void {
    this.reset();
    this.memory.set(memory);
    this.instructions = generateInstructions(this.memory);
  }

  setSpeed(frequency: number): void {
    this.speed = frequency;
  }

  updateRegisters(registers: Uint16Array): void {
    this.registers.set(registers);
    this.emit("update", this.getState());
  }

  getState(): SimulatorSnapshot {
    return {
      pc: this.pc,
      registers: this.registers,
      state: this.state,
      totalInstructions: this.totalInstructions,
    };
  }

  maybeEmitUpdate() {
    const now = performance.now();
    if (now - this.lastUpdateTs >= this.minFrameMs) {
      this.lastUpdateTs = now;
      this.emit("update", this.getState());
    }
  }

  keyDown(key: string): void {
    if (this.pressedKeys.has(key)) return; // Ignore repeated key presses
    this.pressedKeys.add(key);
  }

  keyUp(key: string): void {
    this.pressedKeys.delete(key);
  }

  reset(): void {
    this.pc = 0;
    this.registers.fill(0);
    this.state = "paused";
    this.totalInstructions = 0;
    this.accumulatedTime = 0;
    this.lastInstructionTime = 0;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.emit("update", this.getState());
  }

  pause(): void {
    if (this.state === "running") {
      this.state = "paused";
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    this.emit("update", this.getState());
  }

  step(forceUpdate = false): boolean {
    this.executeInstruction();

    if (forceUpdate) this.emit("update", this.getState());
    else this.maybeEmitUpdate();

    if (this.state === "halted" || this.state === "blocked") {
      this.emit("exit");

      return false; // Step execution ended
    }
    return true;
  }

  start(): void {
    if (this.state === "running") return;
    this.state = "running";
    this.lastInstructionTime = performance.now();
    this.accumulatedTime = 0;

    // Use different strategies based on speed
    if (this.speed > 60) {
      // For high speeds, use a tight loop with periodic yielding
      this.runHighSpeed();
    } else {
      // For lower speeds, use requestAnimationFrame
      this.runNormalSpeed();
    }
  }

  private runNormalSpeed(): void {
    const frame = (currentTime: number) => {
      this.instructionInterval = 1000 / this.speed; // Update interval based on speed
      if (this.state !== "running") return;

      const deltaTime = currentTime - this.lastInstructionTime;
      this.lastInstructionTime = currentTime;
      this.accumulatedTime += deltaTime;

      // Execute instructions based on accumulated time
      const instructionsToExecute = Math.floor(
        this.accumulatedTime / this.instructionInterval
      );
      this.accumulatedTime -= instructionsToExecute * this.instructionInterval;

      for (let i = 0; i < instructionsToExecute; i++) {
        if (!this.step()) {
          return; // Simulation ended
        }
        if (this.state !== "running") {
          return; // State changed (blocked, paused, etc.)
        }
      }

      this.animationFrameId = requestAnimationFrame(frame);
    };

    this.animationFrameId = requestAnimationFrame(frame);
  }

  private async runHighSpeed(): Promise<void> {
    const instructionsPerBatch = Math.min(Math.floor(this.speed / 60), 1000);
    const batchInterval = (instructionsPerBatch / this.speed) * 1000;

    while (this.state === "running") {
      const batchStart = performance.now();

      for (let i = 0; i < instructionsPerBatch; i++) {
        if (!this.step()) {
          return; // Simulation ended
        }
        if (this.state !== "running") {
          return; // State changed
        }
      }

      const batchDuration = performance.now() - batchStart;
      const sleepTime = Math.max(0, batchInterval - batchDuration);

      if (sleepTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      } else {
        // Yield to prevent blocking
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  resume(): void {
    if (this.state !== "blocked") return; // Only resume if blocked
    this.pc += 2; // Move to the next instruction
    // if we were running, go back into the run loop;
    // otherwise just emit an update so the UI redraws
    if (this.prevState === "running") {
      this.start();
    } else {
      this.state = "paused";
      this.emit("update", this.getState());
    }
  }

  executeInstruction(): void {
    this.totalInstructions++;
    // Check bounds of PC
    if (this.pc < 0 || this.pc >= this.instructions.length) {
      this.state = "halted";
      return;
    }

    const instructionLocation = Math.floor(this.pc / 2);
    const instruction = this.instructions.at(instructionLocation);
    if (!instruction) {
      this.state = "halted";
      return;
    }

    let incrementPC = true;

    // Optimized helpers with reduced overhead
    const getByte = (addr: number) => {
      const wordAddr = Math.floor(addr / 2);
      const word = this.memory[wordAddr] || 0;
      return addr % 2 === 0 ? word & 0xff : (word >> 8) & 0xff;
    };
    const getWord = (addr: number) => {
      const wordAddr = Math.floor(addr / 2);
      return this.memory[wordAddr] || 0;
    };
    const setByte = (addr: number, value: number) => {
      const wordAddr = Math.floor(addr / 2);
      const word = this.memory[wordAddr] || 0;
      if (addr % 2 === 0) {
        this.memory[wordAddr] = (word & 0xff00) | (value & 0xff);
      } else {
        this.memory[wordAddr] = (word & 0x00ff) | ((value & 0xff) << 8);
      }
    };
    const setWord = (addr: number, value: number) => {
      const wordAddr = Math.floor(addr / 2);
      if (wordAddr < this.memory.length) {
        this.memory[wordAddr] = value & 0xffff;
      }
    };

    switch (instruction.opcode) {
      case Opcode.Rtype: {
        const inst = instruction as RTypeInstruction;
        const { funct3, funct4, rd, rs2 } = inst;
        switch (funct3) {
          case 0:
            switch (funct4) {
              case 0: // ADD
                this.registers[rd] += this.registers[rs2];
                break;
              case 1: // SUB
                this.registers[rd] -= this.registers[rs2];
                break;
              case 11: // JR
                this.pc = this.registers[rd];
                incrementPC = false;
                break;
              case 12: {
                // JALR
                const nextPC = this.pc + 2;
                this.pc = this.registers[rd];
                this.registers[rd] = nextPC;
                incrementPC = false;
                break;
              }
              default:
              // Unknown R-type instruction - skip silently for performance
            }
            break;
          case 1: // SLT
            this.registers[rd] =
              this.registers[rd] < this.registers[rs2] ? 1 : 0;
            break;
          case 2: // SLTU
            this.registers[rd] =
              this.registers[rd] >>> 0 < this.registers[rs2] >>> 0 ? 1 : 0; // >>> 0 forces unsigned comparison
            break;
          case 3: // Shift operations
            switch (funct4) {
              case 4: // SLL
                this.registers[rd] <<= this.registers[rs2];
                break;
              case 5: // SRL
                this.registers[rd] >>>= this.registers[rs2];
                break;
              case 6: // SRA
                this.registers[rd] >>= this.registers[rs2];
                break;
              default:
              // Unknown shift instruction - skip silently for performance
            }
            break;
          // Bitwise operations
          case 4: // OR
            this.registers[rd] |= this.registers[rs2];
            break;
          case 5: // AND
            this.registers[rd] &= this.registers[rs2];
            break;
          case 6: // XOR
            this.registers[rd] ^= this.registers[rs2];
            break;
          case 7: // MV
            this.registers[rd] = this.registers[rs2];
            break;
          default:
          // Unknown R-type - skip silently for performance
        }
        break;
      }
      case Opcode.Itype: {
        const inst = instruction as ITypeInstruction;
        const { funct3, rd, imm: rawImm } = inst;
        // sign-extend 7-bit
        let imm = signExtend(rawImm, 7);

        switch (funct3) {
          case 0:
            this.registers[rd] += imm;
            break;
          case 1:
            this.registers[rd] = (this.registers[rd] << 16) >> 16 < imm ? 1 : 0;
            break;
          case 2:
            this.registers[rd] = this.registers[rd] < imm ? 1 : 0;
            break;
          case 3:
            const shamt = imm & 0x0f;
            const mode = (imm >> 4) & 0b111;
            if (mode === 1) this.registers[rd] <<= shamt; // SLLI
            else if (mode === 2) this.registers[rd] >>>= shamt; // SRLI
            else if (mode === 4) this.registers[rd] >>= shamt; // SRAI
            else {
              // Unknown shift instruction - skip silently for performance
            }
            break;
          case 4: // ORI
            this.registers[rd] |= imm;
            break;
          case 5: // ANDI
            this.registers[rd] &= imm;
            break;
          case 6: // XORI
            this.registers[rd] ^= imm;
            break;
          case 7: // LI
            this.registers[rd] = imm;
            break;
          default:
          // Unknown I-type - skip silently for performance
        }
        break;
      }
      case Opcode.Btype: {
        const inst = instruction as BTypeInstruction;
        const { funct3, rd: rs1, rs2, imm: raw4 } = inst;
        let imm = signExtend(raw4, 4);
        let take = false;

        switch (funct3) {
          case 0: // BEQ
            take = this.registers[rs1] === this.registers[rs2];
            break;
          case 1: // BNE
            take = this.registers[rs1] !== this.registers[rs2];
            break;
          case 2: // BZ
            take = this.registers[rs1] === 0;
            break;
          case 3: // BNZ
            take = this.registers[rs1] !== 0;
            break;
          case 4: // BLT
            take = this.registers[rs1] < this.registers[rs2];
            break;
          case 5: // BGE
            take = this.registers[rs1] >= this.registers[rs2];
            break;
          case 6: // BLTU
            take = this.registers[rs1] >>> 0 < this.registers[rs2] >>> 0;
            break;
          case 7: // BGEU
            take = this.registers[rs1] >>> 0 >= this.registers[rs2] >>> 0;
            break;
          default:
          // Unknown branch instruction - skip silently for performance
        }

        if (take) {
          this.pc += imm * 2;
          incrementPC = false;
        }
        break;
      }
      case Opcode.Stype: {
        const inst = instruction as STypeInstruction;
        const { funct3, rd: rs1, rs2, imm: raw4 } = inst;
        let imm = signExtend(raw4, 4);
        const addr = this.registers[rs2] + imm;

        switch (funct3) {
          case 0: // Store Byte
            setByte(addr, this.registers[rs1]);
            break;
          case 1: // Store Word
            setWord(addr, this.registers[rs1]);
            break;
          default:
          // Unknown store - skip silently for performance
        }
        break;
      }
      case Opcode.Ltype: {
        const inst = instruction as LTypeInstruction;
        const { funct3, rd, rs2, imm: raw4 } = inst;
        let imm = signExtend(raw4, 4);
        const addr = this.registers[rs2] + imm;
        switch (funct3) {
          case 0: // LB
            this.registers[rd] = (getByte(addr) << 24) >> 24;
            break;
          case 1: // LW
            this.registers[rd] = getWord(addr);
            break;
          case 4: // LBU
            this.registers[rd] = getByte(addr) & 0xff;
            break;
          default:
        }
        break;
      }
      case Opcode.Jtype: {
        const inst = instruction as JTypeInstruction;
        const { rd, imm: rawImm, flag } = inst;
        let imm = signExtend(rawImm, 9);
        if (flag === 0) {
          this.pc += imm * 2;
        } else {
          const nextPC = this.pc + 2;
          this.pc += imm * 2;
          this.registers[rd] = nextPC;
        }
        incrementPC = false;
        break;
      }
      case Opcode.Utype: {
        const inst = instruction as UTypeInstruction;
        const { rd, imm: rawImm, flag } = inst;
        // imm from bits[15:7], shift left 7
        const val = rawImm << 7;
        if (flag === 0) {
          this.registers[rd] = val;
        } else {
          this.registers[rd] = this.pc + val;
        }
        break;
      }
      case Opcode.ECall: {
        this.emit("ecall", {
          service: instruction.service,
          registers: this.registers,
          memory: this.memory,
        });
        switch (instruction.service) {
          case ECALLService.ReadString:
          case ECALLService.ReadInteger:
            // These services block execution until input is provided
            this.prevState = this.state; // Save previous state before blocking
            this.state = "blocked";
            return;
          case ECALLService.ReadKeyboard: {
            const keyCode = this.registers[6]; // a0
            const key = String.fromCharCode(keyCode);
            if (this.pressedKeys.has(key)) {
              this.registers[7] = 1; // Echo back the key code
            } else {
              this.registers[7] = 0; // No key pressed
            }
            break;
          }
          case ECALLService.ProgramExit:
            this.state = "halted";
            this.emit("update", this.getState());
            return;
        }
        break;
      }
      default:
        break;
    }
    if (incrementPC) {
      this.pc += 2;
    }
  }
}
