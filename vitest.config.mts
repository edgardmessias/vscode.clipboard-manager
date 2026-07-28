import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    name: 'unit',
    globals: true,
    environment: 'node',
    include: ['src/test/unit/**/*.test.ts'],
    exclude: ['node_modules', 'out'],
    setupFiles: ['src/test/unit/vitestSetup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'html', 'lcov', 'text-summary'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/test/**',
        'src/tools/**',
        '**/node_modules/**',
        'src/extension.ts',
      ],
      reportsDirectory: 'coverage',
    },
  },
  resolve: {
    alias: {
      vscode: resolve(__dirname, 'src/test/unit/mocks/vscode.ts'),
    },
  },
});
