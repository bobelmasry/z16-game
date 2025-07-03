import { signExtend } from "./binary";
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
} from "./decoder";

export interface ExecutionState {
  registers: number[];
  memory: Uint16Array<ArrayBuffer>;
  pc: number;
}

export function executeInstruction(
  instruction: Instruction,
  state: ExecutionState
): ExecutionState {
  let { registers, memory, pc } = state;
  let incrementPC = true;
  let bit16_ones = 0xffff;
  // Optimized helpers with reduced overhead
  const getByte = (addr: number) => {
    const wordAddr = Math.floor(addr / 2);
    const word = memory[wordAddr] || 0;
    return addr % 2 === 0 ? word & 0xff : (word >> 8) & 0xff;
  };
  const getWord = (addr: number) => {
    const wordAddr = Math.floor(addr / 2);
    return memory[wordAddr] || 0;
  };
  const setByte = (addr: number, value: number) => {
    const wordAddr = Math.floor(addr / 2);
    const word = memory[wordAddr] || 0;
    if (addr % 2 === 0) {
      memory[wordAddr] = (word & 0xff00) | (value & 0xff);
    } else {
      memory[wordAddr] = (word & 0x00ff) | ((value & 0xff) << 8);
    }
  };
  const setWord = (addr: number, value: number) => {
    const wordAddr = Math.floor(addr / 2);
    if (wordAddr < memory.length) {
      memory[wordAddr] = value & 0xffff;
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
              registers[rd] += registers[rs2];
              break;
            case 1: // SUB
              registers[rd] -= registers[rs2];
              break;
            case 11: // JR
              pc = registers[rd];
              incrementPC = false;
              break;
            case 12: {
              // JALR
              const nextPC = pc + 2;
              pc = registers[rd];
              registers[rd] = nextPC;
              incrementPC = false;
              break;
            }
            default:
            // Unknown R-type instruction - skip silently for performance
          }
          break;
        case 1: // SLT
          registers[rd] = registers[rd] < registers[rs2] ? 1 : 0;
          break;
        case 2: // SLTU
          registers[rd] = registers[rd] >>> 0 < registers[rs2] >>> 0 ? 1 : 0; // >>> 0 forces unsigned comparison
          break;
        case 3: // Shift operations
          switch (funct4) {
            case 4: // SLL
              registers[rd] <<= registers[rs2];
              break;
            case 5: // SRL
              bit16_ones >>>= registers[rs2];
              registers[rd] >>>= registers[rs2];
              registers[rd] &= bit16_ones;
              bit16_ones = 0xffff;
              break;
            case 6: // SRA
              registers[rd] >>= registers[rs2];
              break;
            default:
            // Unknown shift instruction - skip silently for performance
          }
          break;
        // Bitwise operations
        case 4: // OR
          registers[rd] |= registers[rs2];
          break;
        case 5: // AND
          registers[rd] &= registers[rs2];
          break;
        case 6: // XOR
          registers[rd] ^= registers[rs2];
          break;
        case 7: // MV
          registers[rd] = registers[rs2];
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
          registers[rd] += imm;
          break;
        case 1:
          registers[rd] = (registers[rd] << 16) >> 16 < imm ? 1 : 0;
          break;
        case 2:
          registers[rd] = registers[rd] < imm ? 1 : 0;
          break;
        case 3:
          const shamt = imm & 0x0f;
          const mode = (imm >> 4) & 0b111;
          if (mode === 1) registers[rd] <<= shamt; // SLLI
          else if (mode === 2) {
            bit16_ones >>>= shamt;
            registers[rd] >>>= shamt;
            registers[rd] &= bit16_ones;
            bit16_ones = 0xffff;

          } // SRLI
          else if (mode === 4) registers[rd] >>= shamt; // SRAI
          else {
            // Unknown shift instruction - skip silently for performance
          }
          break;
        case 4: // ORI
          registers[rd] |= imm;
          break;
        case 5: // ANDI
          registers[rd] &= imm;
          break;
        case 6: // XORI
          registers[rd] ^= imm;
          break;
        case 7: // LI
          registers[rd] = imm;
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
          take = registers[rs1] === registers[rs2];
          break;
        case 1: // BNE
          take = registers[rs1] !== registers[rs2];
          break;
        case 2: // BZ
          take = registers[rs1] === 0;
          break;
        case 3: // BNZ
          take = registers[rs1] !== 0;
          break;
        case 4: // BLT
          take = registers[rs1] < registers[rs2];
          break;
        case 5: // BGE
          take = registers[rs1] >= registers[rs2];
          break;
        case 6: // BLTU
          take = registers[rs1] >>> 0 < registers[rs2] >>> 0;
          break;
        case 7: // BGEU
          take = registers[rs1] >>> 0 >= registers[rs2] >>> 0;
          break;
        default:
        // Unknown branch instruction - skip silently for performance
      }

      if (take) {
        pc += imm * 2;
        incrementPC = false;
      }
      break;
    }
    case Opcode.Stype: {
      const inst = instruction as STypeInstruction;
      const { funct3, rd: rs1, rs2, imm: raw4 } = inst;
      let imm = signExtend(raw4, 4);
      const addr = registers[rs2] + imm;

      switch (funct3) {
        case 0: // Store Byte
          setByte(addr, registers[rs1]);
          break;
        case 1: // Store Word
          setWord(addr, registers[rs1]);
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
      const addr = registers[rs2] + imm;
      switch (funct3) {
        case 0: // LB
          registers[rd] = (getByte(addr) << 24) >> 24;
          break;
        case 1: // LW
          registers[rd] = getWord(addr);
          break;
        case 4: // LBU
          registers[rd] = getByte(addr) & 0xff;
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
        pc += imm * 2;
      } else {
        const nextPC = pc + 2;
        pc += imm * 2;
        registers[rd] = nextPC;
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
        registers[rd] = val;
      } else {
        registers[rd] = pc + val;
      }
      break;
    }
    case Opcode.ecall: {
      break; // ecall is handled separately
    }
    default:
      break;
  }
  if (incrementPC) {
    pc += 2;
  }
  return {
    registers: [...registers], // Create a new array to ensure reference changes
    memory,
    pc,
  };
}
