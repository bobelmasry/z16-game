#include <string>
#include <vector>
#include <bitset>
#include <unordered_map>
#include <iostream>
#include <fstream>
#include <iomanip>
#include "zx16sim.h"
#include <cstdlib>
#include <cstring>
#include <sstream>
#include <filesystem>
#include <stdexcept>
using namespace std;

/**
 * Constructs a Z16Simulator object and initializes its state by resetting
 *        memory, registers, program counter, and other flags.
 */

Z16Simulator::Z16Simulator() {
    reset();
}

/**
 * Resets the Z16Simulator state by clearing all memory, initializing the
 *        data section with some test data, clearing all registers, and
 *        resetting the program counter and flags.
 */
void Z16Simulator::reset() {
    // Clear all memory
    memset(memory, 0, MEMORY_SIZE * sizeof(uint8_t));

    // Initialize data section with some test data
    const Address DATA_SECTION_START = 0x100;
    const char* testString = "Hello, World!";
    strcpy((char*)&memory[DATA_SECTION_START], testString);
    
    // Store number 42 at address 0x110
    setMemoryWord(0x110, 42);

    // Clear all registers
    memset(registers, 0, NUM_REGISTERS * sizeof(Word));
    
    // Reset program counter and flags
    pc = 0;
    running = false;
    programSize = 0;
}

/**
 * Reads a 16-bit word from memory at the given address and returns its value.
 * If the address is out of bounds, prints an error message and returns 0.
 */
Word Z16Simulator::getMemoryWord(Address addr) {
    if (addr + 1 > MEMORY_SIZE) {
        cerr << "Memory access out of bounds at address 0x" << hex << addr << dec << endl;
        return 0;  // Return 0 for out of bounds access
    }
    // Read two bytes from memory (little-endian)
    Byte byte1 = memory[addr];      // Lower byte
    Byte byte2 = memory[addr + 1];  // Higher byte
    return (byte2 << 8) | byte1;
}

/**
 * Sets a 16-bit word in memory at the specified address.
 * If the address is out of bounds, logs an error message and does nothing.
 * 
 * @param addr The address in memory where the word should be set.
 * @param value The 16-bit word to set in memory.
 */

void Z16Simulator::setMemoryWord(Address addr, Word value) {
    if (addr + 1 > MEMORY_SIZE) {
        cerr << "Memory access out of bounds at address 0x" << hex << addr << dec << endl;
        return;  // Silently fail for out of bounds access
    }
    memory[addr] = value & 0xFF;
    memory[addr + 1] = (value >> 8) & 0xFF;
}

/**
 * Stores a byte in memory at the specified address.
 * If the address is out of bounds, logs an error message and does nothing.
 * 
 * @param addr The address in memory where the byte should be stored.
 * @param value The byte to store in memory.
 */
void Z16Simulator::setMemoryByte(Address addr, int16_t value) {
    if (addr >= MEMORY_SIZE) {
        cerr << "Memory access out of bounds at address 0x" 
             << hex << addr << dec << endl;
        return;
    }

    // Store the lower 8 bits of the value in memory at the specified address
    memory[addr] = value & 0xFF;  // Store the lower byte of the value
}

/**
 * Reads a single byte from memory at the given address and returns its value.
 * If the address is out of bounds, throws a std::runtime_error.
 * 
 * @param addr The address in memory to read from.
 * @return The byte stored in memory at the given address.
 */

Byte Z16Simulator::getMemoryByte(Address addr) {
    if (addr >= MEMORY_SIZE) {
        throw runtime_error("Memory access out of bounds");
    }
    return memory[addr];
}

/**
 * Loads a binary file into memory at address 0 and sets up the simulator for
 * execution. If the file cannot be opened or read, logs an error message and
 * returns false. If debugMode is true, prints the contents of the file and the
 * first few instructions for debugging.
 * 
 * @param filename The name of the file to load.
 * @param debugMode If true, print debugging information.
 * @return true if the file was loaded successfully, false otherwise.
 */
