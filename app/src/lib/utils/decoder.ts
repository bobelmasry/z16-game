import { signExtend } from "./binary";
import { getRegisterName } from "../utils";

export enum Opcode {
  "Rtype" = 0,
  "Itype" = 1,
  "Btype" = 2,
  "Stype" = 3,
  "Ltype" = 4,
  "Jtype" = 5,
  "Utype" = 6,
  "ecall" = 7,
}

export interface BaseInstruction {
  opcode: Opcode;
}

export interface RTypeInstruction extends BaseInstruction {
  opcode: Opcode.Rtype;
  funct3: number; // Bits 3–5
  rd: number; // Bits 6–8
  rs2: number; // Bits 9–11
  funct4: number; // Bits 12–15
}

export interface ITypeInstruction extends BaseInstruction {
  opcode: Opcode.Itype;
  funct3: number; // Bits 3–5
  rd: number; // Bits 6–8
  imm: number; // Bits 9–15
}

export interface BTypeInstruction extends BaseInstruction {
  opcode: Opcode.Btype;
  funct3: number; // Bits 3–5
  rd: number; // Bits 6–8
  rs2: number; // Bits 9–11
  imm: number; // Bits 12–15
}

export interface STypeInstruction extends BaseInstruction {
  opcode: Opcode.Stype;
  funct3: number; // Bits 3–5
  rd: number; // Bits 6–8
  rs2: number; // Bits 9–11
  imm: number; // Bits 12–15
}

export interface LTypeInstruction extends BaseInstruction {
  opcode: Opcode.Ltype;
  funct3: number; // Bits 3–5
  rd: number; // Bits 6–8
  rs2: number; // Bits 9–11
  imm: number; // Bits 12–15
}

export interface JTypeInstruction extends BaseInstruction {
  opcode: Opcode.Jtype;
  rd: number; // Bits 6–8
  imm: number; // Bits ??
  flag: number; // Bit 15
}

export interface UTypeInstruction extends BaseInstruction {
  opcode: Opcode.Utype;
  rd: number; // Bits 6–8
  imm: number; // Bits ??
  flag: number; // Bit 15
}

export interface ECallInstruction extends BaseInstruction {
  opcode: Opcode.ecall;
  func3: "000"; // Bits 3–5, always 0 for ecall
  service: number; // Bits 6–15, service number
}

export type Instruction =
  | RTypeInstruction
  | ITypeInstruction
  | BTypeInstruction
  | STypeInstruction
  | LTypeInstruction
  | JTypeInstruction
  | UTypeInstruction
  | ECallInstruction;

export function decodeToInstruction(instruction: number): Instruction {
  const opcode: Opcode = instruction & 0x0007; // Bits 0–2

  const funct3 = (instruction >> 3) & 0x0007; // Bits 3–5

  const rd = (instruction >> 6) & 0x0007; // Bits 6–8
  const rs2 = (instruction >> 9) & 0x0007; // Bits 9–11

  const funct4 = (instruction >> 12) & 0x000f; // Bits 12–15

  switch (opcode) {
    case Opcode.Rtype:
      return {
        opcode: Opcode.Rtype,
        funct3,
        rd,
        rs2,
        funct4,
      } as RTypeInstruction;
    case Opcode.Itype: {
      const imm = (instruction >> 9) & 0x007f; // Bits 9-15
      return {
        opcode: Opcode.Itype,
        funct3,
        rd,
        imm,
      } as ITypeInstruction;
    }
    case Opcode.Btype: {
      const imm = funct4;
      return {
        opcode: Opcode.Btype,
        funct3,
        rd,
        rs2,
        imm,
      } as BTypeInstruction;
    }
    case Opcode.Stype: {
      const imm = funct4;
      return {
        opcode: Opcode.Stype,
        funct3,
        rd,
        rs2,
        imm,
      } as STypeInstruction;
    }
    case Opcode.Ltype: {
      const imm = funct4;
      return {
        opcode: Opcode.Ltype,
        funct3,
        rd,
        rs2,
        imm,
      } as LTypeInstruction;
    }
    case Opcode.Jtype: {
      // Immediate is from 3-5 and 9-14
      let imm = ((instruction >> 3) & 0x0007) | ((instruction >> 6) & 0x01f8);
      const flag = (instruction >> 15) & 0x0001; // Bit 15
      return {
        opcode: Opcode.Jtype,
        rd,
        imm,
        flag,
      } as JTypeInstruction;
    }
    case Opcode.Utype: {
      // Immediate is from 3-5 and 9-14
      let imm = ((instruction >> 3) & 0x0007) | ((instruction >> 6) & 0x01f8);
      const flag = (instruction >> 15) & 0x0001; // Bit 15
      return {
        opcode: Opcode.Utype,
        rd,
        imm,
        flag,
      } as UTypeInstruction;
    }
    case Opcode.ecall: {
      const service = (instruction >> 6) & 0x03ff; // Bits 6–15
      return {
        opcode: Opcode.ecall,
        func3: "000", // Always 0 for ecall
        service,
      } as ECallInstruction;
    }
    default:
      throw new Error(`Unsupported opcode: ${opcode}`);
  }
}

