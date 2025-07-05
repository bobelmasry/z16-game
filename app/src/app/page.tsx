"use client";
import { CodeViewer } from "@/components/simulator/code";
import Registers from "@/components/simulator/registers";
import Controls from "@/components/simulator/controls";
import GameDisplay from "@/components/simulator/display";
import FileUpload from "@/components/simulator/file-upload";
import PcCounter from "@/components/simulator/pc-counter";
import Console from "@/components/simulator/console";
import MemoryInspector from "@/components/simulator/memory-inspector";
import { useSimulator } from "@/hooks/use-simulator";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MemoryStick } from "lucide-react";

export default function Home() {
  useSimulator();
  const [isMemoryInspectorOpen, setIsMemoryInspectorOpen] = useState(false);

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
              {/* Memory Inspector Button */}
              <div className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded">
                <Button
                  onClick={() => setIsMemoryInspectorOpen(true)}
                  variant="outline"
                  className="w-full text-green-400 border-green-500/30 hover:bg-green-500/10 font-mono"
                >
                  <MemoryStick className="w-4 h-4 mr-2" />
                  Memory Inspector
                </Button>
              </div>
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
            {/* Memory Inspector Button for mobile */}
            <div className="retro-terminal retro-terminal-glow bg-black border border-green-500/30 p-3 rounded">
              <Button
                onClick={() => setIsMemoryInspectorOpen(true)}
                variant="outline"
                className="w-full text-green-400 border-green-500/30 hover:bg-green-500/10 font-mono"
              >
                <MemoryStick className="w-4 h-4 mr-2" />
                Memory Inspector
              </Button>
            </div>
            <div className="h-4"></div>
          </div>

          <div className="h-4"></div>
          <Console />
        </div>
      </div>

      {/* Memory Inspector Modal */}
      <MemoryInspector
        isOpen={isMemoryInspectorOpen}
        onClose={() => setIsMemoryInspectorOpen(false)}
      />
    </div>
  );
}