bool Z16Simulator::loadBinaryFile(const string& filename, bool debugMode) {
    ifstream file(filename, ios::binary);
    if (!file) {
        cerr << "Error: Could not open file " << filename << endl;
        return false;
    }

    // Reset the simulator state
    reset();

    // Read the file into memory starting at address 0
    file.read(reinterpret_cast<char*>(memory), MEMORY_SIZE);
    if (file.bad()) {
        cerr << "Error: Failed to read file " << filename << endl;
        return false;
    }

    // Get the number of bytes read
    programSize = file.gcount();
        cout << "Loaded " << programSize << " bytes into memory" << endl;
        cout << "File contents (word view):" << endl;
    for (streamsize i = 0; i < programSize; i++) {
    cout << hex << setw(2) << setfill('0') << (int)(unsigned char)memory[i] << " ";
    if ((i + 1) % 16 == 0) cout << endl;
}
        cout << dec << endl;
        
        // Print the first few instructions for debugging
        cout << "Instructions:" << endl;
        for (Address addr = 0; addr < programSize; addr += 2) {
            Word instruction = getMemoryWord(addr);
            cout << "Address 0x" << hex << setw(4) << setfill('0') << addr 
                 << ": 0x" << setw(4) << instruction << " -> " 
                 << decodeInstruction(instruction) << dec << endl;
        }
    
    
    pc = 0;  // Start execution at address 0
    running = true;
    return true;
}

/**
 * Loads an assembly file by first assembling it into a binary file and then loading
 * the binary file into memory. The function creates a temporary binary file using
 * an external assembler, executes the assembler command, and loads the resulting
 * binary file. It also cleans up the temporary binary file after loading.
 *
 * @param filename The path to the assembly file to be loaded.
 * @return True if the assembly file is successfully loaded into memory, false otherwise.
 */

bool Z16Simulator::loadAssembly(const string& filename) {
    string tempBinFile = filename;
    size_t dot = tempBinFile.find_last_of('.');
    if (dot != string::npos) {
        tempBinFile = tempBinFile.substr(0, dot);
    }
    tempBinFile += ".bin";

    string pythonPath = "python";
    string assemblerScript = "../assembler/zx16asm.py";
    string assemblerCmd = pythonPath + " \"" + assemblerScript + "\" \"" + filename + "\"";

    cout << "Running assembler command: " << assemblerCmd << endl;

    int result = system(assemblerCmd.c_str());
    if (result != 0) {
        cerr << "Error: Assembler failed with exit code " << result << endl;
        return false;
    }

    bool success = loadBinaryFile(tempBinFile);
    remove(tempBinFile.c_str());

    return success;
}





/**
 * Runs the program in memory until it terminates or reaches the end of the loaded
 * program. If debugMode is true, prints the current PC, instruction, and decoded
 * instruction at each step.
 * 
 * @param debugMode If true, print debugging information.
 */
void Z16Simulator::run(bool debugMode) {
    this->debugMode = debugMode;
    running = true;
    while (running && pc < programSize) {
        try {
            Word instruction = getMemoryWord(pc);
            if (debugMode){
                cout << "PC: 0x" << hex << pc << " Instruction: 0x" << instruction << dec << endl;
                cout << "Decoded: " << decodeInstruction(instruction) << endl;
            }
            executeInstruction(instruction, debugMode);
            
        } catch (const exception& e) {
            cerr << "Error at PC=0x" << hex << pc << ": " << e.what() << dec << endl;
            running = false;
        }
    }
    
    if (pc >= programSize) {
        cout << "Program reached end of loaded program" << endl;
    }

    cout << "Final register state:" << endl;
    for (int i = 0; i < NUM_REGISTERS; i++) {
        cout << "x" << i << ": " << registers[i] << " ";
    }
    cout << "Program terminated" << endl;
}

