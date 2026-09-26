import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Deliberately narrow.
 *
 * A linter introduced to a codebase this size with every recommended rule on reports
 * thousands of things, nobody fixes them, and `npm run lint` becomes a command people
 * stop running. So this starts as the rules that catch bugs rather than opinions, and
 * can be widened once the number is zero and stays there.
 *
 * rules-of-hooks is the reason this file exists. A useState below an early return made
 * the student page go blank the moment a student loaded — the hook count changed between
 * renders and React tore the tree down. It was invisible to TypeScript, invisible in
 * review, and this rule catches it in a second.
 */
export default tseslint.config(
  { ignores: ["dist/**", "coverage/**", ".vitest/**", "node_modules/**", "playwright-report/**"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    rules: {
      // ── The bug-catchers. Errors, because each one is a defect, not a style.
      "react-hooks/rules-of-hooks": "error",
      "no-constant-binary-expression": "error",
      "no-self-compare": "error",
      "no-unmodified-loop-condition": "error",
      "@typescript-eslint/no-floating-promises": "off", // needs type info; see below
      "@typescript-eslint/no-misused-promises": "off",

      // ── Real, but not worth failing a build over on day one.
      "react-hooks/exhaustive-deps": "warn",

      // ── Off for now. Each is a large cleanup of its own, and turning them on today
      //    would bury the two rules above under noise.
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": "off",
    },
  },
);
