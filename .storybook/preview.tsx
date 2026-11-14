import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: { icon: "contrast", items: ["light", "dark"], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [
    (Story, context) => {
      // Same mechanism as next-themes (attribute="class").
      document.documentElement.classList.toggle("dark", context.globals.theme === "dark");
      return (
        <div className="bg-background p-6 text-foreground">
          <Story />
        </div>
      );
    },
  ],
  parameters: { layout: "fullscreen" },
};

export default preview;
