# Z16 Game: z16 Simulator & Assembler

## 🕹️ Overview

**Z16 Game** is an educational platform for simulating and programming a custom z16 architecture. It features:

- **Assembler**: Python-based assembler for the Z16 ISA
- **Web Simulator**: Interactive Next.js/React app for running and visualizing assembly code
- **Game Demos**: Example Z16 games (e.g., Pong) for demonstration and testing
- **Test Suite**: Example programs and test cases for validation

---

## 📁 Repository Structure

- `app/` — Web simulator (Next.js/React)
  - `src/components/simulator/` — UI for code, display, registers, controls, console, file upload
  - `src/lib/utils/` — Core logic for instruction decoding, execution, and architecture
- `assembler/` — Python assembler
  - `src/` — Assembler implementation (`main.py`, `first_pass.py`, `second_pass.py`, etc.)
  - `docs/` — Architecture, instruction set, and contributing documentation
  - `examples/` — Example Z16 programs and binaries
- `game/` — Example Z16 games (e.g., Pong) in `.z16` and `.bin` formats for simulation and analysis
- `tests/` — Assembly source and binary test cases

---

## ⚙️ Features

- **Custom 16-bit z16 ISA**: 8 registers, 64KB memory, 7 instruction formats
- **Assembler**: Converts `.s` source to `.bin` binaries
- **Simulator**: Step-by-step execution, register/memory visualization, console output
- **Web UI**: Syntax highlighting, file upload, live decoding, system call simulation
- **2D Tiled Graphics System**: QVGA (320x240), 16x16 pixel tiles, 16-color palette, memory-mapped display
- **Game Demos**: Play and analyze example Z16 games (see `game/`)

---

## 🖥️ Web Simulator

- Built with Next.js, React, Zustand, Monaco Editor, and Radix UI
- **Display**: 320x240 QVGA, 20x15 grid of 16x16 tiles, 16-color palette (RGB332)
- **Registers**: Live view of all CPU registers
- **PC Counter**: Shows current program counter
- **Console**: Simulates system calls for input/output
- **Controls**: Step, run, pause, reset, and speed adjustment

### Key Files

- `app/src/components/simulator/display.tsx`: Implements the 2D tiled graphics system, memory-mapped at 0xF000 (tilemap), 0xF200 (tile data), 0xFA00 (palette)
- `app/src/components/simulator/console.tsx`: Handles console I/O and system calls
- `app/src/lib/utils/decoder.ts` and `types/instruction.ts`: Define and decode the Z16 instruction set

---

## 🧪 Test Suite & Game Demos

- **Test Suite** (`tests/`):
    ### Test Cases Overview (tests/ex-1.z16 to tests/ex-10.z16)

- **ex-1.z16:**  
  *Basic Instructions Test*  
  Covers all instruction formats (R, I, memory, branch, jump, upper immediate, system call, etc.) with basic operands and control flow.

- **ex-2.z16:**  
  *R-Type Instructions*  
  Tests all R-type instructions and register operations, including a function call and jump-and-link-register.

- **ex-3.z16:**  
  *I-Type Instructions*  
  Exercises all I-type instructions (addi, slti, sltui, slli, srli, srai, ori, andi, xori, li) and their effects.

- **ex-4.z16:**  
  *Stack Operations & Recursion*  
  Demonstrates stack management and recursion by computing a sum using a recursive function.

- **ex-5.z16:**  
  *Logical Operations*  
  Tests logical instructions (AND, OR, XOR, ANDi, ORi, XORi) and their combinations.

- **ex-6.z16:**  
  *LUI and AUIPC*  
  Demonstrates loading 16-bit values into registers using LUI and AUIPC, and combining with ADDI.

- **ex-7.z16:**  
  *Pseudo-Instructions*  
  Exercises pseudo-instructions like nop, li16, mv, ret, la, call, j, jr, and verifies their expansion and effect.

- **ex-8.z16:**  
  *Fibonacci/Stack/Arithmetic*  
  Computes the Fibonacci sequence using recursion, stack operations, and arithmetic.

- **ex-9.z16:**  
  *All ECALL Instructions*  
  Tests all system calls (ReadString, ReadInteger, PrintString, PlayTone, SetAudioVolume, StopAudioPlayback, ReadKeyboard, RegistersDump, MemoryDump, ProgramExit) with appropriate arguments and output.

