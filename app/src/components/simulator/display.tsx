import { Button } from "@/components/ui/button";
import { useSimulatorStore } from "@/lib/store/simulator";
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

/**
 * ZX16 Display Component
 *
 * Props:
 *   - className?: string
 *   - memory?: Uint16Array (word-addressed, 2 bytes per element)
 */
const Screen = memo(({ className }: { className?: string }) => {
  const memory = useSimulatorStore((s) => s.memory);
  const [screenOn, setScreenOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);

  /**
   * Read a byte from a word-addressed buffer
   * @param addr byte address
   * @returns 0–255 value
   */
  const readByte = (addr: number): number => {
    const word = memory[addr >> 1] ?? 0;
    return (addr & 1) === 0 ? word & 0xff : (word >> 8) & 0xff;
  };

  // Build 16-color palette from RGB332 at 0xFA00
  const palette = useMemo(() => {
    const cols: { r: number; g: number; b: number }[] = [];
    const base = 0xfa00;
    for (let i = 0; i < 16; i++) {
      const byte = readByte(base + i);
      const r = Math.ceil(((byte >> 5) & 0x07) * 36.4);
      const g = Math.ceil(((byte >> 2) & 0x07) * 36.4);
      const b = (byte & 0x03) * 85;
      cols.push({ r, g, b });
    }
    return cols;
  }, [memory]);

  // Decode tile graphics: 16 tiles, each 16×16 pixels, two pixels per byte
  const tileDefinitions = useMemo(() => {
    const tiles: Uint8Array[] = new Array(16);
    const tilesBase = 0xf200;
    for (let t = 0; t < 16; t++) {
      const arr = new Uint8Array(256);
      const baseAddr = tilesBase + t * 128;
      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < 16; col += 2) {
          const byteIdx = row * 8 + col / 2;
          const byte = readByte(baseAddr + byteIdx);
          arr[row * 16 + col] = byte & 0x0f;
          arr[row * 16 + col + 1] = (byte >> 4) & 0x0f;
        }
      }
      tiles[t] = arr;
    }
    return tiles;
  }, [memory]);

  // Load tile map (20×15 = 300 bytes at 0xF000): each byte = one tile index (0–15)
  const tileMap = useMemo(() => {
    const map = new Uint8Array(300);
    const mapBase = 0xf000;
    for (let i = 0; i < 300; i++) {
      map[i] = readByte(mapBase + i) & 0x0f;
    }
    return map;
  }, [memory]);

  // Render to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    if (!imageDataRef.current) {
      imageDataRef.current = ctx.createImageData(320, 240);
    }
    const imageData = imageDataRef.current;
    const data = imageData.data;

    if (!screenOn) {
      data.fill(0);
    } else {
      let idx = 0;
      for (let ty = 0; ty < 15; ty++) {
        for (let tx = 0; tx < 20; tx++) {
          const tile = tileMap[idx++]!;
          const pixels = tileDefinitions[tile]!;
          const startX = tx * 16;
          const startY = ty * 16;

          for (let y = 0; y < 16; y++) {
            for (let x = 0; x < 16; x++) {
              const ci = pixels[y * 16 + x];
              const { r, g, b } = palette[ci];
              const px = startX + x;
              const py = startY + y;
              const off = (py * 320 + px) * 4;
              data[off] = r;
              data[off + 1] = g;
              data[off + 2] = b;
              data[off + 3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [screenOn, palette, tileDefinitions, tileMap]);

  return (
    <div
      className={cn(className, "flex flex-col items-center justify-center p-4")}
    >
      <h1 className="text-white text-2xl mb-4 font-bold">ZX16 Display</h1>
      <div className="relative bg-gray-900 p-4 rounded-lg shadow-2xl">
        <div className="bg-black rounded">
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="block"
            style={{ imageRendering: "pixelated" }}
          />
        </div>
        <div className="absolute top-2 right-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              screenOn
                ? "bg-green-500 shadow-green-500/50 shadow-sm"
                : "bg-red-900"
            )}
          />
        </div>
      </div>
      <div className="mt-4 flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setScreenOn(!screenOn)}
          className={cn(
            "flex items-center gap-2 transition-all",
            screenOn
              ? "text-green-500 border-green-500"
              : "text-red-500 border-red-500"
          )}
        >
          <Power className="w-5 h-5" />
          {screenOn ? "Screen On" : "Screen Off"}
        </Button>
      </div>
      <div className="mt-4 text-xs text-gray-500 font-mono">
        <div>Resolution: 320×240 (QVGA)</div>
        <div>Tiles: 20×15 (16×16px each)</div>
        <div>Colors: 16 (RGB332 format)</div>
      </div>
    </div>
  );
});

Screen.displayName = "Screen";
export default Screen;
