import React, { useState, useEffect } from "react";
import { stepPerformanceMonitor } from "@/lib/utils/performance";
import { Button } from "@/components/ui/button";

export function PerformanceDebugger() {
  const [stats, setStats] = useState({
    avg: 0,
    min: 0,
    max: 0,
    count: 0,
    maxFreq: 0,
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setStats(stepPerformanceMonitor.getStats());
    }, 1000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  const handleToggleMonitoring = () => {
    if (isMonitoring) {
      stepPerformanceMonitor.disable();
      setIsMonitoring(false);
    } else {
      stepPerformanceMonitor.enable();
      stepPerformanceMonitor.reset();
      setIsMonitoring(true);
    }
  };

  const handleReset = () => {
    stepPerformanceMonitor.reset();
    setStats({ avg: 0, min: 0, max: 0, count: 0, maxFreq: 0 });
  };

  return (
    <div className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded font-mono">
      <h3 className="text-lg font-semibold mb-3">Performance Monitor</h3>

      <div className="flex gap-2 mb-4">
        <Button
          onClick={handleToggleMonitoring}
          variant={isMonitoring ? "destructive" : "outline"}
        >
          {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
        <Button onClick={handleReset} variant="outline">
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Average Step Time:</span>{" "}
          {stats.avg.toFixed(2)}ms
        </div>
        <div>
          <span className="font-medium">Min Step Time:</span>{" "}
          {stats.min.toFixed(2)}ms
        </div>
        <div>
          <span className="font-medium">Max Step Time:</span>{" "}
          {stats.max.toFixed(2)}ms
        </div>
        <div>
          <span className="font-medium">Samples:</span> {stats.count}
        </div>
        <div className="col-span-2">
          <span className="font-medium">Max Theoretical Frequency:</span>{" "}
          {stats.maxFreq}Hz
        </div>
      </div>
    </div>
  );
}
