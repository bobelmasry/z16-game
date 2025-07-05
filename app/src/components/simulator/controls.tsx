"use client";
import { Button } from "../ui/button";
import { Ban, Pause, Play, RefreshCw, StepForward } from "lucide-react";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useShallow } from "zustand/shallow";
import { useOperatingSystemStore } from "@/lib/store/os";
import { Slider } from "../ui/slider";
import { SimulatorState } from "@/lib/utils/types";
import { useEffect, useRef, useState } from "react";
import { BUFS } from "@/hooks/use-simulator";

export default function Controls() {
  const { reset, step, start, pause, speed, setSpeed } = useSimulatorStore(
    useShallow((s) => ({
      reset: s.reset,
      step: s.step,
      start: s.start,
      pause: s.pause,
      speed: s.speed,
      setSpeed: s.setSpeed,
    }))
  );
  const fileName = useOperatingSystemStore((s) => s.fileName);
  const [state, setState] = useState<SimulatorState>(SimulatorState.Paused);
  const prevStateRef = useRef<SimulatorState>(SimulatorState.Paused);

  useEffect(() => {
    let frame: number;
    const check = () => {
      const curr = new Uint16Array(BUFS.state);
      // simple deep-equal; for large buffers you might only diff a small window
      let changed = prevStateRef.current !== curr[0];

      if (changed) {
        prevStateRef.current = curr[0];
        setState(curr[0] as SimulatorState);
      }
      frame = requestAnimationFrame(check);
    };
    frame = requestAnimationFrame(check);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="w-screen h-12 retro-header flex items-center justify-between px-4 py-2">
      {/* Simulation Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={reset}
          variant="outline"
          className="retro-button flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </Button>
        {state == SimulatorState.Running ? (
          <Button
            onClick={pause}
            variant="outline"
            className="retro-button flex items-center gap-2"
          >
            <Pause className="w-4 h-4" /> Pause
          </Button>
        ) : state === SimulatorState.Blocked ? (
          <Button
            onClick={start}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={true}
          >
            <Ban /> Blocked
          </Button>
        ) : (
          <Button
            onClick={start}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={state === SimulatorState.Halted || fileName == null}
          >
            <Play className="w-4 h-4" /> Start
          </Button>
        )}
        {state !== SimulatorState.Running && (
          <Button
            onClick={step}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={
              state === SimulatorState.Halted ||
              state === SimulatorState.Blocked ||
              fileName == null
            }
          >
            <StepForward className="w-4 h-4" /> Step
          </Button>
        )}
        <p className="p-2 text-green-400 font-mono">Simulation speed: </p>
        <Slider
          value={[speed]}
          max={10000}
          min={1}
          step={1}
          className="retro-slider w-40 h-4"
          onValueChange={(value) => {
            setSpeed(value[0]);
          }}
        />
        <p className="p-2 text-green-400 font-mono">{speed} Hz</p>
      </div>
      <h1 className="text-green-400 font-bold text-2xl font-mono retro-terminal-text">
        Zx16 Simulator
      </h1>
    </div>
  );
}
