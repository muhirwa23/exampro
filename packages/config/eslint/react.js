import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";
import base from "./base.js";

/** Flat config for React packages (web screens, desktop screens, shared UI). */
export default tseslint.config(...base, {
  files: ["**/*.{ts,tsx}"],
  languageOptions: { globals: { ...globals.browser } },
  plugins: { "react-hooks": reactHooks },
  rules: reactHooks.configs.recommended.rules,
});
