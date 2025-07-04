"use client";
import { useSimulatorStore } from "@/lib/store/simulator";
import { InstructionEncoder } from "@/lib/utils/encoder";
import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";

const Z16_LANG = "z16";
const Z16_THEME = "z16Theme";

// 0) your arrays of mnemonics + registers
const Z16_INSTRUCTIONS = [
  "add",
  "sub",
  "slt",
  "sltu",
  "sll",
  "srl",
  "sra",
  "or",
  "and",
  "xor",
  "mv",
  "jr",
  "jalr",
  "addi",
  "slti",
  "sltui",
  "slli",
  "srli",
  "srai",
  "ori",
  "andi",
  "xori",
  "li",
  "beq",
  "bne",
  "bz",
  "bnz",
  "blt",
  "bge",
  "bltu",
  "bgeu",
  "sb",
  "sw",
  "lb",
  "lw",
  "lbu",
  "j",
  "jal",
  "lui",
  "auipc",
  "ecall",
];
// adjust length if you have more registers
const Z16_REGISTERS = Array.from({ length: 16 }, (_, i) => `x${i}`);
// ABI register names
const Z16_ABI_REGISTERS = ["t0", "ra", "sp", "s0", "s1", "t1", "a0", "a1"];

const beforeMount: BeforeMount = (monaco) => {
  monaco.languages.register({ id: Z16_LANG });
  monaco.languages.setMonarchTokensProvider(Z16_LANG, {
    tokenizer: {
      root: [
        // comments
        [/(;|#).*$/, "comment"],

        // instructions (case-insensitive)
        [new RegExp(`\\b(${Z16_INSTRUCTIONS.join("|")})\\b`, "i"), "keyword"],

        // ABI register names (t0, ra, sp, etc.)
        [
          new RegExp(`\\b(${Z16_ABI_REGISTERS.join("|")})\\b`, "i"),
          "register.abi",
        ],

        // registers x0…x15
        [new RegExp(`\\b(${Z16_REGISTERS.join("|")})\\b`, "i"), "register"],

        // numbers
        [/\b0x[0-9A-Fa-f]+\b/, "number.hex"],
        [/\b0b[01]+\b/, "number.bin"],
        [/\b\d+\b/, "number"],

        // delimiters
        [/[,\[\]\(\)]/, "delimiter"],

        // identifiers (labels, symbols, etc.)
        [/[A-Za-z_]\w*/, "identifier"],

        // whitespace
        [/\s+/, "white"],
      ],
    },
  });

  monaco.editor.defineTheme(Z16_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "10b981", fontStyle: "italic" }, // Bright emerald for comments
      { token: "keyword", foreground: "00ff00", fontStyle: "bold" }, // Bright electric green for keywords
      { token: "register.abi", foreground: "fbbf24", fontStyle: "bold" }, // Golden yellow for ABI registers
      { token: "register", foreground: "22c55e" }, // Medium green for x registers
      { token: "number.hex", foreground: "84cc16" }, // Lime green for hex numbers
      { token: "number.bin", foreground: "65a30d" }, // Darker lime for binary
      { token: "number", foreground: "a3e635" }, // Light lime for regular numbers
      { token: "delimiter", foreground: "34d399" }, // Emerald for delimiters
      { token: "identifier", foreground: "059669" }, // Darker emerald for identifiers
      { token: "white", background: "000000" },
    ],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#4ade80", // Default green
      "editorLineNumber.foreground": "#16a34a", // Darker green for line numbers
      "editorCursor.foreground": "#00ff00", // Bright green cursor
      "editor.selectionBackground": "#22c55e40", // Semi-transparent green selection
      "editorIndentGuide.background": "#16a34a20",
      "editorWhitespace.foreground": "#16a34a30",
      "editorLineNumber.activeForeground": "#22c55e", // Brighter green for active line number
    },
  });
};

interface CodeWindowProps {
  className?: string;
  width?: number;
}

export function CodeViewer({ className, width }: CodeWindowProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const { PC, code, empty } = useSimulatorStore(
    useShallow((s) => ({
      PC: s.pc,
      code: new InstructionEncoder(s.instructions).encodeInstructions(),
      empty: s.instructions.length === 0,
    }))
  );
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const updateHighlight = () => {
    const editor = editorRef.current;
    const mon = monacoRef.current;
    if (!editor || !mon) return;

    const lineNum = Math.ceil((PC + 1) / 2);
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
      {
        range: new mon.Range(lineNum, 1, lineNum, 1),
        options: { isWholeLine: true, className: "currentLine" },
      },
    ]);
    editor.revealLineInCenter(lineNum);
  };

  useEffect(() => {
    if (!empty) updateHighlight();
  }, [PC, empty]);

  const handleMount: OnMount = (editor, mon) => {
    editorRef.current = editor;
    monacoRef.current = mon;
    editor.updateOptions({
      readOnly: true,
      fontSize: 18,
      minimap: { enabled: false },
      contextmenu: false,
      glyphMargin: false,
      folding: false,
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
    });
    if (!empty) updateHighlight();
  };

  return (
    <div
      className={`retro-sidebar h-full border-r border-green-500/30 flex flex-col transition-all duration-300 ${
        isExpanded ? "" : "w-12"
      }`}
      style={{ width: isExpanded ? width : 48 }}
    >
      {isExpanded ? (
        <>
          <div className="p-2 border-b border-green-500/30 flex-shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-green-400 font-mono">
              Assembly Code
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-green-500 hover:text-green-300 transition-colors p-1"
              title="Hide code editor"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M15.41 16.58L10.83 12L15.41 7.42L14 6L8 12L14 18L15.41 16.58Z" />
              </svg>
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              className={className}
              width={isExpanded ? width : undefined}
              defaultLanguage={Z16_LANG}
              theme={Z16_THEME}
              beforeMount={beforeMount}
              onMount={handleMount}
              value={code || "# Upload a binary file\n# to get started!"}
            />
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-start pt-4">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-green-500 hover:text-green-300 transition-colors p-2 mb-2"
            title="Show code editor"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.58L13.17 12L8.59 7.42L10 6L16 12L10 18L8.59 16.58Z" />
            </svg>
          </button>
          <div className="writing-mode-vertical text-green-400 font-mono text-xs">
            <span
              style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
            >
              CODE
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
