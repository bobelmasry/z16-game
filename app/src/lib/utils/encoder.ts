import { getRegisterName } from "../utils";
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
  ECallInstruction,
} from "./types/instruction";

export class InstructionEncoder {
  private instructions: Instruction[] = [];

  constructor(instructions: Instruction[] = []) {
    this.instructions = instructions;
  }

  encodeInstructions() {
    return this.instructions.map((instr) => this.encodeOne(instr)).join("\n");
  }

  private encodeOne(instr: Instruction): string {
    try {
      switch (instr.opcode) {
        case Opcode.Rtype:
          return this.encodeRType(instr as RTypeInstruction);
        case Opcode.Itype:
          return this.encodeIType(instr as ITypeInstruction);
        case Opcode.Btype:
          return this.encodeBType(instr as BTypeInstruction);
        case Opcode.Stype:
          return this.encodeSType(instr as STypeInstruction);
        case Opcode.Ltype:
          return this.encodeLType(instr as LTypeInstruction);
        case Opcode.Jtype:
          return this.encodeJType(instr as JTypeInstruction);
        case Opcode.Utype:
          return this.encodeUType(instr as UTypeInstruction);
        case Opcode.ECall:
          const svc = (instr as ECallInstruction).service;
          return `ECALL ${svc}`;
        default:
          throw new Error(
            `Unsupported opcode: ${(instr as Instruction).opcode}`
          );
      }
    } catch (error) {
      return "ERR";
    }
  }

  private encodeRType(i: RTypeInstruction): string {
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

  private encodeIType(i: ITypeInstruction): string {
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

  private encodeBType(i: BTypeInstruction): string {
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

  private encodeSType(i: STypeInstruction): string {
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

  private encodeLType(i: LTypeInstruction): string {
    const rd = i.rd;
    const rs1 = i.rs2;
    const offset = signExtend(i.imm, 4);
    switch (i.funct3) {
      case 0:
        return `LB    ${getRegisterName(rd)}, ${offset}(${getRegisterName(
          rs1
        )})`;
      case 1:
        return `LW    ${getRegisterName(rd)}, ${offset}(${getRegisterName(
          rs1
        )})`;
      case 4:
        return `LBU   ${getRegisterName(rd)}, ${offset}(${getRegisterName(
          rs1
        )})`;
    }
    throw new Error(`Unknown L-type (f3=${i.funct3})`);
  }

  private encodeJType(i: JTypeInstruction): string {
    // sign extend the immediate
    const target = signExtend(i.imm << 1, 9);
    if (i.flag === 0) {
      return `J     ${target}`;
    } else {
      return `JAL   ${getRegisterName(i.rd)}, ${target}`;
    }
  }

  private encodeUType(i: UTypeInstruction): string {
    // U-type immediate is bits [15:7], shift left by 7
    const imm32 = i.imm;
    const imm32Hex = imm32.toString(16);
    if (i.flag === 0) {
      return `LUI   ${getRegisterName(i.rd)}, 0x${imm32Hex}`;
    } else {
      return `AUIPC ${getRegisterName(i.rd)}, 0x${imm32Hex}`;
    }
  }
}
