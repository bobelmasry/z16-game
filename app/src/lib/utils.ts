import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatRegisterValue = (
  value: number,
  viewMode: "binary" | "hex"
) => {
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
