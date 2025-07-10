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
import { SimulatorState } from "./utils/types";

export interface ECallRequest {
  service: ECALLService;
  registers: Uint16Array;
  memory: Uint16Array;
}

export interface ExitEvent {
  code: number;
  totalInstructions: number;
}

interface SimulatorEvents {
  update: [SimulatorState];
  ecall: [ECallRequest];
  exit: [ExitEvent];
}

export class Simulator extends EventEmitter<SimulatorEvents> {
  private instructions: Instruction[] = []; // Array of instructions to execute
  private memory: Uint16Array; // 64KB memory
  private originalMemory?: Uint16Array;
  private registers: Uint16Array = new Uint16Array(8); // 8 registers (x0 to x7) (16-bit each)
  private _pc: Uint16Array = new Uint16Array(1); // Program Counter starts at 0
  private totalInstructions: number = 0; // Total instructions executed
  private pressedKeys: Set<string> = new Set(); // Track pressed keys for ecall
  private _state: Uint16Array = new Uint16Array(1); // Shared state buffer
  speed: number = 3; // Default frequency (3 Hz)
  prevState: SimulatorState = SimulatorState.Paused;

  constructor(
    sharedMemoryBuf: SharedArrayBuffer,
    sharedRegistersBuf: SharedArrayBuffer,
    sharedPCBuf: SharedArrayBuffer,
    sharedStateBuf: SharedArrayBuffer
  ) {
    super();
    this.memory = new Uint16Array(sharedMemoryBuf);
    this.registers = new Uint16Array(sharedRegistersBuf);
    this._pc = new Uint16Array(sharedPCBuf); // Initialize PC from shared buffer
    this._state = new Uint16Array(sharedStateBuf); // Initialize state from shared buffer
  }

  get state(): SimulatorState {
    return this._state[0];
  }

  set state(value: SimulatorState) {
    this._state[0] = value;
  }

  get pc(): number {
    return this._pc[0];
  }
  set pc(value: number) {
    this._pc[0] = value;
  }

  load(): void {
    this.originalMemory = new Uint16Array(this.memory); // Store original memory for reset
    this.instructions = generateInstructions(this.memory);
  }

  setSpeed(frequency: number): void {
    this.speed = frequency;
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
    this.state = SimulatorState.Paused;
    this.totalInstructions = 0;
    if (this.originalMemory) this.memory.set(this.originalMemory); // Restore original memory
  }

  pause(): void {
    if (this.state === SimulatorState.Running) {
      this.state = SimulatorState.Paused;
    }
  }

  step(): boolean {
    this.executeInstruction();

    if (
      this.state === SimulatorState.Halted ||
      this.state === SimulatorState.Blocked
    ) {
      return false; // Step execution ended
    }
    return true;
  }

  private executeInstruction(): void {
    this.totalInstructions++;
    // Check bounds of PC
    if (this.pc < 0 || this.pc >= this.instructions.length) {
      this.state = SimulatorState.Halted;
      return;
    }

    const instructionLocation = Math.floor(this.pc / 2);
    const instruction = this.instructions.at(instructionLocation);
    if (!instruction) {
      this.state = SimulatorState.Halted;
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
      if (addr % 2 == 0) {
        const wordAddr = Math.floor(addr / 2);
        return this.memory[wordAddr] || 0;
      } else {
        const wordAddr = Math.floor(addr / 2);
        const firstByte = (this.memory[wordAddr] || 0) >> 8; // High byte of first word
        const secondByte = (this.memory[wordAddr + 1] || 0) & 0xff; // Low byte of second word
        return firstByte | (secondByte << 8);
      }
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
      if (addr % 2 == 0) {
        const wordAddr = Math.floor(addr / 2);
        this.memory[wordAddr] = value & 0xffff;
      } else {
        const wordAddr = Math.floor(addr / 2);
        const firstByte = value & 0xff; // Low byte goes to high byte of first word
        const secondByte = (value >> 8) & 0xff; // High byte goes to low byte of second word
        this.memory[wordAddr] =
          (this.memory[wordAddr] & 0x00ff) | (firstByte << 8);
        this.memory[wordAddr + 1] =
          (this.memory[wordAddr + 1] & 0xff00) | secondByte;
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
          // take a copy of the memory and registers
          registers: new Uint16Array(this.registers),
          memory: new Uint16Array(this.memory),
        });
        switch (instruction.service) {
          case ECALLService.ReadString:
          case ECALLService.ReadInteger:
            // These services block execution until input is provided
            this.prevState = this.state; // Save previous state before blocking
            this.state = SimulatorState.Blocked;
            return;
          case ECALLService.ReadKeyboard: {
            const keyCode = this.registers[6]; // a0
            const key = String.fromCharCode(keyCode);
            if (this.pressedKeys.has(key)) {
              this.registers[6] = 1; // Echo back the key code
            } else {
              this.registers[6] = 0; // No key pressed
            }
            break;
          }
          case ECALLService.ProgramExit:
            this.state = SimulatorState.Halted;
            this.emit("exit", {
              code: this.registers[6],
              totalInstructions: this.totalInstructions,
            });
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