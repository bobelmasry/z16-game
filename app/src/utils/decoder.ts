export function decodeInstruction(instruction: number): string {
    const opcode = instruction & 0x0007;                  // Bits 0–2
    const funct3 = (instruction >> 3) & 0x0007;           // Bits 3–5
    const rd = (instruction >> 6) & 0x0007;               // Bits 6–8
    const rs2 = (instruction >> 9) & 0x0007;              // Bits 9–11
    const funct4 = (instruction >> 12) & 0x000F;          // Bits 12–15
    let imm = (instruction >> 9) & 0x7F;                  // Bits 9–15

    // Sign-extend 7-bit immediate to 32-bit signed integer
    if (imm & 0x40) {
        imm |= 0xFFFFFF80;
    }

    let result = "";

    switch (opcode) {
        case 0:
            switch (funct3) {
                case 0:
                    switch (funct4) {
                        case 0: result = `add x${rd}, x${rs2}`; break;
                        case 1: result = `sub x${rd}, x${rs2}`; break;
                        case 4: result = `jr x${rd}`; break;
                        case 8: result = `jalr x${rd}`; break;
                        default: result = "UNKNOWN R-type"; break;
                    }
                    break;
                case 1: result = `slt x${rd}, x${rs2}`; break;
                case 2: result = `sltu x${rd}, x${rs2}`; break;
                case 3:
                    switch (funct4) {
                        case 4: result = `sll x${rd}, x${rs2}`; break;
                        case 5: result = `srl x${rd}, x${rs2}`; break;
                        case 6: result = `sra x${rd}, x${rs2}`; break;
                        default: result = "UNKNOWN shift"; break;
                    }
                    break;
                case 4: result = `or x${rd}, x${rs2}`; break;
                case 5: result = `and x${rd}, x${rs2}`; break;
                case 6: result = `xor x${rd}, x${rs2}`; break;
                case 7: result = `mv x${rd}, x${rs2}`; break;
                default: result = "UNKNOWN R-type"; break;
            }
            break;

        case 1:
            switch (funct3) {
                case 0: result = `addi x${rd}, ${imm}`; break;
                case 1: result = `slti x${rd}, ${imm}`; break;
                case 2: result = `sltui x${rd}, ${imm}`; break;
                case 3: result = `slli x${rd}, ${imm}`; break;
                case 4: result = `ori x${rd}, ${imm}`; break;
                case 5: result = `andi x${rd}, ${imm}`; break;
                case 6: result = `xori x${rd}, ${imm}`; break;
                case 7: result = `li x${rd}, ${imm}`; break;
                default: result = "UNKNOWN I-type"; break;
            }
            break;

        case 2:
            switch (funct3) {
                case 0: result = `beq x${rd}, x${rs2}, ${funct4}`; break;
                case 1: result = `bne x${rd}, x${rs2}, ${funct4}`; break;
                case 2: result = `bz x${rd}, ${funct4}`; break;
                case 3: result = `bnz x${rd}, ${funct4}`; break;
                case 4: result = `blt x${rd}, x${rs2}, ${funct4}`; break;
                case 5: result = `bge x${rd}, x${rs2}, ${funct4}`; break;
                case 6: result = `bltu x${rd}, x${rs2}, ${funct4}`; break;
                case 7: result = `bgeu x${rd}, x${rs2}, ${funct4}`; break;
                default: result = "UNKNOWN B-type"; break;
            }
            break;

        case 3:
            result = `sw x${rd}, ${imm}(x${rs2})`;
            break;

        case 4:
            switch (funct3) {
                case 0: result = `lb x${rd}, ${imm}(x${rs2})`; break;
                case 1: result = `lw x${rd}, ${imm}(x${rs2})`; break;
                case 4: result = `lbu x${rd}, ${imm}(x${rs2})`; break;
                default: result = "UNKNOWN load"; break;
            }
            break;

        case 5: {
            const offset3To1 = (instruction >> 3) & 0x7;
            const offset9To4 = (instruction >> 9) & 0x3F;
            let offset = (offset9To4 << 4) | (offset3To1 << 1);

            if (offset & 0x80) {
                offset |= 0xFFFFFF00;
            }

            if (instruction & 0x8000) {
                result = `jal x${rd}, ${offset}`;
            } else {
                result = `j ${offset}`;
            }
            break;
        }

        case 6:
            if (instruction & 0x8000) {
                result = `auipc x${rd}, ${imm & 0x3F}`;
            } else {
                result = `lui x${rd}, ${imm & 0x3F}`;
            }
            break;

        case 7:
            switch (rd) {
                case 1: result = "ecall 1"; break;
                case 3: result = "ecall 3"; break;
                case 5: result = "ecall 5"; break;
                default: result = "UNKNOWN ecall"; break;
            }
            break;

        default:
            result = "UNKNOWN instruction"; break;
    }

    return result;
}