export function decodeRTypeInstruction(i: RTypeInstruction): string {
  const { funct3, funct4, rd, rs2 } = i;
  switch (funct3) {
    case 0:
      switch (funct4) {
        case 0:
          return `ADD   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
        case 1:
          return `SUB   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
        case 11:
          return `JR    ${getRegisterName(rd)}`;
        case 12:
          return `JALR  ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      }
      break;
    case 1:
      if (funct4 === 2)
        return `SLT   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
    case 2:
      if (funct4 === 3)
        return `SLTU  ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
    case 3:
      switch (funct4) {
        case 4:
          return `SLL   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
        case 5:
          return `SRL   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
        case 6:
          return `SRA   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      }
      break;
    case 4:
      if (funct4 === 7)
        return `OR    ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
    case 5:
      if (funct4 === 8)
        return `AND   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
    case 6:
      if (funct4 === 9)
        return `XOR   ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
    case 7:
      if (funct4 === 10)
        return `MV    ${getRegisterName(rd)}, ${getRegisterName(rs2)}`;
      break;
  }
  throw new Error(`Unknown R-type (f3=${funct3}, f4=${funct4})`);
}

export function decodeITypeInstruction(i: ITypeInstruction): string {
  const { funct3, rd, imm } = i;
  const simm = signExtend(imm, 7);
  const immHex = imm.toString(16).padStart(2, "0");
  const shamt = imm & 0xf;
  switch (funct3) {
    case 0:
      return `ADDI  ${getRegisterName(rd)}, 0x${immHex}`;
    case 1:
      return `SLTI  ${getRegisterName(rd)}, 0x${immHex}`;
    case 2:
      return `SLTUI ${getRegisterName(rd)}, 0x${immHex}`; // unsigned
    case 3: {
      // shifts all share f3=3 but differ by imm[6:4]
      const mode = (imm >> 4) & 0b111;
      if (mode === 1) return `SLLI  ${getRegisterName(rd)}, ${shamt}`;
      if (mode === 2) return `SRLI  ${getRegisterName(rd)}, ${shamt}`;
      if (mode === 4) return `SRAI  ${getRegisterName(rd)}, ${shamt}`;
      break;
    }
    case 4:
      return `ORI   ${getRegisterName(rd)}, 0x${immHex}`;
    case 5:
      return `ANDI  ${getRegisterName(rd)}, 0x${immHex}`;
    case 6:
      return `XORI  ${getRegisterName(rd)}, 0x${immHex}`;
    case 7:
      return `LI    ${getRegisterName(rd)}, 0x${immHex}`;
  }
  throw new Error(`Unknown I-type (f3=${funct3}, imm=${imm})`);
}

export function decodeBTypeInstruction(i: BTypeInstruction): string {
  const rs1 = i.rd;
  const rs2 = i.rs2;
  // imm are bits[12:15] → offset = sext(imm<<1) with 5-bit width
  const offset = signExtend(i.imm << 1, 5);
  switch (i.funct3) {
    case 0:
      return `BEQ   ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
    case 1:
      return `BNE   ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
    case 2:
      return `BZ    ${getRegisterName(rs1)}, ${offset}`; // ignore rs2
    case 3:
      return `BNZ   ${getRegisterName(rs1)}, ${offset}`; // ignore rs2
    case 4:
      return `BLT   ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
    case 5:
      return `BGE   ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
    case 6:
      return `BLTU  ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
    case 7:
      return `BGEU  ${getRegisterName(rs1)}, ${getRegisterName(
        rs2
      )}, ${offset}`;
  }
  throw new Error(`Unknown B-type (f3=${i.funct3})`);
}

