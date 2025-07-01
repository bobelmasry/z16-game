"use client";
import { Button } from "../ui/button";
import { Ban, Pause, Play, RefreshCw, StepForward } from "lucide-react";
import { useSimulatorStore } from "@/lib/store/simulator";
import { useShallow } from "zustand/shallow";
import { useOperatingSystemStore } from "@/lib/store/os";
import { Slider } from "../ui/slider";

export default function Controls() {
  const { reset, step, play, pause, state } = useSimulatorStore(
    useShallow((s) => ({
      reset: s.reset,
      step: s.step,
      play: s.play,
      pause: s.pause,
      state: s.state,
    }))
  );
  const fileName = useOperatingSystemStore((s) => s.fileName);
  return (
    <div className="w-screen h-12 bg-neutral-900 flex items-center justify-between px-4 py-2">
      {/* Simulation Buttons */}
      <div className="flex items-center gap-2">
        <Button
          onClick={reset}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Reset
        </Button>
        {state == "running" ? (
          <Button
            onClick={pause}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="w-4 h-4" /> Pause
          </Button>
        ) : state === "blocked" ? (
          <Button
            onClick={play}
            variant="outline"
            className="flex items-center gap-2"
            disabled={true}
          >
            <Ban /> Blocked
          </Button>
        ) : (
          <Button
            onClick={play}
            variant="outline"
            className="flex items-center gap-2"
            disabled={state === "halted" || fileName == null}
          >
            <Play className="w-4 h-4" /> Start
          </Button>
        )}
        {state !== "running" && (
          <Button
            onClick={step}
            variant="outline"
            className="flex items-center gap-2"
            disabled={
              state === "halted" || state === "blocked" || fileName == null
            }
          >
            <StepForward className="w-4 h-4" /> Step
          </Button>
        )}
        <p className="p-4">Simulation speed: </p>
        {
        
        /* Slider needs to be fixed */
        
        }
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          className="w-40 h-4"
          onValueChange={(value) => {
            useSimulatorStore.setState({ speed: value[0] });
          }}
        />
      </div>
      <h1 className="text-emerald-600 font-bold text-2xl">Zx16 Simulator</h1>
    </div>
  );
}
