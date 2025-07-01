import { useEffect } from "react";
import { useSimulatorStore } from "@/lib/store/simulator";

export function useSimulator() {
  const pause = useSimulatorStore((s) => s.pause);

  // effect cleanup
  useEffect(() => () => pause(), []);
}
