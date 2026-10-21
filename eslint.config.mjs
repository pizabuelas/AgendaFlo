import { defineConfig, globalIgnores } from "eslint/config";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Configuración de ESLint en formato plano (flat config).
 *
 * `eslint-config-next` v15 publica su configuración en el formato clásico de
 * ESLint, por lo que se adapta con `FlatCompat` para poder combinarla con el
 * resto de reglas de este proyecto.
 */

const raiz = dirname(fileURLToPath(import.meta.url));

const compat = new FlatCompat({
  baseDirectory: raiz,
  recommendedConfig: undefined,
  allConfig: undefined,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  {
    rules: {
      /* Las reglas de accesibilidad de Next ya cubren la mayoría de casos;
       * se desactivan las que interfieren con el patrón de "mensaje de
       * error" en los componentes de cliente. */
      "@next/next/no-html-link-for-pages": "off",
    },
  },
]);

export default eslintConfig;
