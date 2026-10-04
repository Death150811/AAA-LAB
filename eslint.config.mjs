import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // Файлы контента импортируют набор конструкторов целиком; неиспользованные не считаются дефектом.
    files: ["src/content/**/*.ts"],
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
]);
