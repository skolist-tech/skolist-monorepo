import type { StorybookConfig } from "@storybook/react-vite";
import { join, dirname } from "path";
import { mergeConfig } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePath(value: string): string {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: [
    "../packages/ui/src/**/*.mdx",
    "../packages/ui/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../packages/auth/src/**/*.mdx",
    "../packages/auth/src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@chromatic-com/storybook"),
    getAbsolutePath("@storybook/addon-interactions"),
  ],
  framework: {
    name: getAbsolutePath("@storybook/react-vite") as "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (config) => {
    return mergeConfig(config, {
      css: {
        postcss: {
          plugins: [
            tailwindcss({ config: join(__dirname, "tailwind.config.ts") }),
            autoprefixer(),
          ],
        },
      },
      resolve: {
        alias: {
          "@skolist/ui": join(__dirname, "../packages/ui/src"),
          "@skolist/auth": join(__dirname, "../packages/auth/src"),
          "@skolist/utils": join(__dirname, "../packages/utils/src"),
          "@skolist/config": join(__dirname, "../packages/config"),
        },
      },
      optimizeDeps: {
        exclude: ["@storybook/blocks"],
      },
    });
  },
};

export default config;
