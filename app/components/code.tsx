import Editor, { OnMount, BeforeMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect, useRef } from "react";

const Z16_LANG = "z16";
const Z16_THEME = "z16Theme";

const beforeMount: BeforeMount = (monaco) => {
  // 1) register language & tokens
  monaco.languages.register({ id: Z16_LANG });
  monaco.languages.setMonarchTokensProvider(Z16_LANG, {
    tokenizer: {
      root: [
        [/(;|#).*$/, "comment"],
        [
          /\b(ADD|SUB|JALR|JR|ADDI|SLTI|XORI|ANDI|ORI|LI|BEQ|BNE|BZ|BNZ|BLT|BGE|BLTU|BGEU|LUI|AUIPC|J|JAL|ECALL|SW|LB|LW|LBU)\b/,
          "keyword",
        ],
        [/\bx0\b/, "reg0"],
        [/\bx1\b/, "reg1"],
        [/\bx2\b/, "reg2"],
        [/\bx3\b/, "reg3"],
        [/\bx4\b/, "reg4"],
        [/\bx5\b/, "reg5"],
        [/\bx6\b/, "reg6"],
        [/\bx7\b/, "reg7"],
        [/\b0x[0-7]\b/, "variable"],
        [/\b(0x[0-9A-Fa-f]+|0b[01]+|\d+)\b/, "number"],
      ],
    },
  });

  // 2) define theme
  monaco.editor.defineTheme(Z16_THEME, {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "7c9fb8", fontStyle: "bold" }, // muted blue-grey
      { token: "variable", foreground: "a8c4d6", fontStyle: "bold" }, // soft powder blue
      { token: "number", foreground: "b8d4a8" }, // sage green
      { token: "comment", foreground: "6a9955", fontStyle: "italic" }, // green
      { token: "reg0", foreground: "d49999" }, // dusty rose
      { token: "reg1", foreground: "99d4a8" }, // mint green
      { token: "reg2", foreground: "9db4d4" }, // periwinkle blue
      { token: "reg3", foreground: "d4c899" }, // champagne
      { token: "reg4", foreground: "c99dd4" }, // lavender
      { token: "reg5", foreground: "99d1d4" }, // seafoam
      { token: "reg6", foreground: "d4b199" }, // warm beige
      { token: "reg7", foreground: "b9d499" }, // pale lime
    ],
    colors: {},
  });
};

interface CodeWindowProps {
  code: string;
  PC: number; // zero-based instruction index
}

export function CodeViewer({ code, PC }: CodeWindowProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const updateHighlight = () => {
    const editor = editorRef.current;
    const mon = monacoRef.current;
    if (!editor || !mon) return;

    // const lineNum = PC + 1;
    // decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
    //   {
    //     range: new mon.Range(lineNum, 1, lineNum, 1),
    //     options: { isWholeLine: true, className: "currentLine" },
    //   },
    // ]);
    // editor.revealLineInCenter(lineNum);
  };

  useEffect(() => {
    updateHighlight();
  }, [PC]);

  const handleMount: OnMount = (editor, mon) => {
    editorRef.current = editor;
    monacoRef.current = mon;
    editorRef.current.updateOptions({
      readOnly: true,
      fontSize: 18,
      minimap: { enabled: false },
    });
    updateHighlight();
  };

  return (
    <>
      <Editor
        className="h-[calc(100vh-2.5rem)]"
        width={"300px"}
        defaultLanguage={Z16_LANG}
        theme={Z16_THEME}
        beforeMount={beforeMount}
        onMount={handleMount}
        value={code}
      />
    </>
  );
}
