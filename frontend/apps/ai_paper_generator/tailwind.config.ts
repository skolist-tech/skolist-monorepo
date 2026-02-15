import type { Config } from "tailwindcss";
import baseConfig from "../../packages/config/tailwind.config";

const config: Config = {
  ...baseConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
    "../../packages/auth/src/**/*.{js,ts,jsx,tsx}",
  ],
};

export default config;
