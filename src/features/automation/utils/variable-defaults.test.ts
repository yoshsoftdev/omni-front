import { describe, expect, it } from "vitest";

import {
  buildDefaultVariableMappings,
  buildExampleRequestBody,
  isSendTemplateConfig,
} from "@/features/automation/utils/variable-defaults";
import type { Template } from "@/features/broadcast/types/template";

const template = {
  id: "tpl_x",
  name: "demo",
  language: "id",
  language_label: "ID",
  category: "Utility",
  status: "APPROVED",
  preview: "",
  header: { type: "none" },
  body: "Hi {{1}}, invoice {{2}}",
  buttons: [],
  variable_count: 2,
} as Template;

describe("buildDefaultVariableMappings", () => {
  it("creates required mappings for each variable", () => {
    const mappings = buildDefaultVariableMappings(template);
    expect(mappings).toHaveLength(2);
    expect(mappings[0]?.apiParameter).toBe("customerName");
    expect(mappings[0]?.required).toBe(true);
  });
});

describe("buildExampleRequestBody", () => {
  it("includes recipient and mapped fields", () => {
    const body = buildExampleRequestBody(
      [
        {
          templateVariable: "1",
          apiParameter: "customerName",
          required: true,
          description: "Name",
        },
      ],
      "phone",
    );
    expect(body.to).toBe("+6281234567890");
    expect(body.customerName).toBe("<customerName>");
  });
});

describe("isSendTemplateConfig", () => {
  it("narrows send template configs", () => {
    expect(
      isSendTemplateConfig({
        templateId: "tpl_1",
        templateName: "x",
        recipientMode: "phone",
        variableMappings: [],
      }),
    ).toBe(true);
    expect(isSendTemplateConfig({})).toBe(false);
  });
});
