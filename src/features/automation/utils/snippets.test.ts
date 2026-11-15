import { describe, expect, it } from "vitest";

import { generateSnippet } from "@/features/automation/utils/snippets";

describe("generateSnippet", () => {
  const url = "https://webhook.omnichan.app/api/v1/automation/endpoints/ept_01TEST";
  const body = { to: "+62812", customerName: "Ada" };

  it("generates curl with immutable endpoint id", () => {
    const snippet = generateSnippet({ language: "curl", url, body });
    expect(snippet).toContain(url);
    expect(snippet).toContain("Authorization: Bearer");
    expect(snippet).not.toContain("/send-invoice");
  });

  it("generates python and csharp samples", () => {
    expect(generateSnippet({ language: "python", url, body })).toContain("requests.post");
    expect(generateSnippet({ language: "csharp", url, body })).toContain("HttpClient");
    expect(generateSnippet({ language: "node_fetch", url, body })).toContain("node-fetch");
  });

  it("keeps payload values with quotes, backslashes and backticks intact in every literal", () => {
    const tricky = { to: "+62812", name: "O'Brien \"Bob\" C:\\tmp `x`" };
    const json = JSON.stringify(tricky);
    const between = (text: string, start: string, end: string) => {
      const from = text.indexOf(start) + start.length;
      return text.slice(from, text.indexOf(end, from));
    };

    const curl = generateSnippet({ language: "curl", url, body: tricky });
    const shellArg = curl.slice(curl.indexOf("-d '") + 4, curl.length - 1);
    expect(shellArg.replace(/'\\''/g, "'")).toBe(json);

    const php = generateSnippet({ language: "php", url, body: tricky });
    const phpLiteral = between(php, "CURLOPT_POSTFIELDS => '", "',\n");
    expect(phpLiteral.replace(/\\(['\\])/g, "$1")).toBe(json);

    const java = generateSnippet({ language: "java", url, body: tricky });
    const javaLiteral = between(java, 'ofString("', '"))');
    expect(javaLiteral.replace(/\\(["\\])/g, "$1")).toBe(json);

    const go = generateSnippet({ language: "go", url, body: tricky });
    expect(go).toContain('` + "`" + `x` + "`" + `');
  });
});