/* Converts a 16-bit instruction into a human-readable string i.e binary -> ADD R1, R2 */
string Z16Simulator::decodeInstruction(Word instruction) {
    stringstream ss;
    
    // Extract instruction fields
    uint16_t opcode = instruction & 0x0007;              // Bits 0-2
    uint16_t funct3 = (instruction >> 3) & 0x0007;       // Bits 3-5
    uint16_t rd = (instruction >> 6) & 0x0007;          // Bits 6-8
    uint16_t rs2 = (instruction >> 9) & 0x0007;          // Bits 9-11
    uint16_t funct4 = (instruction >> 12) & 0x000F;      // Bits 12-15
    int16_t imm = (instruction >> 9) & 0x7F; // Bits 9–15
    // Sign-extend the 4-bit value to a 32-bit signed int
    if (imm & 0x8) { // If the sign bit (bit 3) is set
        imm |= 0xFFFFFFF0; // Extend the sign to 32 bits
    }

    
    switch(opcode) {
        case 0:  // R-type
            switch(funct3) {
                case 0:  // ADD, SUB, JR, JALR
                    switch(funct4) {
                        case 0: ss << "add x" << rd << ", x" << rs2; break;
                        case 1: ss << "sub x" << rd << ", x" << rs2; break;
                        case 4: ss << "jr x" << rd; break;
                        case 8: ss << "jalr x" << rd; break;
                        default: ss << "UNKNOWN R-type"; break;
                    }
                    break;
                case 1:  // SLT
                    ss << "slt x" << rd << ", x" << rs2; break;
                case 2:  // SLTU
                    ss << "sltu x" << rd << ", x" << rs2; break;
                case 3:  // Shifts
                    switch(funct4) {
                        case 2: ss << "sll x" << rd << ", x" << rs2; break;
                        case 4: ss << "srl x" << rd << ", x" << rs2; break;
                        case 8: ss << "sra x" << rd << ", x" << rs2; break;
                        default: ss << "UNKNOWN shift"; break;
                    }
                    break;
                case 4:  // OR
                    ss << "or x" << rd << ", x" << rs2; break;
                case 5:  // AND
                    ss << "and x" << rd << ", x" << rs2; break;
                case 6:  // XOR
                    ss << "xor x" << rd << ", x" << rs2; break;
                case 7:  // MV
                    ss << "mv x" << rd << ", x" << rs2; break;
                default:
                    ss << "UNKNOWN R-type"; break;
            }
            break;
            
        case 1:  // I-type
            switch(funct3) {
                case 0: ss << "addi x" << rd << ", " << imm; break;
                case 1: ss << "slti x" << rd << ", " << imm; break;
                case 2: ss << "sltui x" << rd << ", " << imm; break;
                case 3: ss << "slli x" << rd << ", " << imm; break;
                case 4: ss << "ori x" << rd << ", " << imm; break;
                case 5: ss << "andi x" << rd << ", " << imm; break;
                case 6: ss << "xori x" << rd << ", " << imm; break;
                case 7: ss << "li x" << rd << ", " << imm; break;
                default: ss << "UNKNOWN I-type"; break;
            }
            break;
            
        case 2:  // B-type
            switch(funct3) {
                case 0: ss << "beq x" << rd << ", x" << rs2 << ", " << funct4; break;
                case 1: ss << "bne x" << rd << ", x" << rs2 << ", " << funct4; break;
                case 2: ss << "bz x" << rd << ", " << funct4; break;
                case 3: ss << "bnz x" << rd << ", " << funct4; break;
                case 4: ss << "blt x" << rd << ", x" << rs2 << ", " << funct4; break;
                case 5: ss << "bge x" << rd << ", x" << rs2 << ", " << funct4; break;
                case 6: ss << "bltu x" << rd << ", x" << rs2 << ", " << funct4; break;
                case 7: ss << "bgeu x" << rd << ", x" << rs2 << ", " << funct4; break;
                default: ss << "UNKNOWN B-type"; break;
            }
            break;
            
        case 3:  // Store
            ss << "sw x" << rd << ", " << imm << "(x" << rs2 << ")";
            break;
            
        case 4:  // Load
            switch(funct3) {
                case 0: ss << "lb x" << rd << ", " << imm << "(x" << rs2 << ")"; break;
                case 1: ss << "lw x" << rd << ", " << imm << "(x" << rs2 << ")"; break;
                case 4: ss << "lbu x" << rd << ", " << imm << "(x" << rs2 << ")"; break;
                default: ss << "UNKNOWN load"; break;
            }
            break;
            
        case 5:  // J-type
            {
                // For decoding display, reconstruct the offset from the instruction
                int16_t offset3To1 = (instruction >> 3) & 0x7;  // Extract bits [5:3] -> offset[3:1]
                int16_t offset9To4 = (instruction >> 9) & 0x3F; // Extract bits [14:9] -> offset[9:4]
                
                int16_t offset = (offset9To4 << 4) | (offset3To1 << 1);
                if (offset & 0x8) { // If the sign bit (bit 3) is set
                    offset |= 0xFFFFFFF0; // Extend the sign to 32 bits
                }
                
                if (instruction & 0x8000) {  // JAL
                    ss << "jal x" << rd << ", " << offset;
                } else {
                    ss << "j " << offset;
                }
            }
            break;
            
        case 6:  // U-type
            if (instruction & 0x8000) {  // Check bit 15
                ss << "auipc x" << rd << ", " << (imm & 0x3F);
            } else {
                ss << "lui x" << rd << ", " << (imm & 0x3F);
            }
            break;
            
        case 7:  // System
            switch(rd) {
                case 1: ss << "ecall 1"; break;
                case 3:  ss << "ecall 3"; break;
                case 5: ss << "ecall 5"; break;
                default: ss << "UNKNOWN ecall"; break;
            }
            break;
            
        default:
            ss << "UNKNOWN instruction";
            break;}
    
    return ss.str();
}

