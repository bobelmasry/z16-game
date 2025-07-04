"use client";

import { useEffect } from "react";
// Update the path below if the actual relative path is different
import { useSimulatorStore } from "../../lib/store/simulator";

export default function KeyboardListener() {
  const setCurrentKey = useSimulatorStore((state) => state.setCurrentKey);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.length === 1) {
        setCurrentKey(e.key);
        console.log(e.key);
      } else {
        setCurrentKey(null);
      }
    };

    const handleKeyUp = () => {
      setCurrentKey(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [setCurrentKey]);

  return null; // invisible component
}
