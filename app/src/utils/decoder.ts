interface DecoderResult {
  instructions: string[];
}

function decode(binary: Uint16Array): DecoderResult {
  binary
    .filter((_, i) => i < 100)
    .forEach((value, index) => {
      const binaryString = value.toString(2).padStart(16, "0");
      console.log(`16-bit word ${index}:`, binaryString);
    });
  return { instructions: [] };
}
