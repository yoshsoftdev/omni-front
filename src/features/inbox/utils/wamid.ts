const MIN_MESSAGE_KEY_LEN = 16;

export function extractWamidKey(value?: string): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";
  if (!raw.startsWith("wamid.")) return raw.toLowerCase();

  const body = raw.slice("wamid.".length);
  try {
    const binary = atob(padBase64(body));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return extractHexToken(bytes);
  } catch {
    return "";
  }
}

export function normalizeWamidForMatch(value?: string): string {
  const key = extractWamidKey(value);
  if (key) return key;
  return (value ?? "").trim().toLowerCase();
}

export function wamidKeysMatch(a?: string, b?: string): boolean {
  const left = (a ?? "").trim();
  const right = (b ?? "").trim();
  if (!left || !right) return false;
  if (left.toLowerCase() === right.toLowerCase()) return true;
  const keyA = extractWamidKey(left);
  const keyB = extractWamidKey(right);
  return Boolean(keyA && keyA === keyB);
}

function padBase64(input: string): string {
  const mod = input.length % 4;
  if (mod === 0) return input;
  return input + "=".repeat(4 - mod);
}

function extractHexToken(bytes: Uint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;

  let start = end;
  while (start > 0 && isHexByte(bytes[start - 1])) start -= 1;

  if (end - start < MIN_MESSAGE_KEY_LEN) return "";
  return new TextDecoder().decode(bytes.subarray(start, end)).toUpperCase();
}

function isHexByte(value: number): boolean {
  return (
    (value >= 48 && value <= 57) ||
    (value >= 65 && value <= 70) ||
    (value >= 97 && value <= 102)
  );
}
