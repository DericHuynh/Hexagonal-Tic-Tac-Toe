import { defineConfig } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const config = defineConfig({
  plugins: [
    devtools(),
    // this is the plugin that enables path aliases
    tailwindcss(),
    viteReact(),
  ],
  resolve: { tsconfigPaths: true },
});

export default config;
