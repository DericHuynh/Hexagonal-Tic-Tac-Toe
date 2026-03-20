import type { StorybookConfig } from "@storybook/react-vite";
import { dirname } from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";

function getAbsolutePath(value: string) {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-themes",
    "@storybook/addon-links",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
  ],
  framework: getAbsolutePath("@storybook/react-vite"),
  viteFinal: async (config) => {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      plugins: [tailwindcss()],
    });
  },
};

export default config;
