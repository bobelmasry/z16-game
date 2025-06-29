# Z16 Game - RISC Architecture Simulator & Web Interface

## 🎯 Overview

Z16 Game is an educational platform that simulates a custom 16-bit RISC processor architecture. It includes:

- **ZX16 Assembler**: A complete two-pass assembler written in Python
- **Web Interface**: A modern Next.js/React application for interactive assembly programming
- **Instruction Decoder**: Real-time binary-to-assembly translation
- **Register Visualization**: Live register state monitoring
- **Memory Management**: Complete memory simulation with read/write operations

## 🏗️ Architecture

### ZX16 Processor Specifications

- **Word Size**: 16-bit
- **Registers**: 8 general-purpose registers (x0-x7)
- **Memory**: 64KB addressable space
- **Instruction Set**: RISC-style with 7 instruction formats
- **Endianness**: Little-endian

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (for web interface)
- **Python** 3.8+ (for assembler)
- **Yarn** or **npm** (package manager)

## 🛠️ Components

### 1. ZX16 Simulator (`main/`)

- **Complete instruction execution**
- **Memory management** (64KB)
- **Register state tracking**
- **Debug mode** with step-by-step execution
- **Binary file loading**


### 2. Web Interface (`app/`)

A modern React/Next.js application providing:

- **Interactive assembly editor** with syntax highlighting
- **Real-time instruction decoding**
- **Register state visualization**
- **Memory inspection**
- **Step-by-step execution**
- **Console output display**

**Features:**
- File upload for binary programs
- Live instruction decoding
- Register value monitoring
- Memory read/write operations
- System call simulation


## 🧪 Testing

The project includes comprehensive test cases in the `tests/` directory:

- **ex-1.s**: Basic instruction testing
- **ex-2.s**: Memory operations testing
- **ex-3.s**: Control flow
- **ex-4.s**: Arithmetic operations
- **ex-5.s**: Logical operations
- **ex-6.s**: System calls through Fibonacci 


## 🔧 Development

### Adding New Instructions

1. **Update the assembler** (`assembler/zx16asm.py`)
2. **Update the simulator** (`main/zx16sim.cpp`)
3. **Update the web decoder** (`app/src/utils/decoder.ts`)
4. **Update the web executor** (`app/src/utils/execute.ts`)
5. **Add test cases** in `tests/`





