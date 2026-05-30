import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#1B4F72', light: '#2E86C1', dark: '#154360' },
      },
    },
  },
  plugins: [],
};

export default config;
