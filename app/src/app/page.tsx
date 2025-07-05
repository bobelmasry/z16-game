"use client";
import { CodeViewer } from "@/components/simulator/code";
import Registers from "@/components/simulator/registers";
import Controls from "@/components/simulator/controls";
import GameDisplay from "@/components/simulator/display";
import FileUpload from "@/components/simulator/file-upload";
import PcCounter from "@/components/simulator/pc-counter";
import Console from "@/components/simulator/console";
import { useSimulator } from "@/hooks/use-simulator";

export default function Home() {
  useSimulator();

  return (
    <div className="retro-app-background min-h-screen">
      <Controls />
      <div className="flex h-[calc(100vh-3rem)]">
        <CodeViewer width={350} />
        <div className="flex-1 p-4 overflow-y-auto retro-main-content">
          {/* Display and side panel layout */}
          <div className="flex flex-col xl:flex-row gap-4 mb-4">
            <div className="flex-shrink-0">
              <GameDisplay />
            </div>
            {/* Side panel for larger screens - shows file upload, registers and PC counter */}
            <div className="hidden xl:flex flex-col gap-4 min-w-0 flex-1">
              <FileUpload />
              <Registers />
              <PcCounter />
            </div>
          </div>

          {/* Show file upload, registers and PC counter vertically on smaller screens */}
          <div className="xl:hidden">
            <FileUpload />
            <div className="h-4"></div>
            <Registers />
            <div className="h-4"></div>
            <PcCounter />
            <div className="h-4"></div>
          </div>

          <div className="h-4"></div>
          <Console />
        </div>
      </div>
    </div>
  );
}
