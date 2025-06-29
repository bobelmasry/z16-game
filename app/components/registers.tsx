import { useState } from 'react';

const [displayFormat, setDisplayFormat] = useState("decimal");

type RegistersProps = {
  PC: number;
  executeInstructions: (arg: boolean) => void;
  Reset: () => void;
  registers?: number[];
  consoleMessages?: string[];
};

const formatValue = (value: number) => {
    switch (displayFormat) {
      case "binary":
        return "0b" + value.toString(2).padStart(8, "0"); // 8-bit binary
      case "hex":
        return "0x" + value.toString(16).toUpperCase(); // Uppercase hex
      default:
        return value.toString(); // Decimal
    }
  };


export default function Registers({ PC, executeInstructions, Reset, registers, consoleMessages }: RegistersProps) {
{/* Right: Register Table & Console */}
    <div className="w-1/3 p-4 bg-gray-200 mt-13 shadow-lg rounded-lg">
      <h2 className="text-xl font-bold mb-2">Registers</h2>
  
      {/* Dropdown to select display format */}
      <div className="mb-2">
        <label className="text-sm font-semibold">Display Format:</label>
        <select
          className="ml-2 p-1 border rounded-lg bg-gray-100"
          value={displayFormat}
          onChange={(e) => setDisplayFormat(e.target.value)}
        >
          <option value="decimal">Decimal</option>
          <option value="binary">Binary</option>
          <option value="hex">Hexadecimal</option>
        </select>
      </div>
  
      {/* Register Table */}
      <table className="w-full border-collapse border bg-gray-300 border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Register</th>
            <th className="border p-2">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr className="text-center bg-orange-200">
            <td className="border p-2">PC</td>
            <td className="border p-2">{formatValue(PC)}</td>
          </tr>
          {(registers ?? []).map((value, index) => (
            <tr key={index} className="text-center bg-gray-100">
              <td className="border p-2">{`0x${index}`}</td>
              <td className="border p-2">{formatValue(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
  
      {/* Console Window */}
      <div className="mt-6 p-3 bg-black text-green-400 rounded-lg shadow-md h-40 overflow-y-auto text-sm font-mono">
        <h3 className="text-gray-300 font-semibold">Console Output:</h3>
        <div className="mt-2">
          {(consoleMessages ?? []).map((msg, index) => (
            <div key={index} className="whitespace-pre-wrap">{msg}</div>
          ))}
        </div>
      </div>
    </div>
}