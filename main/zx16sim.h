#ifndef Z16SIM_H
#define Z16SIM_H

#include <vector>
#include <string>
#include <fstream>
#include <map>
#include <cstdint>

using namespace std;

// Data types and constants
using Byte = uint8_t;
using Word = uint16_t;
using Address = uint16_t;
constexpr int MEMORY_SIZE = 65536;  // 64K memory
constexpr int NUM_REGISTERS = 8;    // 8 registers for Z16

// CPU and memory structures
class Z16Simulator {
private:
    // Memory and registers
    Byte memory[MEMORY_SIZE];
    Word registers[NUM_REGISTERS];
    Address pc;  // Program counter
    bool running;
    bool debugMode;  // Debug mode flag
    size_t programSize;  // Added programSize member

    // Helper functions
    void reset();  // Added reset declaration

    // Instruction execution
    void executeInstruction(Word instruction, bool debugMode);

public:
    // Constructor and main methods
    Z16Simulator();
    bool loadBinaryFile(const string& filename, bool debugMode = false);
    bool loadAssembly(const string& filename);  // Added loadAssembly declaration
    string decodeInstruction(Word instruction);
    void run(bool debugMode = false);

    // Helper functions for testing and debugging
    Byte getMemoryByte(Address addr);
    Word getMemoryWord(Address addr);
    void setMemoryWord(Address addr, Word value);
    void setMemoryByte(Address addr, int16_t value);
};

#endif // Z16SIM_H