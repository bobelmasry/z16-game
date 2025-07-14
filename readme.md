# Z16 Game: z16 Simulator & Assembler

## 🕹️ Overview

**Deployed at**: [https://z16-game.vercel.app/](https://z16-game.vercel.app/)

**Z16 Game** is a platform for simulating the custom z16 architecture. It features:
- **Assembler**: Python-based assembler for the Z16 ISA
- **Web Simulator**: Interactive Next.js/React app for running and visualizing assembly code
- **Game Demos**: Example Z16 games (e.g., Pong) for demonstration and testing
- **Test Suite**: Example programs and test cases for validation

---

## 📁 Repository Structure

- `app/` — Web simulator (Next.js/React)
  - `src/components/simulator/` — UI for code, display, registers, controls, console, file upload
  - `src/lib/utils/` — Utilities for decoding the machine code
  - `src/lib/worker.ts` — worker code for multi-threading (so the simulation runs on another thread other than the UI thread)
  - `src/lib/simulator.ts` — actual simulator implementation
- `assembler/` — Python assembler
  - `src/` — Assembler implementation (`main.py`, `first_pass.py`, `second_pass.py`, etc.)
  - `docs/` — Architecture, instruction set, and contributing documentation
  - `examples/` — Example Z16 programs and binaries
- `game/` — Example Z16 games (e.g., Pong) in `.z16` and `.bin` formats for simulation and analysis
- `tests/` — Assembly source and binary test cases

---

## ⚙️ Features

- **Custom 16-bit z16 ISA**: 8 registers, 64KB memory, 7 instruction formats
- **Assembler**: Converts `.s`/`.z16` source to `.bin` binaries
- **Simulator**: Step-by-step execution, register visualization, console output
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

- **Test Suite** (`tests/`):
- x: this means it highly tests them
- .: this mean it barely tests them but have at least an instruction from them

| Test Case   | R_type | I_type | Save/Load | Branch/Jump | ECALLs | Decoding | Stack | Psudo instructions | Memory Edge Cases |
|-------------|:------:|:------:|:---------:|:-----------:|:------:|:--------:|:-----:|:----------------:|:----------------:|
| ex-1.z16    |   x    |   x    |     x     |      x      |   .    |    x     |       |        .         |                  |
| ex-2.z16    |   x    |        |           |      x      |   .    |    x     |       |        .         |                  |
| ex-3.z16    |        |   x    |     x     |             |   .    |    x     |       |        .         |                  |
| ex-4.z16    |        |        |           |      x      |   .    |    x     |       |                  |                  |
| ex-5.z16    |   .    |   x    |           |             |   .    |    x     |       |                  |                  |
| ex-6.z16    |        |   x    |     x     |      x      |        |    x     |       |        .         |                  |
| ex-7.z16    |   .    |   x    |           |      x      |        |    x     |       |        x         |                  |
| ex-8.z16    |   x    |   x    |     x     |      x      |        |    x     |   x   |        x         |                  |
| ex-9.z16    |        |   X    |           |             |   x    |    x     |       |                  |                  |
| ex-10.z16   |        |        |     x     |             |   x    |    x     |       |                  |        x         |

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
- **ECalls**: Read/Print String, Read Integer, Play Tone, Set Volume, Stop Audio, Read Keyboard, Registers/Memory Dump, Program Exit, Get Random (Bonus)

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

**Games**
- Pong Game: a complete z16 coded pong game
- Tetris: incomplete version of tetris


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
   python main.py <source.s> 
   ```




