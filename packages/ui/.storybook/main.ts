import type { StorybookConfig } from "@storybook/react-vite";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite"; // Import mergeConfig
import tailwindcss from "@tailwindcss/vite"; // Import the plugin

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Add this viteFinal configuration
  viteFinal: async (config) => {
    return mergeConfig(config, {
      plugins: [tailwindcss()], // Add the Tailwind plugin here
      resolve: {
        alias: {
          ...config.resolve?.alias,
          "@": join(__dirname, ".."),
        },
      },
    });
  },
};

export default config;
