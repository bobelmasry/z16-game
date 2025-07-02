"use client";
import { Button } from "../ui/button";
import { Ban, Pause, Play, RefreshCw, StepForward } from "lucide-react";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useShallow } from "zustand/shallow";
import { useOperatingSystemStore } from "@/lib/store/os";
import { Slider } from "../ui/slider";

export default function Controls() {
  const { reset, step, play, pause, state, speed, setSpeed } =
    useSimulatorStore(
      useShallow((s) => ({
        reset: s.reset,
        step: s.step,
        play: s.play,
        pause: s.pause,
        state: s.state,
        speed: s.speed,
        setSpeed: s.setSpeed,
      }))
    );
  const fileName = useOperatingSystemStore((s) => s.fileName);
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
        {state == "running" ? (
          <Button
            onClick={pause}
            variant="outline"
            className="retro-button flex items-center gap-2"
          >
            <Pause className="w-4 h-4" /> Pause
          </Button>
        ) : state === "blocked" ? (
          <Button
            onClick={play}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={true}
          >
            <Ban /> Blocked
          </Button>
        ) : (
          <Button
            onClick={play}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={state === "halted" || fileName == null}
          >
            <Play className="w-4 h-4" /> Start
          </Button>
        )}
        {state !== "running" && (
          <Button
            onClick={step}
            variant="outline"
            className="retro-button flex items-center gap-2"
            disabled={
              state === "halted" || state === "blocked" || fileName == null
            }
          >
            <StepForward className="w-4 h-4" /> Step
          </Button>
        )}
        <p className="p-2 text-green-400 font-mono">Simulation speed: </p>
        <Slider
          value={[speed]}
          max={500}
          min={0.5}
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
