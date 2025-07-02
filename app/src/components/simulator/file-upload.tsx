"use client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useShallow } from "zustand/shallow";
import { useOperatingSystemStore } from "@/lib/store/os";

export default function FileUpload() {
  const { fileName, handleFileChange } = useOperatingSystemStore(
    useShallow(({ fileName, handleFileChange }) => ({
      fileName,
      handleFileChange,
    }))
  );
  return (
    <div>
      <Label
        htmlFor="file-upload"
        className="block mb-2 text-lg text-green-400 font-semibold font-mono"
      >
        Upload Z16 Binary File
      </Label>
      <div className="relative">
        <Input
          type="file"
          id="file-upload"
          accept=".bin"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            handleFileChange(file);
            e.target.value = ""; // Clear the input value to allow selecting the same file again
          }}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />
        <Input
          type="text"
          value={fileName || "Choose a file..."}
          placeholder="Choose a file..."
          readOnly
          className="retro-terminal-input cursor-pointer bg-black border border-green-500/30 text-green-400 placeholder-green-600/60 font-mono focus:border-green-400 focus:ring-green-400/50"
        />
      </div>
    </div>
  );
}
