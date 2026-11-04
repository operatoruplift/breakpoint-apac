import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals, ...nextTs,
  {
    name: 'breakpoint-apac/vendor-commonjs',
    files: ['vendor/braces/**/*.js'],
    // Preserve the CommonJS ABI consumed by micromatch; all other rules stay enabled.
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  globalIgnores(['.next/**', 'next-env.d.ts', 'output/**', 'playwright-report/**', 'test-results/**']),
]);
