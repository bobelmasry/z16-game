export function executeInstruction(
  instruction: number,
  registers: number[],
  pc: number,
  memory: Uint8Array,
  setRegisters: (r: number[]) => void,
  setPC: (pc: number) => void,
  setConsoleMessages: (messages: string[] | ((prev: string[]) => string[])) => void,
  setRunning: (r: boolean) => void,
  debugMode: boolean
) {
  let newRegisters = [...registers];
  let newPC = pc;
  let incrementPC = true;
  const logs: string[] = [];

  const opcode = instruction & 0x7;
  const funct3 = (instruction >> 3) & 0x7;
  const rd = (instruction >> 6) & 0x7;
  const rs2 = (instruction >> 9) & 0x7;
  let funct4 = (instruction >> 12) & 0xF;
  let imm = 0;
  let f = 0;
  let shamt = 0;

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

  switch (opcode) {
    case 0:
      switch (funct3) {
        case 0:
          switch (funct4) {
            case 0: newRegisters[rd] += newRegisters[rs2]; break;
            case 1: newRegisters[rd] -= newRegisters[rs2]; break;
            case 4: newPC = newRegisters[rd]; incrementPC = false; break;
            case 8:
              const nextPC = newPC + 2;
              newPC = newRegisters[rd];
              newRegisters[rd] = nextPC;
              incrementPC = false;
              break;
            default: logs.push("Unknown R-type instruction"); break;
          }
          break;
        case 1: newRegisters[rd] = (newRegisters[rd] << 16 >> 16) < (newRegisters[rs2] << 16 >> 16) ? 1 : 0; break;
        case 2: newRegisters[rd] = newRegisters[rd] < newRegisters[rs2] ? 1 : 0; break;
        case 3:
          switch (funct4) {
            case 2: newRegisters[rd] <<= newRegisters[rs2]; break;
            case 4: newRegisters[rd] >>>= newRegisters[rs2]; break;
            case 8: newRegisters[rd] >>= newRegisters[rs2]; break;
            default: logs.push("Unknown shift instruction"); break;
          }
          break;
        case 4: newRegisters[rd] |= newRegisters[rs2]; break;
        case 5: newRegisters[rd] &= newRegisters[rs2]; break;
        case 6: newRegisters[rd] ^= newRegisters[rs2]; break;
        case 7: newRegisters[rd] = newRegisters[rs2]; break;
        default: logs.push("Unknown R-type"); break;
      }
      break;

    case 1:
      imm = (instruction >> 9) & 0x7f;
      if (imm & 0x40) imm |= 0xffffff80;
      switch (funct3) {
        case 0: newRegisters[rd] += imm; break;
        case 1: newRegisters[rd] = (newRegisters[rd] << 16 >> 16) < imm ? 1 : 0; break;
        case 2: newRegisters[rd] = newRegisters[rd] < imm ? 1 : 0; break;
        case 3:
          funct4 = (instruction >> 12) & 0xf;
          shamt = (instruction >> 10) & 0x7;
          switch (funct4) {
            case 2: newRegisters[rd] <<= shamt; break;
            case 4: newRegisters[rd] >>>= shamt; break;
            case 8: newRegisters[rd] >>= shamt; break;
            default: logs.push("Unknown shift instruction"); break;
          }
          break;
        case 4: newRegisters[rd] |= imm; break;
        case 5: newRegisters[rd] &= imm; break;
        case 6: newRegisters[rd] ^= imm; break;
        case 7: newRegisters[rd] = imm; break;
        default: logs.push("Unknown I-type"); break;
      }
      break;

    case 2:
      imm = (instruction >> 12) & 0xf;
      if (imm & 0x8) imm |= 0xfffffff0;
      let takeBranch = false;
      switch (funct3) {
        case 0: takeBranch = newRegisters[rd] === newRegisters[rs2]; break;
        case 1: takeBranch = newRegisters[rd] !== newRegisters[rs2]; break;
        case 2: takeBranch = newRegisters[rd] === 0; break;
        case 3: takeBranch = newRegisters[rd] !== 0; break;
        case 4: takeBranch = (newRegisters[rd] << 16 >> 16) < (newRegisters[rs2] << 16 >> 16); break;
        case 5: takeBranch = (newRegisters[rd] << 16 >> 16) >= (newRegisters[rs2] << 16 >> 16); break;
        case 6: takeBranch = newRegisters[rd] < newRegisters[rs2]; break;
        case 7: takeBranch = newRegisters[rd] >= newRegisters[rs2]; break;
        default: logs.push("Unknown branch instruction"); break;
      }
      if (takeBranch) {
        newPC += imm * 2;
        incrementPC = false;
        logs.push(`Branch taken. New PC: 0x${newPC.toString(16)}`);
      }
      break;

    case 3:
      imm = (instruction >> 12) & 0xf;
      const storeAddr = newRegisters[rs2] + imm;
      switch (funct3) {
        case 0: setByte(storeAddr, newRegisters[rd]); break;
        case 1: setWord(storeAddr, newRegisters[rd]); break;
        default: logs.push("Unknown store"); break;
      }
      break;

    case 4:
      imm = (instruction >> 12) & 0xf;
      const loadAddr = newRegisters[rs2] + imm;
      switch (funct3) {
        case 0: newRegisters[rd] = getByte(loadAddr) << 24 >> 24; break;
        case 1: newRegisters[rd] = getWord(loadAddr); break;
        case 4: newRegisters[rd] = getByte(loadAddr) & 0xff; break;
        default: logs.push("Unknown load"); break;
      }
      break;

    case 5:
      f = (instruction >> 15) & 0x1;
      imm = ((instruction >> 10) & 0x1f) << 4 | ((instruction >> 4) & 0xf);
      if (imm & 0x8) imm |= 0xfffffff0;
      if (f === 0) newPC += imm * 2;
      else {
        const nextPC = newPC + 2;
        newPC += imm * 2;
        newRegisters[rd] = nextPC;
      }
      incrementPC = false;
      break;

    case 6:
      imm = (instruction >> 9) & 0x7f;
      if (instruction & 0x8000) newRegisters[rd] = pc + ((imm & 0x3f) << 10);
      else newRegisters[rd] = (imm & 0x3f) << 10;
      break;

    case 7:
      switch (rd) {
        case 1:
          logs.push(`Integer Output: ${newRegisters[6] << 16 >> 16}`);
          break;
        case 3:
          logs.push("Program terminated by ecall 3");
          setRunning(false);
          break;
        case 5:
          let addr = newRegisters[0];
          let output = '';
          while (addr < memory.length) {
            const c = memory[addr++];
            if (c === 0) break;
            output += String.fromCharCode(c);
          }
          logs.push("String Output: " + output);
          break;
        default: logs.push(`Unknown ecall: ${rd}`); break;
      }
      break;

    default:
      logs.push(`Unknown instruction: 0x${instruction.toString(16)}`);
      break;
  }

  if (incrementPC) newPC += 2;
  setRegisters(newRegisters);
  setPC(newPC);
  if (debugMode) logs.push("Registers: " + newRegisters.map((v, i) => `x${i}=${v}`).join(" "));
  if (logs.length > 0) setConsoleMessages(prev => [...prev, ...logs]);
}
