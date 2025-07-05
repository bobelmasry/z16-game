"use client";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useEffect, useRef } from "react";

const TILE_MAP_ADDR = 0xF000;
const TILE_SET_ADDR = 0xF200;
const PALETTE_ADDR = 0xFA00;

const TILE_SIZE = 16;
const SCREEN_WIDTH_TILES = 20;
const SCREEN_HEIGHT_TILES = 15;
const SCREEN_WIDTH_PX = SCREEN_WIDTH_TILES * TILE_SIZE;   // 320
const SCREEN_HEIGHT_PX = SCREEN_HEIGHT_TILES * TILE_SIZE; // 240

export default function GameDisplay() {
  const memory = useSimulatorStore((s) => s.memory);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.createImageData(SCREEN_WIDTH_PX, SCREEN_HEIGHT_PX);
    const data = imageData.data;

    // Build color palette
    const palette: [number, number, number][] = [];
    for (let i = 0; i < 16; i++) {
      const byte = memory[PALETTE_ADDR + i];
      const r = ((byte >> 5) & 0b111) * 36;
      const g = ((byte >> 2) & 0b111) * 36;
      const b = (byte & 0b11) * 85;
      palette.push([r, g, b]);
    }

    // Render each tile
    for (let ty = 0; ty < SCREEN_HEIGHT_TILES; ty++) {
      for (let tx = 0; tx < SCREEN_WIDTH_TILES; tx++) {
        const tileOffset = ty * SCREEN_WIDTH_TILES + tx;
        const tileIndex = memory[TILE_MAP_ADDR + tileOffset];
        const tileStart = TILE_SET_ADDR + tileIndex * 128;

        for (let row = 0; row < TILE_SIZE; row++) {
          for (let col = 0; col < TILE_SIZE; col += 2) {
            const byteIndex = row * 8 + col / 2;
            const byte = memory[tileStart + byteIndex];
            const high = (byte >> 4) & 0x0F;
            const low = byte & 0x0F;

            const x0 = tx * TILE_SIZE + col;
            const y0 = ty * TILE_SIZE + row;
            const baseIndex0 = (y0 * SCREEN_WIDTH_PX + x0) * 4;
            const baseIndex1 = (y0 * SCREEN_WIDTH_PX + x0 + 1) * 4;

            const [r0, g0, b0] = palette[high];
            data[baseIndex0] = r0;
            data[baseIndex0 + 1] = g0;
            data[baseIndex0 + 2] = b0;
            data[baseIndex0 + 3] = 255;

            const [r1, g1, b1] = palette[low];
            data[baseIndex1] = r1;
            data[baseIndex1 + 1] = g1;
            data[baseIndex1 + 2] = b1;
            data[baseIndex1 + 3] = 255;
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [memory]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400 font-mono">
        Display
      </h2>
      <canvas
        ref={canvasRef}
        width={SCREEN_WIDTH_PX}
        height={SCREEN_HEIGHT_PX}
        className="retro-display border border-green-500"
        style={{ imageRendering: "pixelated" }}
      />
    </div>
  );
}
