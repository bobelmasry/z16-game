"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  decodeToInstruction,
  decodeToString,
  Instruction,
} from "@/utils/decoder";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CodeViewer } from "../../components/code";

export default function Home() {
  const [registers, setRegisters] = useState(Array(8).fill(0));
  const [PC, setPC] = useState(0);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]); // Stores console output logs
  const [isUploaded, setIsUploaded] = useState(true);
  const [instructions, setInstructions] = useState<Instruction[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const binary = new Uint16Array(arrayBuffer);
      const myInstructions = Array.from(binary).map((value) =>
        decodeToInstruction(value)
      );
      setInstructions(myInstructions);
      setIsUploaded(true);
    };
    reader.readAsArrayBuffer(file);
  };

  if (!isUploaded)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="grid w-full max-w-sm items-center gap-3">
          <Label htmlFor="picture">Upload binary file please</Label>
          <Input id="picture" type="file" onChange={handleFileChange} />
        </div>
      </div>
    );

  return (
    <div className="">
      <div className="w-screen h-10 bg-neutral-900 flex items-center px-4 py-2">
        <h1 className="text-emerald-600">Zx16</h1>
      </div>
      <CodeViewer
        PC={PC}
        code={instructions
          .map((instruction) => decodeToString(instruction))
          .join("\n")}
      />
    </div>
  );
}
