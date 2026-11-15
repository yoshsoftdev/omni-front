/** Header names the backend also recognises on its own (internal/contact/import.go headerAliases). */
const HEADER_ALIASES: Record<string, string> = {
  name: "name", contact_name: "name", customer_name: "name", nama: "name",
  phone: "phone", phone_number: "phone", whatsapp: "phone", telepon: "phone", no_hp: "phone",
  email: "email", notes: "notes", city: "city", kota: "city", company: "company",
};

/** Best-guess contact field for a file column header, or "" (skip). */
export function guessImportField(header: string): string {
  return HEADER_ALIASES[header.trim().toLowerCase().replace(/\s+/g, "_")] ?? "";
}

/** Splits one CSV line, honouring double-quoted fields with commas and "" escapes. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(field.trim());
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field.trim());
  return out;
}

/**
 * Header and first rows of a CSV file, for the mapping preview only; the server parses the real file.
 * shortcut: a quoted field spanning several lines breaks the preview (not the import); fine for contact lists.
 */
export function previewCsv(text: string, maxRows = 10): { headers: string[]; rows: string[][]; totalRows: number } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };
  return {
    headers: parseCsvLine(lines[0]),
    rows: lines.slice(1, maxRows + 1).map(parseCsvLine),
    totalRows: lines.length - 1,
  };
}
