import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["build", "build-spa", ".react-router", ".wrangler", "test-results", "playwright-report", "node_modules"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Idioma de React Router: `throw data(null, { status: 404 })` en loaders.
      "@typescript-eslint/only-throw-error": [
        "error",
        { allow: [{ from: "package", package: "react-router", name: "DataWithResponseInit" }] },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}", "spa-baseline/**/*.{ts,tsx}"],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { "react-hooks": reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  {
    files: ["**/*.{js,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: { globals: { ...globals.node } },
  },
);
