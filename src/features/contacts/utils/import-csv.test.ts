import { describe, expect, it } from "vitest";

import { guessImportField, parseCsvLine, previewCsv } from "@/features/contacts/utils/import-csv";

describe("parseCsvLine", () => {
  it("keeps commas and escaped quotes inside quoted fields", () => {
    expect(parseCsvLine('Budi,"Jl. Merdeka, 1","say ""hi"""')).toEqual(["Budi", "Jl. Merdeka, 1", 'say "hi"']);
    expect(parseCsvLine("a,,c")).toEqual(["a", "", "c"]);
  });
});

describe("previewCsv", () => {
  it("returns header, first rows and the data row count, skipping blank lines", () => {
    const preview = previewCsv("name,phone\r\nBudi,+628111\n\nSari,+628222\n", 1);
    expect(preview).toEqual({ headers: ["name", "phone"], rows: [["Budi", "+628111"]], totalRows: 2 });
  });
});

describe("guessImportField", () => {
  it("matches common header names and skips the rest", () => {
    expect(guessImportField(" Phone Number ")).toBe("phone");
    expect(guessImportField("Nama")).toBe("name");
    expect(guessImportField("Tanggal Lahir")).toBe("");
  });
});