export function decodeSTypeInstruction(i: STypeInstruction): string {
  const rs1 = i.rd;
  const rs2 = i.rs2;
  // imm bits12-15, sign-extend 4 bits
  const offset = signExtend(i.imm, 4);
  switch (i.funct3) {
    case 0:
      return `SB    ${getRegisterName(rs1)}, ${offset}(${getRegisterName(
        rs2
      )})`;
    case 1:
      return `SW    ${getRegisterName(rs1)}, ${offset}(${getRegisterName(
        rs2
      )})`;
  }
  throw new Error(`Unknown S-type (f3=${i.funct3})`);
}

export function decodeLTypeInstruction(i: LTypeInstruction): string {
  const rd = i.rd;
  const rs1 = i.rs2;
  const offset = signExtend(i.imm, 4);
  switch (i.funct3) {
    case 0:
      return `LB    ${getRegisterName(rd)}, ${offset}(${getRegisterName(rs1)})`;
    case 1:
      return `LW    ${getRegisterName(rd)}, ${offset}(${getRegisterName(rs1)})`;
    case 4:
      return `LBU   ${getRegisterName(rd)}, ${offset}(${getRegisterName(rs1)})`;
  }
  throw new Error(`Unknown L-type (f3=${i.funct3})`);
}

export function decodeJTypeInstruction(i: JTypeInstruction): string {
  // sign extend the immediate
  const target = signExtend(i.imm << 1, 9);
  if (i.flag === 0) {
    return `J     ${target}`;
  } else {
    return `JAL   ${getRegisterName(i.rd)}, ${target}`;
  }
}

export function decodeUTypeInstruction(i: UTypeInstruction): string {
  // U-type immediate is bits [15:7], shift left by 7
  const imm32 = i.imm;
  const imm32Hex = imm32.toString(16);
  if (i.flag === 0) {
    return `LUI   ${getRegisterName(i.rd)}, 0x${imm32Hex}`;
  } else {
    return `AUIPC ${getRegisterName(i.rd)}, 0x${imm32Hex}`;
  }
}

export function decodeToString(instr: Instruction): string {
  try {
    switch (instr.opcode) {
      case Opcode.Rtype:
        return decodeRTypeInstruction(instr as RTypeInstruction);
      case Opcode.Itype:
        return decodeITypeInstruction(instr as ITypeInstruction);
      case Opcode.Btype:
        return decodeBTypeInstruction(instr as BTypeInstruction);
      case Opcode.Stype:
        return decodeSTypeInstruction(instr as STypeInstruction);
      case Opcode.Ltype:
        return decodeLTypeInstruction(instr as LTypeInstruction);
      case Opcode.Jtype:
        return decodeJTypeInstruction(instr as JTypeInstruction);
      case Opcode.Utype:
        return decodeUTypeInstruction(instr as UTypeInstruction);
      case Opcode.ecall:
        const svc = (instr as ECallInstruction).service;
        return `ECALL ${svc}`;
      default:
        throw new Error(`Unsupported opcode: ${(instr as Instruction).opcode}`);
    }
  } catch (error) {
    return "ERR";
  }
}
