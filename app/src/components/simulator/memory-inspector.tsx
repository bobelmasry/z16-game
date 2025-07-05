"use client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { ScrollArea } from "../ui/scroll-area";
import { formatRegisterValue } from "@/lib/utils";
import { BUFS } from "@/hooks/use-simulator";
import {
  MemoryStick,
  X,
  Search,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Edit3,
  Check,
  XIcon,
} from "lucide-react";

type ViewMode = "hex" | "binary" | "decimal" | "ascii";

interface MemoryInspectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryInspector({
  isOpen,
  onClose,
}: MemoryInspectorProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("hex");
  const [bytesPerRow, setBytesPerRow] = useState<8 | 16 | 32>(16);
  const [currentAddress, setCurrentAddress] = useState<number>(0);
  const [searchAddress, setSearchAddress] = useState<string>("0");
  const [editingCell, setEditingCell] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [viewportStart, setViewportStart] = useState<number>(0);

  const memoryRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Memory size is 65536 words (2 bytes each) = 128KB
  const MEMORY_SIZE = 65536;
  const ROWS_TO_SHOW = 32; // Show 32 rows at a time for performance

  // Get memory view
  const memoryView = useMemo(() => new Uint16Array(BUFS.memory), []);

  // Format value based on view mode
  const formatValue = useCallback((value: number, mode: ViewMode): string => {
    switch (mode) {
      case "hex":
        return value.toString(16).toUpperCase().padStart(4, "0");
      case "binary":
        return value.toString(2).padStart(16, "0");
      case "decimal":
        return value.toString().padStart(5, " ");
      case "ascii":
        // Convert 16-bit word to two ASCII characters
        const high = (value >> 8) & 0xff;
        const low = value & 0xff;
        const highChar =
          high >= 32 && high < 127 ? String.fromCharCode(high) : ".";
        const lowChar = low >= 32 && low < 127 ? String.fromCharCode(low) : ".";
        return highChar + lowChar;
      default:
        return value.toString();
    }
  }, []);

  // Calculate visible range based on viewport
  const visibleRange = useMemo(() => {
    const startRow = Math.floor(viewportStart / bytesPerRow);
    const endRow = Math.min(
      startRow + ROWS_TO_SHOW,
      Math.floor(MEMORY_SIZE / bytesPerRow)
    );
    return { startRow, endRow };
  }, [viewportStart, bytesPerRow]);

  // Handle address navigation
  const goToAddress = useCallback(
    (address: number) => {
      const clampedAddress = Math.max(0, Math.min(address, MEMORY_SIZE - 1));
      setCurrentAddress(clampedAddress);
      setViewportStart(Math.floor(clampedAddress / bytesPerRow) * bytesPerRow);

      // Scroll to the address
      if (scrollAreaRef.current) {
        const row = Math.floor(clampedAddress / bytesPerRow);
        const rowHeight = 32; // Approximate row height
        scrollAreaRef.current.scrollTop = row * rowHeight;
      }
    },
    [bytesPerRow]
  );

  // Handle search input
  const handleSearch = useCallback(() => {
    try {
      let address: number;
      if (searchAddress.startsWith("0x")) {
        address = parseInt(searchAddress, 16);
      } else {
        address = parseInt(searchAddress, 10);
      }

      if (!isNaN(address)) {
        goToAddress(address);
      }
    } catch (error) {
      console.error("Invalid address format");
    }
  }, [searchAddress, goToAddress]);

  // Handle memory editing
  const startEdit = useCallback(
    (address: number) => {
      setEditingCell(address);
      const currentValue = memoryView[address];
      setEditValue(formatValue(currentValue, viewMode));
    },
    [memoryView, formatValue, viewMode]
  );

  const saveEdit = useCallback(() => {
    if (editingCell === null) return;

    try {
      let newValue: number;
      switch (viewMode) {
        case "hex":
          newValue = parseInt(editValue, 16);
          break;
        case "binary":
          newValue = parseInt(editValue, 2);
          break;
        case "decimal":
          newValue = parseInt(editValue, 10);
          break;
        default:
          return;
      }

      if (!isNaN(newValue) && newValue >= 0 && newValue <= 0xffff) {
        memoryView[editingCell] = newValue;
      }
    } catch (error) {
      console.error("Invalid value format");
    } finally {
      setEditingCell(null);
      setEditValue("");
    }
  }, [editingCell, editValue, viewMode, memoryView]);

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        if (editingCell !== null) {
          cancelEdit();
        } else {
          onClose();
        }
      } else if (e.key === "Enter") {
        if (editingCell !== null) {
          saveEdit();
        } else {
          handleSearch();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, editingCell, cancelEdit, saveEdit, handleSearch, onClose]);

  // Scroll handler for virtual scrolling
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      const scrollTop = target.scrollTop;
      const rowHeight = 32;
      const newViewportStart = Math.floor(scrollTop / rowHeight) * bytesPerRow;
      setViewportStart(newViewportStart);
    },
    [bytesPerRow]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border border-green-500/30 rounded-lg shadow-xl retro-terminal-glow w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-green-500/30">
          <div className="flex items-center gap-2">
            <MemoryStick className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-green-400 font-mono">
              Memory Inspector
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="outline"
            size="icon"
            className="text-green-400 border-green-500/30 hover:bg-green-500/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-green-500/30 space-y-4">
          {/* Address Navigation */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-green-400 font-mono">Address:</Label>
              <Input
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="0x0000 or 0"
                className="w-32 bg-black border-green-500/30 text-green-400 font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button
                onClick={handleSearch}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={() => goToAddress(currentAddress - bytesPerRow)}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                disabled={currentAddress === 0}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => goToAddress(currentAddress + bytesPerRow)}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
                disabled={currentAddress >= MEMORY_SIZE - bytesPerRow}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => goToAddress(0)}
                variant="outline"
                size="sm"
                className="text-green-400 border-green-500/30 hover:bg-green-500/10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Label className="text-green-400 font-mono">View:</Label>
              <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(value) =>
                  value && setViewMode(value as ViewMode)
                }
                className="border border-green-500/30 rounded bg-black/50"
              >
                <ToggleGroupItem
                  value="hex"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  HEX
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="binary"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  BIN
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="decimal"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  DEC
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="ascii"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  ASCII
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-green-400 font-mono">Words/Row:</Label>
              <ToggleGroup
                type="single"
                value={bytesPerRow.toString()}
                onValueChange={(value) =>
                  value && setBytesPerRow(parseInt(value) as 8 | 16 | 32)
                }
                className="border border-green-500/30 rounded bg-black/50"
              >
                <ToggleGroupItem
                  value="8"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  8
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="16"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  16
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="32"
                  className="text-green-400 border-green-500/30 data-[state=on]:bg-green-500/20 data-[state=on]:text-green-300 hover:bg-green-500/10"
                >
                  32
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </div>

        {/* Memory Display */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-full p-4"
            ref={scrollAreaRef}
            onScroll={handleScroll}
          >
            <div className="font-mono text-sm">
              {/* Header Row */}
              <div className="flex items-center mb-2 text-green-300 border-b border-green-500/20 pb-2">
                <div className="w-20 text-right pr-4">Address</div>
                <div
                  className="flex-1 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${bytesPerRow}, 1fr)` }}
                >
                  {Array.from({ length: bytesPerRow }, (_, i) => (
                    <div key={i} className="text-center text-xs">
                      +{i.toString(16).toUpperCase()}
                    </div>
                  ))}
                </div>
                {viewMode === "ascii" && (
                  <div className="w-32 ml-4 text-center">ASCII</div>
                )}
              </div>

              {/* Memory Rows */}
              <div className="space-y-1">
                {Array.from(
                  { length: visibleRange.endRow - visibleRange.startRow },
                  (_, rowIndex) => {
                    const actualRow = visibleRange.startRow + rowIndex;
                    const rowAddress = actualRow * bytesPerRow;

                    return (
                      <div
                        key={rowAddress}
                        className="flex items-center hover:bg-green-500/5 py-1 rounded"
                      >
                        {/* Address */}
                        <div className="w-20 text-right pr-4 text-green-300">
                          0x
                          {rowAddress
                            .toString(16)
                            .toUpperCase()
                            .padStart(4, "0")}
                        </div>

                        {/* Memory Values */}
                        <div
                          className="flex-1 grid gap-2"
                          style={{
                            gridTemplateColumns: `repeat(${bytesPerRow}, 1fr)`,
                          }}
                        >
                          {Array.from(
                            { length: bytesPerRow },
                            (_, colIndex) => {
                              const address = rowAddress + colIndex;
                              if (address >= MEMORY_SIZE) return null;

                              const value = memoryView[address];
                              const isCurrentAddress =
                                address === currentAddress;
                              const isEditing = editingCell === address;

                              return (
                                <div
                                  key={address}
                                  className={`
                                text-center p-1 rounded cursor-pointer transition-all
                                ${
                                  isCurrentAddress
                                    ? "bg-green-500/30 ring-1 ring-green-400"
                                    : ""
                                }
                                ${
                                  isEditing
                                    ? "bg-blue-500/30"
                                    : "hover:bg-green-500/10"
                                }
                                text-green-400
                              `}
                                  onClick={() => {
                                    setCurrentAddress(address);
                                    if (!isEditing) startEdit(address);
                                  }}
                                >
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <Input
                                        value={editValue}
                                        onChange={(e) =>
                                          setEditValue(e.target.value)
                                        }
                                        className="h-6 text-xs bg-transparent border-none text-green-400 p-0 text-center"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") saveEdit();
                                          if (e.key === "Escape") cancelEdit();
                                        }}
                                      />
                                      <div className="flex gap-1">
                                        <Button
                                          onClick={saveEdit}
                                          size="sm"
                                          variant="outline"
                                          className="h-4 w-4 p-0 text-green-400 border-green-500/30"
                                        >
                                          <Check className="w-2 h-2" />
                                        </Button>
                                        <Button
                                          onClick={cancelEdit}
                                          size="sm"
                                          variant="outline"
                                          className="h-4 w-4 p-0 text-red-400 border-red-500/30"
                                        >
                                          <XIcon className="w-2 h-2" />
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="relative">
                                      {formatValue(value, viewMode)}
                                      {isCurrentAddress && (
                                        <Edit3 className="w-3 h-3 absolute -top-1 -right-1 text-green-300" />
                                      )}
                                    </span>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>

                        {/* ASCII Column */}
                        {viewMode === "ascii" && (
                          <div className="w-32 ml-4 text-center text-green-400 font-mono">
                            {Array.from(
                              { length: bytesPerRow },
                              (_, colIndex) => {
                                const address = rowAddress + colIndex;
                                if (address >= MEMORY_SIZE) return "";
                                return formatValue(
                                  memoryView[address],
                                  "ascii"
                                );
                              }
                            ).join("")}
                          </div>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-green-500/30 text-sm text-green-300 font-mono">
          <div className="flex justify-between items-center">
            <span>
              Current: 0x
              {currentAddress.toString(16).toUpperCase().padStart(4, "0")} (
              {currentAddress})
            </span>
            <span>
              Value: 0x
              {memoryView[currentAddress]
                ?.toString(16)
                .toUpperCase()
                .padStart(4, "0") || "0000"}
            </span>
            <span>Memory Size: {MEMORY_SIZE} words (128KB)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
