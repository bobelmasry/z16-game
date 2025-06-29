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
  ECallInstruction,
} from "./decoder";

export function executeInstruction(
  instruction: Instruction,
  registers: number[],
  pc: number,
  memory: Uint8Array,
  setRegisters: (r: number[]) => void,
  setPC: (pc: number) => void,
  setConsoleMessages: (
    messages: string[] | ((prev: string[]) => string[])
  ) => void,
  setRunning: (r: boolean) => void,
  debugMode: boolean
) {
  let newRegisters = [...registers];
  let newPC = pc;
  let incrementPC = true;
  const logs: string[] = [];

  // Helpers
  const getByte = (addr: number) => (addr < memory.length ? memory[addr] : 0);
  const getWord = (addr: number) =>
    addr + 1 < memory.length ? memory[addr] | (memory[addr + 1] << 8) : 0;
  const setByte = (addr: number, value: number) => {
    if (addr < memory.length) memory[addr] = value & 0xff;
  };
  const setWord = (addr: number, value: number) => {
    if (addr + 1 < memory.length) {
      memory[addr] = value & 0xff;
      memory[addr + 1] = (value >> 8) & 0xff;
    }
  };

  switch (instruction.opcode) {
    case Opcode.Rtype: {
      const inst = instruction as RTypeInstruction;
      const { funct3, funct4, rd, rs2 } = inst;
      switch (funct3) {
        case 0:
          switch (funct4) {
            case 0:
              newRegisters[rd] += newRegisters[rs2];
              break;
            case 1:
              newRegisters[rd] -= newRegisters[rs2];
              break;
            case 4:
              newPC = newRegisters[rd];
              incrementPC = false;
              break;
            case 8: {
              const nextPC = newPC + 2;
              newPC = newRegisters[rd];
              newRegisters[rd] = nextPC;
              incrementPC = false;
              break;
            }
            default:
              logs.push("Unknown R-type instruction");
          }
          break;
        case 1:
          newRegisters[rd] =
            (newRegisters[rd] << 16) >> 16 < (newRegisters[rs2] << 16) >> 16
              ? 1
              : 0;
          break;
        case 2:
          newRegisters[rd] = newRegisters[rd] < newRegisters[rs2] ? 1 : 0;
          break;
        case 3:
          switch (funct4) {
            case 4:
              newRegisters[rd] <<= newRegisters[rs2];
              break;
            case 5:
              newRegisters[rd] >>>= newRegisters[rs2];
              break;
            case 6:
              newRegisters[rd] >>= newRegisters[rs2];
              break;
            default:
              logs.push("Unknown shift instruction");
          }
          break;
        case 4:
          newRegisters[rd] |= newRegisters[rs2];
          break;
        case 5:
          newRegisters[rd] &= newRegisters[rs2];
          break;
        case 6:
          newRegisters[rd] ^= newRegisters[rs2];
          break;
        case 7:
          newRegisters[rd] = newRegisters[rs2];
          break;
        default:
          logs.push("Unknown R-type");
      }
      break;
    }

    case Opcode.Itype: {
      const inst = instruction as ITypeInstruction;
      const { funct3, rd, imm: rawImm } = inst;
      // sign-extend 7-bit
      let imm = rawImm & 0x7f;
      if (imm & 0x40) imm |= 0xffffff80;
      const shamt = imm & 0x0f;
      const mode = (imm >> 4) & 0b111;

      switch (funct3) {
        case 0:
          newRegisters[rd] += imm;
          break;
        case 1:
          newRegisters[rd] = (newRegisters[rd] << 16) >> 16 < imm ? 1 : 0;
          break;
        case 2:
          newRegisters[rd] = newRegisters[rd] < imm ? 1 : 0;
          break;
        case 3:
          if (mode === 1) newRegisters[rd] <<= shamt;
          else if (mode === 2) newRegisters[rd] >>>= shamt;
          else if (mode === 4) newRegisters[rd] >>= shamt;
          else logs.push("Unknown shift instruction");
          break;
        case 4:
          newRegisters[rd] |= imm;
          break;
        case 5:
          newRegisters[rd] &= imm;
          break;
        case 6:
          newRegisters[rd] ^= imm;
          break;
        case 7:
          newRegisters[rd] = imm;
          break;
        default:
          logs.push("Unknown I-type");
      }
      break;
    }

    case Opcode.Btype: {
      const inst = instruction as BTypeInstruction;
      const { funct3, rd: rs1, rs2, imm: raw4 } = inst;
      // sign-extend 4 bits then <<1
      let imm = (raw4 << 1) & 0x1f;
      if (imm & 0x10) imm |= 0xffffffe0;

      let take = false;
      switch (funct3) {
        case 0:
          take = newRegisters[rs1] === newRegisters[rs2];
          break;
        case 1:
          take = newRegisters[rs1] !== newRegisters[rs2];
          break;
        case 2:
          take = newRegisters[rs1] === 0;
          break;
        case 3:
          take = newRegisters[rs1] !== 0;
          break;
        case 4:
          take =
            (newRegisters[rs1] << 16) >> 16 < (newRegisters[rs2] << 16) >> 16;
          break;
        case 5:
          take =
            (newRegisters[rs1] << 16) >> 16 >= (newRegisters[rs2] << 16) >> 16;
          break;
        case 6:
          take = newRegisters[rs1] < newRegisters[rs2];
          break;
        case 7:
          take = newRegisters[rs1] >= newRegisters[rs2];
          break;
        default:
          logs.push("Unknown branch instruction");
      }

      if (take) {
        newPC += imm * 2;
        incrementPC = false;
        logs.push(`Branch taken. New PC: 0x${newPC.toString(16)}`);
      }
      break;
    }

    case Opcode.Stype: {
      const inst = instruction as STypeInstruction;
      const { funct3, rd: rs1, rs2, imm: raw4 } = inst;
      let imm = raw4 & 0x0f;
      if (imm & 0x8) imm |= 0xfffffff0;
      const addr = newRegisters[rs2] + imm;

      switch (funct3) {
        case 0:
          setByte(addr, newRegisters[rs1]);
          break;
        case 1:
          setWord(addr, newRegisters[rs1]);
          break;
        default:
          logs.push("Unknown store");
      }
      break;
    }

    case Opcode.Ltype: {
      const inst = instruction as LTypeInstruction;
      const { funct3, rd, rs2, imm: raw4 } = inst;
      let imm = raw4 & 0x0f;
      if (imm & 0x8) imm |= 0xfffffff0;
      const addr = newRegisters[rs2] + imm;

      switch (funct3) {
        case 0:
          newRegisters[rd] = (getByte(addr) << 24) >> 24;
          break;
        case 1:
          newRegisters[rd] = getWord(addr);
          break;
        case 4:
          newRegisters[rd] = getByte(addr) & 0xff;
          break;
        default:
          logs.push("Unknown load");
      }
      break;
    }

    case Opcode.Jtype: {
      const inst = instruction as JTypeInstruction;
      const { rd, imm: rawImm, flag } = inst;
      // rawImm is already bits[9:4]<<4 | bits[3:1]<<1
      let imm = rawImm & ((1 << 10) - 1);
      if (imm & 0x200) imm |= ~0x3ff; // sign-extend 10 bits

      if (flag === 0) {
        newPC += imm * 2;
      } else {
        const nextPC = newPC + 2;
        newPC += imm * 2;
        newRegisters[rd] = nextPC;
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
        newRegisters[rd] = val;
      } else {
        newRegisters[rd] = pc + val;
      }
      break;
    }

    case Opcode.ecall: {
      const inst = instruction as ECallInstruction;
      const svc = inst.service;
      switch (svc) {
        case 1:
          logs.push(`Integer Output: ${(newRegisters[6] << 16) >> 16}`);
          break;
        case 3:
          logs.push("Program terminated by ecall 3");
          setRunning(false);
          break;
        case 5: {
          let addr = newRegisters[0];
          let out = "";
          while (addr < memory.length) {
            const c = memory[addr++];
            if (c === 0) break;
            out += String.fromCharCode(c);
          }
          logs.push(`String Output: ${out}`);
          break;
        }
        default:
          logs.push(`Unknown ecall: ${svc}`);
      }
      break;
    }

    default:
      logs.push(`Unknown opcode: ${(instruction as Instruction).opcode}`);
  }

  if (incrementPC) {
    newPC += 2;
  }

  setRegisters(newRegisters);
  setPC(newPC);
  if (debugMode) {
    logs.push(
      "Registers: " + newRegisters.map((v, i) => `x${i}=${v}`).join(" ")
    );
  }
  if (logs.length) {
    setConsoleMessages((prev) => [...prev, ...logs]);
  }
}
