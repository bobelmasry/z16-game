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

export function generateInstructions(memory: Uint16Array): Instruction[] {
  const instructions: Instruction[] = [];
  for (let i = 0; i < memory.length; i++) {
    const instruction = decodeToInstruction(memory[i]);
    instructions.push(instruction);
  }
  return instructions;
}

function decodeToInstruction(instruction: number): Instruction {
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
    case Opcode.ECall: {
      const service = (instruction >> 6) & 0x03ff; // Bits 6–15
      return {
        opcode: Opcode.ECall,
        func3: "000", // Always 0 for ecall
        service,
      } as ECallInstruction;
    }
    default:
      throw new Error(`Unsupported opcode: ${opcode}`);
  }
}
