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
});