/**
 * Execute a single instruction in the simulator.
 * @param instruction The 16-bit instruction to execute.
 * @param debugMode If true, print out the instruction being executed and the register state after execution.
 */
void Z16Simulator::executeInstruction(Word instruction, bool debugMode) {
    // Extract instruction fields
    uint16_t opcode = instruction & 0x0007;              // Bits 0-2
    uint16_t funct3 = (instruction >> 3) & 0x0007;       // Bits 3-5
    uint16_t rd = (instruction >> 6) & 0x0007;          // Bits 6-8
    uint16_t rs2 = (instruction >> 9) & 0x0007;          // Bits 9-11
    uint16_t funct4 = (instruction >> 12) & 0x000F;      // Bits 12-15
    int16_t imm;
    int f;
    int shamt;

    bool incrementPC = true;

    switch(opcode) {
        case 0:  // R-type
            switch(funct3) {
                case 0:  // ADD, SUB, JR, JALR
                    switch(funct4) {
                        case 0: registers[rd] = registers[rd] + registers[rs2]; break;
                        case 1: registers[rd] = registers[rd] - registers[rs2]; break;
                        case 4: // JR
                            pc = registers[rd];
                            incrementPC = false;
                            break;
                        case 8: // JALR
                            {
                                Word next_pc = pc + 2;
                                pc = registers[rd];
                                registers[rd] = next_pc;
                                incrementPC = false;
                            }
                            break;
                        default: cout << "Unknown R-type instruction" << endl; break;
                    }
                    break;
                case 1: registers[rd] = ((int16_t)registers[rd] < (int16_t)registers[rs2]) ? 1 : 0; break; // SLT
                case 2: registers[rd] = ((uint16_t)registers[rd] < (uint16_t)registers[rs2]) ? 1 : 0; break; // SLTU
                case 3:  // Shifts
                    switch(funct4) {
                        case 2: registers[rd] = registers[rd] << registers[rs2]; break; // SLL
                        case 4: registers[rd] = registers[rd] >> registers[rs2]; break; // SRL
                        case 8: registers[rd] = (int16_t)registers[rd] >> registers[rs2]; break; // SRA
                        default: cout << "Unknown shift instruction" << endl; break;
                    }
                    break;
                case 4: registers[rd] = registers[rd] | registers[rs2]; break; // OR
                case 5: registers[rd] = registers[rd] & registers[rs2]; break; // AND
                case 6: registers[rd] = registers[rd] ^ registers[rs2]; break; // XOR
                case 7: registers[rd] = registers[rs2]; break;  // MV
                default: cout << "Unknown R-type instruction" << endl; break;
            }
            break;
            
        case 1:  // I-type
        imm = (instruction >> 9) & 0x7F; // Bits 9–15
            switch(funct3) {
                case 0: registers[rd] = registers[rd] + imm; break; // ADDI
                case 1: registers[rd] = ((int16_t)registers[rd] < imm) ? 1 : 0; break; // SLTI
                case 2: registers[rd] = ((uint16_t)registers[rd] < (uint16_t)imm) ? 1 : 0; break; // SLTUI
                case 3: 
                    funct4 = (instruction >> 12) & 0x000F; // Bits 12-15
                    // there isn't funct4 explicitly but it's used to figure out which set instruction is it
                    shamt = (instruction >> 10) & 0x7;  // Extract bits 10–12
                
                        switch(funct4) {
                            case 2: registers[rd] = registers[rd] << shamt; break; // SLLI
                            case 4: registers[rd] = registers[rd] >> shamt; break; // SRLI
                            case 8: registers[rd] = (int16_t)registers[rd] >> shamt; break; // SRAI
                            default: cout << "Unknown shift instruction" << endl; break;
                        }
                        break;
                    
                case 4: registers[rd] = registers[rd] | imm; break; // ORI
                case 5: registers[rd] = registers[rd] & imm; break; // ANDI
                case 6: registers[rd] = registers[rd] ^ imm; break; // XORI
                case 7: registers[rd] = imm; break; // LI
                default: cout << "Unknown I-type instruction" << endl; break;
            }
            break;
            
        case 2:  // B-type
            {
                imm = (instruction >> 12) & 0x000F; // Get 4-bit immediate

                // Sign-extend the 4-bit value to a 32-bit signed int
                if (imm & 0x8) { // If the sign bit (bit 3) is set
                    imm |= 0xFFFFFFF0; // Extend the sign to 32 bits
                }
                bool takeBranch = false;
                switch(funct3) {
                    case 0: takeBranch = (registers[rd] == registers[rs2]); break; // BEQ
                    case 1: takeBranch = (registers[rd] != registers[rs2]); break; // BNE
                    case 2: takeBranch = (registers[rd] == 0); break; // BZ
                    case 3: takeBranch = (registers[rd] != 0); break; // BNZ
                    case 4: takeBranch = ((int16_t)registers[rd] < (int16_t)registers[rs2]); break; // BLT
                    case 5: takeBranch = ((int16_t)registers[rd] >= (int16_t)registers[rs2]); break; // BGE
                    case 6: takeBranch = ((uint16_t)registers[rd] < (uint16_t)registers[rs2]); break; // BLTU
                    case 7: takeBranch = ((uint16_t)registers[rd] >= (uint16_t)registers[rs2]); break; // BGEU
                    default: cout << "Unknown branch instruction" << endl; break;
                }
                if (takeBranch) {
                    pc += imm * 2;
                    incrementPC = false;
                    if (debugMode) {
                        cout << "Branch taken. New PC: 0x" << hex << pc << dec << endl;
                    }
                }
            }
            break;
            
        case 3:  // Store
        imm = (instruction >> 12) & 0x000F; // Bits 12-15
            switch (funct3) {
                case 0:  // SB
                    {
                        imm = (instruction >> 12) & 0x000F; // Bits 12-15
                        Address addr = registers[rs2] + imm;
                        if (debugMode) {
                            cout << "Store byte to address 0x" << hex << addr << dec << endl;
                        }
                        if (addr >= MEMORY_SIZE) {
                            cerr << "Store: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        setMemoryByte(addr, registers[rd]);
                    }
                    break;
                case 1:  // SW
                    {
                        imm = (instruction >> 12) & 0x000F; // Bits 12-15
                        Address addr = registers[rs2] + imm;
                        if (debugMode) {
                            cout << "Store word to address 0x" << hex << addr << dec << endl;
                        }
                        if (addr >= MEMORY_SIZE - 1) {
                            cerr << "Store: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        setMemoryWord(addr, registers[rd]);
                    }
                    break;
                
                default:
                    cout << "Unknown store instruction" << endl;
                    break;
            }
            break;
            
        case 4:  // Load
        imm = (instruction >> 12) & 0x000F; // Bits 12-15

            switch(funct3) {
                case 0:  // LB
                    {
                        Address addr = registers[rs2] + imm;
                        if (debugMode) {
                            cout << "Load byte from address 0x" << hex << addr << dec << endl;
                        }
                        if (addr >= MEMORY_SIZE) {
                            cerr << "Load: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        int8_t byte = getMemoryByte(addr);
                        registers[rd] = (int16_t)byte;  // Sign extend
                    }
                    break;
                case 1:  // LW
                    {
                        Address addr = registers[rs2] + imm;
                        if (debugMode) {
                            cout << "Load word from address 0x" << hex << addr << dec << endl;
                        }
                        if (addr >= MEMORY_SIZE - 1) {
                            cerr << "Load: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        registers[rd] = getMemoryWord(addr);
                    }
                    break;
                case 4:  // LBU
                    {
                        Address addr = registers[rs2] + imm;
                        if (debugMode) {
                            cout << "Load byte unsigned from address 0x" << hex << addr << dec << endl;
                        }
                        if (addr >= MEMORY_SIZE) {
                            cerr << "Load: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        registers[rd] = (uint16_t)(uint8_t)getMemoryByte(addr);
                    }
                    break;
                default:
                    cout << "Unknown load instruction" << endl;
                    break;
            }
            break;
            
        case 5:  // J-type
            {
                f = (instruction >> 15) & 0x1; // Bit 15
                imm = ((instruction >> 10) & 0x1F) << 4 | ((instruction >> 4) & 0xF);
                // Sign-extend the 4-bit value to a 32-bit signed int
                if (imm & 0x8) { // If the sign bit (bit 3) is set
                    imm |= 0xFFFFFFF0; // Extend the sign to 32 bits
                }
                switch (f) {
                {
                case 0: // J
                {
                    pc += imm * 2;
                    incrementPC = false;
                }
                    break;
                case 1: // JAL
                    {
                        Word next_pc = pc + 2;
                        pc += imm * 2;
                        registers[rd] = next_pc;
                        incrementPC = false;
                    }
                    break;
                
                default:
                    break;
                }
            }
        }
            break;
            
        case 6:  // U-type
            if (instruction & 0x8000) {  // AUIPC
                registers[rd] = pc + ((imm & 0x3F) << 10);
            } else {  // LUI
                registers[rd] = (imm & 0x3F) << 10;
            }
            break;
            
        case 7:  // System
            switch(rd) {
                case 1:  // Print integer
                    {
                        // Store the value before ecall to ensure it's not modified
                        int16_t value_to_print = (int16_t)registers[6];
                        cout << "Integer Output: " << value_to_print << endl;
                    }
                    break;
                case 3:  // Terminate program
                    cout << "Program terminated by ecall 3" << endl;
                    running = false;
                    return;
                case 5:  // Print string
                    {
                        cout << "String Output: ";
                        Address addr = registers[0];
                        if (addr >= MEMORY_SIZE) {
                            cerr << "String: Memory access out of bounds at address 0x" 
                                 << hex << addr << dec << endl;
                            break;
                        }
                        string output;
                        while (addr < MEMORY_SIZE) {
                            char c = (char)memory[addr++];
                            if (c == 0) break;  // NULL terminator
                            output += c;
                        }
                        cout << output << endl;
                    }
                    break;
                default:
                    cout << "Unknown ecall: " << rd << endl;
                    break;
            }
            break;
            
        default:
            cout << "Unknown instruction: 0x" << hex << instruction << dec << endl;
            break;
    }
    
    if (incrementPC) {
        pc += 2;  // Increment PC by 2 (1 word as here each instruction is 2 bytes)
    }
    
    if (debugMode) {
        cout << "Register state after execution:" << endl;
        for (int i = 0; i < NUM_REGISTERS; i++) {
            cout << "x" << i << ": " << registers[i] << " ";
        }
        cout << endl << endl;
    }
}