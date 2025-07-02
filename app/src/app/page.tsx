"use client";
import { CodeViewer } from "@/components/simulator/code";
import Registers from "@/components/simulator/registers";
import Controls from "@/components/simulator/controls";
import GameDisplay from "@/components/simulator/display";
import FileUpload from "@/components/simulator/file-upload";
import PcCounter from "@/components/simulator/pc-counter";
import Console from "@/components/simulator/console";
import { PerformanceDebugger } from "@/components/simulator/performance-debugger";
import { useSimulator } from "@/hooks/use-simulator";

export default function Home() {
  useSimulator();

  return (
    <div className="retro-app-background min-h-screen">
      <Controls />
      <div className="flex h-[calc(100vh-3rem)]">
        <CodeViewer width={350} />
        <div className="flex-1 p-4 overflow-y-auto retro-main-content">
          <GameDisplay />
          <div className="h-4"></div>
          <FileUpload />
          <div className="h-4"></div>
          <Registers />
          <div className="h-4"></div>
          <PcCounter />
          <div className="h-4"></div>
          <PerformanceDebugger />
          <div className="h-4"></div>
          <Console />
        </div>
      </div>
    </div>
  );
}
