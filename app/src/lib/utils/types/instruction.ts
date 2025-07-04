export enum Opcode {
  "Rtype" = 0,
  "Itype" = 1,
  "Btype" = 2,
  "Stype" = 3,
  "Ltype" = 4,
  "Jtype" = 5,
  "Utype" = 6,
  "ECall" = 7,
}

export enum ECALLService {
  "ReadString" = 1,
  "ReadInteger" = 2,
  "PrintString" = 3,
  "PlayTone" = 4,
  "SetAudioVolume" = 5,
  "StopAudioPlayback" = 6,
  "ReadKeyboard" = 7,
  "RegistersDump" = 8,
  "MemoryDump" = 9,
  "ProgramExit" = 10,
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
  opcode: Opcode.ECall;
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
