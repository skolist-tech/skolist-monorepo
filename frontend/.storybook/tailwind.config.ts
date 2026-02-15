import type { Config } from "tailwindcss";
import baseConfig from "../packages/config/tailwind.config";
import { join } from "path";

const config: Config = {
  ...baseConfig,
  content: [
    join(__dirname, "./**/*.{js,ts,jsx,tsx}"),
    join(__dirname, "../packages/ui/src/**/*.{js,ts,jsx,tsx}"),
    join(__dirname, "../packages/auth/src/**/*.{js,ts,jsx,tsx}"),
    join(__dirname, "../apps/ai_paper_generator/src/**/*.{js,ts,jsx,tsx}"),
  ],
};

export default config;
