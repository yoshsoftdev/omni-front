import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

import { legacyUiFiles } from "./eslint.legacy-ui.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Design system (docs/design/design-system.md): feature code builds UI from
// src/components/{ui,shared,layout} instead of raw primitives.
const designSystemRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        { group: ["@radix-ui/*"], message: "Import the wrapper from @/components/ui instead of Radix directly." },
      ],
    },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector: "JSXOpeningElement[name.name='select']",
      message: "Use Select from @/components/ui/select (or FilterSelect).",
    },
    {
      selector: "JSXOpeningElement[name.name='table']",
      message: "Use DataTable from @/components/shared/data-table.",
    },
    {
      selector: "Literal[value=/\\bfixed inset-0\\b/]",
      message: "Use Dialog or Sheet from @/components/ui instead of a hand-made overlay.",
    },
  ],
};

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/**", ...legacyUiFiles],
    rules: designSystemRules,
  },
];

export default eslintConfig;
