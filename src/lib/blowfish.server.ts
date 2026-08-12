import { Blowfish } from "egoroof-blowfish";

/**
 * FNT Command embedded Blowfish key (extracted from FNT's client JS).
 * Do not change these values.
 */
const KEY_BYTES = [
  99, 110, 205, 31, 66, 100, 167, 8348, 65371, 20, 119, 217, 126, 114, 88, 94, 77, 18, 78, 478, 149,
  215, 165, 106, 164, 95, 30, 29, 205, 119, 154, 134, 65371, 64, 190, 169, 219, 134, 248, 230, 222,
  14, 136, 124, 235, 251, 77, 223, 8376, 111, 249, 254, 228, 27, 8320, 141,
];

export function fntBlowfishKey(): string {
  return KEY_BYTES.map((n) => String.fromCharCode(n ^ 166)).join("");
}

/**
 * Mirrors FNT's `bf.encrypt(password, true)`: Blowfish ECB over the raw bytes,
 * serialised as zero-padded 3-digit decimal byte values.
 */
export function encryptPassword(password: string): string {
  const bf = new Blowfish(fntBlowfishKey(), Blowfish.MODE.ECB, Blowfish.PADDING.NULL);
  const encoded = bf.encode(password);
  return Array.from(encoded)
    .map((b) => String(b).padStart(3, "0"))
    .join("");
}
