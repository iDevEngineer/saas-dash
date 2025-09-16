/// <reference types="vitest" />
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  test: {
    // Environment for DOM testing
    environment: 'jsdom',
    // Test file patterns - include unit test files but exclude E2E tests
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', '__tests__/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    // Exclude Playwright E2E tests and other non-unit test files
    exclude: [
      'tests/**/*', // Exclude all files in tests/ directory (Playwright E2E tests)
      'node_modules/**/*',
      'dist/**/*',
      '.next/**/*',
    ],
    // Setup files
    setupFiles: [],
    // Global test timeout
    testTimeout: 10000,
    // Don't fail when no tests are found (useful when only E2E tests exist)
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
