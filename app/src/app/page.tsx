"use client";
import Image from "next/image";

export default function Home() {
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
        <span className="mb-1">Upload your file</span>
        <input type="file" className="hidden" onChange={handleFileChange} />
      </label>
    </div>
  );
}
