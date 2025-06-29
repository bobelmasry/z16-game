/* This function takes a binary string like: 1001010001110000 and converts it
 to a human-readable string like xor x1, x2 in order to make sure that we're
 extracting the fields correctly.*/

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
      const imm = ((instruction >> 3) & 0x0007) | ((instruction >> 9) & 0x003f);
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
      const imm = ((instruction >> 3) & 0x0007) | ((instruction >> 9) & 0x003f);
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

/** sign-extend a `bits`-wide value */
function signExtend(value: number, bits: number): number {
  const mask = (1 << bits) - 1;
  const signBit = 1 << (bits - 1);
  value &= mask;
  return (value ^ signBit) - signBit;
}

export function decodeRTypeInstruction(i: RTypeInstruction): string {
  const { funct3, funct4, rd, rs2 } = i;
  switch (funct3) {
    case 0:
      switch (funct4) {
        case 0:
          return `ADD  x${rd}, x${rs2}`;
        case 1:
          return `SUB  x${rd}, x${rs2}`;
        case 11:
          return `JR   x${rd}`;
        case 12:
          return `JALR x${rd}, x${rs2}`;
      }
      break;
    case 1:
      if (funct4 === 2) return `SLT   x${rd}, x${rs2}`;
      break;
    case 2:
      if (funct4 === 3) return `SLTU  x${rd}, x${rs2}`;
      break;
    case 3:
      switch (funct4) {
        case 4:
          return `SLL  x${rd}, x${rs2}`;
        case 5:
          return `SRL  x${rd}, x${rs2}`;
        case 6:
          return `SRA  x${rd}, x${rs2}`;
      }
      break;
    case 4:
      if (funct4 === 7) return `OR   x${rd}, x${rs2}`;
      break;
    case 5:
      if (funct4 === 8) return `AND  x${rd}, x${rs2}`;
      break;
    case 6:
      if (funct4 === 9) return `XOR  x${rd}, x${rs2}`;
      break;
    case 7:
      if (funct4 === 10) return `MV   x${rd}, x${rs2}`;
      break;
  }
  throw new Error(`Unknown R-type (f3=${funct3}, f4=${funct4})`);
}

export function decodeITypeInstruction(i: ITypeInstruction): string {
  const { funct3, rd, imm } = i;
  const simm = signExtend(imm, 7);
  const shamt = imm & 0xf;
  switch (funct3) {
    case 0:
      return `ADDI  x${rd}, ${simm}`;
    case 1:
      return `SLTI  x${rd}, ${simm}`;
    case 2:
      return `SLTUI x${rd}, ${imm}`; // unsigned
    case 3: {
      // shifts all share f3=3 but differ by imm[6:4]
      const mode = (imm >> 4) & 0b111;
      if (mode === 1) return `SLLI x${rd}, ${shamt}`;
      if (mode === 2) return `SRLI x${rd}, ${shamt}`;
      if (mode === 4) return `SRAI x${rd}, ${shamt}`;
      break;
    }
    case 4:
      return `ORI   x${rd}, ${simm}`;
    case 5:
      return `ANDI  x${rd}, ${simm}`;
    case 6:
      return `XORI  x${rd}, ${simm}`;
    case 7:
      return `LI    x${rd}, ${simm}`;
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
      return `BEQ   x${rs1}, x${rs2}, ${offset}`;
    case 1:
      return `BNE   x${rs1}, x${rs2}, ${offset}`;
    case 2:
      return `BZ    x${rs1}, ${offset}`; // ignore rs2
    case 3:
      return `BNZ   x${rs1}, ${offset}`; // ignore rs2
    case 4:
      return `BLT   x${rs1}, x${rs2}, ${offset}`;
    case 5:
      return `BGE   x${rs1}, x${rs2}, ${offset}`;
    case 6:
      return `BLTU  x${rs1}, x${rs2}, ${offset}`;
    case 7:
      return `BGEU  x${rs1}, x${rs2}, ${offset}`;
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
      return `SB  x${rs2}, ${offset}(x${rs1})`;
    case 1:
      return `SW  x${rs2}, ${offset}(x${rs1})`;
  }
  throw new Error(`Unknown S-type (f3=${i.funct3})`);
}

export function decodeLTypeInstruction(i: LTypeInstruction): string {
  const rd = i.rd;
  const rs1 = i.rs2;
  const offset = signExtend(i.imm, 4);
  switch (i.funct3) {
    case 0:
      return `LB   x${rd}, ${offset}(x${rs1})`;
    case 1:
      return `LW   x${rd}, ${offset}(x${rs1})`;
    case 4:
      return `LBU  x${rd}, ${offset}(x${rs1})`;
  }
  throw new Error(`Unknown L-type (f3=${i.funct3})`);
}

export function decodeJTypeInstruction(i: JTypeInstruction): string {
  // imm is already collected; we’ll just sign-extend it across 10 bits for example
  const target = signExtend(i.imm, 10);
  if (i.flag === 0) {
    return `J    ${target}`;
  } else {
    return `JAL  x${i.rd}, ${target}`;
  }
}

export function decodeUTypeInstruction(i: UTypeInstruction): string {
  // U-type immediate is bits [15:7], shift left by 7
  const imm32 = i.imm << 7;
  if (i.flag === 0) {
    return `LUI   x${i.rd}, ${imm32}`;
  } else {
    return `AUIPC x${i.rd}, ${imm32}`;
  }
}

export function decodeToString(instr: Instruction): string {
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
}
