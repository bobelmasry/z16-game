import { Button } from "@/components/ui/button";
import { BUFS } from "@/hooks/use-simulator";
import { cn } from "@/lib/utils";
import { Power } from "lucide-react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

const Screen = memo(({ className }: { className?: string }) => {
  // — pull in your SharedArrayBuffer and wrap it
  const memory = useRef(new Uint16Array(BUFS.memory)).current;

  const [screenOn, setScreenOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // offscreen atlas & ImageData, created once
  const sheetRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<ImageData>(null);

  // helper to read a byte from the word-array
  const readByte = (addr: number) => {
    const w = memory[addr >> 1] || 0;
    return (addr & 1) === 0 ? w & 0xff : (w >> 8) & 0xff;
  };

  // set up offscreen canvas + ImageData on client
  useEffect(() => {
    if (typeof document === "undefined") return;
    const sheet = document.createElement("canvas");
    sheet.width = 16 * 16;
    sheet.height = 16;
    sheetRef.current = sheet;

    const ctx = sheet.getContext("2d", { alpha: false })!;
    imgRef.current = ctx.createImageData(16, 16);
  }, []);

  // continuous draw loop
  useEffect(() => {
    const sheet = sheetRef.current;
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!sheet || !img || !canvas) return;
    const sheetCtx = sheet.getContext("2d", { alpha: false })!;
    const ctx = canvas.getContext("2d", { alpha: false })!;

    let rafId: number;
    const draw = () => {
      const data = img.data;

      // 1) rebuild palette (16 entries)
      const pbase = 0xfa00;
      const palette: [number, number, number][] = new Array(16) as any;
      for (let i = 0; i < 16; i++) {
        const b = readByte(pbase + i);
        palette[i] = [
          Math.ceil(((b >> 5) & 0x07) * 36.4),
          Math.ceil(((b >> 2) & 0x07) * 36.4),
          (b & 0x03) * 85,
        ];
      }

      // 2) rebuild all 16 tiles into the atlas
      const tbase = 0xf200;
      for (let t = 0; t < 16; t++) {
        const baseAddr = tbase + t * 128;
        // fill img.data for this tile
        for (let y = 0; y < 16; y++) {
          for (let x = 0; x < 16; x += 2) {
            const byte = readByte(baseAddr + y * 8 + x / 2);
            const lo = byte & 0x0f,
              hi = (byte >> 4) & 0x0f;
            const offs = (y * 16 + x) * 4;
            const [r1, g1, b1] = palette[lo];
            const [r2, g2, b2] = palette[hi];
            data[offs] = r1;
            data[offs + 1] = g1;
            data[offs + 2] = b1;
            data[offs + 3] = 255;
            data[offs + 4] = r2;
            data[offs + 5] = g2;
            data[offs + 6] = b2;
            data[offs + 7] = 255;
          }
        }
        sheetCtx.putImageData(img, t * 16, 0);
      }

      // 3) blit to onscreen canvas
      if (!screenOn) {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, 320, 240);
      } else {
        const mbase = 0xf000;
        let idx = 0;
        for (let ty = 0; ty < 15; ty++) {
          for (let tx = 0; tx < 20; tx++, idx++) {
            const tile = readByte(mbase + idx) & 0x0f;
            ctx.drawImage(
              sheet,
              tile * 16,
              0,
              16,
              16,
              tx * 16,
              ty * 16,
              16,
              16
            );
          }
        }
      }

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [screenOn]);

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
          onClick={() => setScreenOn((on) => !on)}
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
