import convexPlugin from "@convex-dev/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "**/*.js",
    "**/*.cjs",
    "**/*.mjs",
    ".vscode/**",
    "convex/_generated/**",
    "dist/**",
    "src/**",
  ]),

  tseslint.configs.base,

  ...convexPlugin.configs.recommended,
]);
