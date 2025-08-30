// eslint.config.js (Flat config para Vite + React + TS)
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { ignores: ["dist", "build", "node_modules"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactPlugin.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: { ...globals.browser },
      // Si quieres reglas con info de tipos, añade:
      // parserOptions: { projectService: true },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
    settings: { react: { version: "detect" } },
  },

  // Apaga reglas que chocan con Prettier
  eslintConfigPrettier,
];
