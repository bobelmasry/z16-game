import { Switch } from "@/components/ui/switch";
import { signExtend } from "@/utils/binary";
import { useState } from "react";

export default function Registers({ registers }: { registers: number[] }) {
  const [viewMode, setViewMode] = useState<"hex" | "binary">("binary");

  const formatValue = (value: number) => {
    // Use the signed value directly (already sign-extended from signExtend function)
    const signedValue = value;

    switch (viewMode) {
      case "binary":
        // For negative values, show 2's complement representation
        const binaryValue = signedValue < 0 ? signedValue >>> 0 : signedValue;
        return (
          "0b" +
          binaryValue
            .toString(2)
            .padStart(32, signedValue < 0 ? "1" : "0")
            .slice(-16)
        );
      case "hex":
        // For negative values, show 2's complement hex
        const hexValue = signedValue < 0 ? signedValue & 0xffff : signedValue;
        return "0x" + hexValue.toString(16).toUpperCase().padStart(4, "0");
      default:
        return signedValue.toString(); // Signed decimal
    }
  };
  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <h2 className="text-lg font-semibold">Registers</h2>
        <div className="w-2"></div>
        <Switch
          checked={viewMode === "hex"}
          onCheckedChange={(checked) => setViewMode(checked ? "hex" : "binary")}
        />
        <span className="ml-2 text-sm font-medium">
          {viewMode === "hex" ? "Hex" : "Dec"}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-4">
        {registers.map((value, index) => (
          <div key={index} className="bg-neutral-700 p-2 rounded">
            x{index}: {value} | {formatValue(signExtend(value, 16))}
          </div>
        ))}
      </div>
    </div>
  );
}
