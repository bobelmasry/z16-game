/** sign-extend a `bits`-wide value */
export function signExtend(val: number, width: number) {
  const mask = (1 << width) - 1;
  val = val & mask;
  const signBit = 1 << (width - 1);
  if (val & signBit) {
    val -= 1 << width;
  }
  return val;
}
