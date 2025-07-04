"use client";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useEffect, useState } from "react";

const TILE_MAP_ADDR = 0xF000;
const TILE_SET_ADDR = 0xF200;
const PALETTE_ADDR = 0xFA00;

const TILE_SIZE = 16;
const SCREEN_WIDTH_TILES = 20;
const SCREEN_HEIGHT_TILES = 15;

export default function GameDisplay() {
  const memory = useSimulatorStore((s) => s.memory);
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    // Extract RGB palette
    const palette: string[] = [];
    for (let i = 0; i < 16; i++) {
      const byte = memory[PALETTE_ADDR + i];
      const r = ((byte >> 5) & 0b111) * 36;  // scale 3-bit to 0–255
      const g = ((byte >> 2) & 0b111) * 36;
      const b = (byte & 0b11) * 85;          // 2-bit to 0–255
      palette.push(`rgb(${r},${g},${b})`);
    }
    setColors(palette);
  }, [memory]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2 text-green-400 font-mono">
        Display
      </h2>
      <div className="w-[640px] h-[480px] grid grid-cols-20 grid-rows-15 gap-0">
        {Array.from({ length: SCREEN_WIDTH_TILES * SCREEN_HEIGHT_TILES }).map((_, index) => {
          const tileIndex = memory[TILE_MAP_ADDR + index]; // 0–15
          const tilePixelData = new Uint8Array(
            memory.buffer,
            TILE_SET_ADDR + tileIndex * 128,
            128
          );

          return (
            <Tile
              key={index}
              tileBytes={tilePixelData}
              colors={colors}
            />
          );
        })}
      </div>
    </div>
  );
}

function Tile({ tileBytes, colors }: { tileBytes: Uint8Array; colors: string[] }) {
  const pixels: string[] = [];

  for (let i = 0; i < tileBytes.length; i++) {
    const byte = tileBytes[i];
    const low = byte & 0x0F;
    const high = (byte >> 4) & 0x0F;
    pixels.push(colors[high] || "#000");
    pixels.push(colors[low] || "#000");
  }

  return (
    <div className="grid grid-cols-16 grid-rows-16 w-[32px] h-[32px]">
      {pixels.map((color, i) => (
        <div
          key={i}
          style={{ backgroundColor: color }}
          className="w-[2px] h-[2px]"
        />
      ))}
    </div>
  );
}