- **ex-10.z16:**  
  *ECALL Memory Dump Edge Cases*  
  Exercises the memory dump ECALL with edge cases: dumping from the start/end of memory, zero/overflow/unaligned lengths, and writing/reading the last byte.

- **Game Demos** (`game/`):
  - Example Z16 games (e.g., `pong.z16`, `pong.bin`) for simulation and analysis

---

## 🖼️ 2D Tiled Graphics System

- **Screen**: 320x240 pixels (QVGA), 20x15 tiles (16x16 pixels each)
- **Tile Map Buffer**: 0xF000, 300 bytes (20x15 grid, 1 byte per tile)
- **Tile Definitions**: 0xF200, 2048 bytes (16 tiles × 128 bytes, 4bpp, packed)
- **Color Palette**: 0xFA00, 16 bytes (RGB332, 3 bits R, 3 bits G, 2 bits B)
- **Rendering**: See `display.tsx` for palette, tile, and screen rendering logic

---

## 🏗️ Architecture & Instruction Set

- **Instruction Formats**: R, I, B, S, L, J, U, ECall (see `types/instruction.ts`)
- **Opcodes**: 0–7 (Rtype, Itype, Btype, Stype, Ltype, Jtype, Utype, ECall)
- **System Calls**: Read/Print String, Read Integer, Play Tone, Set Volume, Stop Audio, Read Keyboard, Registers/Memory Dump, Program Exit, Get Random

---

## 📦 Dependencies

- **Web**: Next.js, React, Zustand, Monaco Editor, Radix UI, TailwindCSS, Immer, Lucide React
- **Assembler**: Python 3.8+, standard library

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (for web simulator)
- Python 3.8+ (for assembler)
- Yarn or npm (for frontend dependencies)

### Setup

1. **Install dependencies**
   - Web:
     ```sh
     cd app
     yarn install
     # or
     npm install
     ```
   - Assembler:
     ```sh
     cd assembler/src
     # (install requirements if any)
     ```

2. **Run the web simulator**
   ```sh
   cd app
   yarn dev
   # or
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Assemble a program**
   ```sh
   cd assembler/src
   python main.py <source.s> -o <output.bin>
   ```

---

## 📚 Documentation

- See `assembler/docs/` for architecture, instruction set, and contributing guidelines
- Example programs in `assembler/examples/`, `game/`, and `tests/`

---

### Test Cases Overview (tests/ex-1.z16 to tests/ex-10.z16)

- **ex-1.z16:**  
  *Basic Instructions Test*  
  Covers all instruction formats (R, I, memory, branch, jump, upper immediate, system call, etc.) with basic operands and control flow.

- **ex-2.z16:**  
  *R-Type Instructions*  
  Tests all R-type instructions and register operations, including a function call and jump-and-link-register.

- **ex-3.z16:**  
  *I-Type Instructions*  
  Exercises all I-type instructions (addi, slti, sltui, slli, srli, srai, ori, andi, xori, li) and their effects.

- **ex-4.z16:**  
  *Stack Operations & Recursion*  
  Demonstrates stack management and recursion by computing a sum using a recursive function.

- **ex-5.z16:**  
  *Logical Operations*  
  Tests logical instructions (AND, OR, XOR, ANDi, ORi, XORi) and their combinations.

- **ex-6.z16:**  
  *LUI and AUIPC*  
  Demonstrates loading 16-bit values into registers using LUI and AUIPC, and combining with ADDI.

- **ex-7.z16:**  
  *Pseudo-Instructions*  
  Exercises pseudo-instructions like nop, li16, mv, ret, la, call, j, jr, and verifies their expansion and effect.

- **ex-8.z16:**  
  *Fibonacci/Stack/Arithmetic*  
  Computes the Fibonacci sequence using recursion, stack operations, and arithmetic.

- **ex-9.z16:**  
  *All ECALL Instructions*  
  Tests all system calls (ReadString, ReadInteger, PrintString, PlayTone, SetAudioVolume, StopAudioPlayback, ReadKeyboard, RegistersDump, MemoryDump, ProgramExit) with appropriate arguments and output.

- **ex-10.z16:**  
  *ECALL Memory Dump Edge Cases*  
  Exercises the memory dump ECALL with edge cases: dumping from the start/end of memory, zero/overflow/unaligned lengths, and writing/reading the last byte.