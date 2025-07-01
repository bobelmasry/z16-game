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
    <div className="">
      <Controls />
      <div className="flex h-[calc(100vh-3rem)]">
        <CodeViewer width={350} />
        <div className="flex-1 p-4 overflow-y-auto bg-neutral-800 text-white">
          <GameDisplay />
          <FileUpload />
          <div className="h-4"></div>
          <Registers />
          <PcCounter />
          <div className="h-4"></div>
          <Console />
        </div>
      </div>
    </div>
  );
}
