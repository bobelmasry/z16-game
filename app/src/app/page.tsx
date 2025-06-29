"use client";
import { useState } from "react";
import { decodeInstruction } from "@/utils/decoder";
import { executeInstruction } from "@/utils/execute";

interface DecoderResult {
  instructions: string[];
}

function decode(binary: Uint16Array): DecoderResult {
  binary
    .filter((_, i) => i < 100)
    .forEach((value, index) => {
      const binaryString = value.toString(2).padStart(16, "0");
      let decodedInstruction = decodeInstruction(value);
      console.log(`16-bit word ${index}:`, binaryString, "->", decodedInstruction);
    });
  return { instructions: [] };
}



export default function Home() {
  const [registers, setRegisters] = useState(Array(8).fill(0));
  const [PC, setPC] = useState(0);
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]) // Stores console output logs


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const uint16Array = new Uint16Array(arrayBuffer);

      decode(uint16Array);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <label className="flex flex-col items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg cursor-pointer transition-colors">
        <span className="mb-1">Upload your binary file</span>
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
}
