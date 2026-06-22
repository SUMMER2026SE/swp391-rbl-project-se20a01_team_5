import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    rules: {
      // The pattern setState-in-effect is intentional in our prototype-data
      // hooks (loading flags + fetched data). All cases are guarded by
      // a `cancelled` flag and a stable loader reference.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
      // Allow custom dependency arrays for stable callbacks.
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    ".codex-tmp/**",
  ]),
]);

export default eslintConfig;
