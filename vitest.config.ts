import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      // Alias Next.js "@/" → apps/web (usado em testes de componentes/routes)
      '@': path.resolve(__dirname, 'apps/web'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts'],
    // tests/rls.test.ts e create-order.test.ts requerem Supabase local — executar via pnpm test:* em packages/db
    exclude: ['node_modules', '**/node_modules/**', 'dist', '**/tests/**'],
  },
});