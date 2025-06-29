import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { StreamLanguage } from "@codemirror/language";
import { oneDark } from "@codemirror/theme-one-dark";
import { Decoration, ViewPlugin } from "@codemirror/view";
import { RangeSet } from "@codemirror/state";
import CodeMirror from "@uiw/react-codemirror"; // or your installed wrapper
import dynamic from "next/dynamic";

interface CodeWindowProps {
  code: string;
  onCodeChange: (value: string) => void;
  PC: number; // Program Counter (current instruction index)
}
export default function CodeWindow({
  code,
  onCodeChange,
  PC,
}: CodeWindowProps) {
  const CodeMirror = dynamic(
    () => import("@uiw/react-codemirror").then((mod) => mod.default),
    { ssr: false }
  );

  const z16Highlighting = syntaxHighlighting(
    HighlightStyle.define([
      { tag: t.keyword, color: "#ff9800", fontWeight: "bold" }, // Instructions (Orange)
      { tag: t.variableName, color: "#2196F3", fontWeight: "bold" }, // Registers (Blue)
      { tag: t.number, color: "#4CAF50" }, // Immediate values (Green)
      { tag: t.comment, color: "#9E9E9E", fontStyle: "italic" }, // Comments (Gray Italic)
    ])
  );

  const highlightCurrentInstruction = ViewPlugin.fromClass(
    class {
      decorations: RangeSet<Decoration>;

      constructor(view: any) {
        this.decorations = this.getDecorations(view);
      }

      update(update: { view: any }) {
        this.decorations = this.getDecorations(update.view);
      }

      getDecorations(view: {
        state: { doc: { line: (arg0: number) => any } };
      }) {
        const lines = code
          .split("\n")
          .map((line: string, index: any) => ({
            text: line.split("#")[0].trim(),
            index,
          }))
          .filter((line: { text: string }) => line.text !== ""); // Remove empty/comment-only lines
        if (typeof PC !== "number" || PC >= lines.length)
          return Decoration.none;
        if (PC >= lines.length) return Decoration.none;

        // Find the actual instruction line in the document
        let instructionLine = view.state.doc.line(lines[PC].index + 1);

        return Decoration.set([
          Decoration.line({
            attributes: { style: "background-color: rgba(255, 255, 0, 0.3);" },
          }).range(instructionLine.from),
        ]);
      }
    },
    {
      decorations: (v: { decorations: any }) => v.decorations,
    }
  );

  const z16Language = StreamLanguage.define({
    startState: () => ({}),
    token: (stream: {
      eatSpace: () => any;
      match: (arg0: RegExp) => any;
      next: () => void;
    }) => {
      if (stream.eatSpace()) return null;

      // Highlight Comments (Starts with ';' or '#')
      if (stream.match(/(;|#).*/)) {
        return "comment";
      }

      // Highlight Instructions (Z16 opcodes)
      if (
        stream.match(
          /\b(ADD|SUB|JALR|JR|ADDI|SLTI|XORI|ANDI|ORI|LI|BEQ|BNE|BZ|BNZ|BLT|BGE|BLTU|BGEU|LUI|AUIPC|J|JAL|ECALL|LB|LW|LBU)\b/
        )
      ) {
        return "keyword";
      }

      // Highlight Registers (x0 - x7)
      if (stream.match(/\b0x[0-7]\b/)) {
        return "variableName";
      }

      // Highlight Immediate Values (Hex, Binary, Decimal)
      if (stream.match(/\b(0x[0-9A-Fa-f]+|0b[01]+|\d+)\b/)) {
        return "number";
      }

      stream.next();
      return null;
    },
  });

  return (
    <CodeMirror
      value={code}
      onChange={(value: string) => onCodeChange(value)}
      extensions={[z16Language, z16Highlighting, highlightCurrentInstruction]}
      theme={oneDark}
      className="w-full h-auto p-2 border rounded-lg shadow-sm bg-gray-200"
      style={{ backgroundColor: "#2a313d" }}
    />
  );
}
