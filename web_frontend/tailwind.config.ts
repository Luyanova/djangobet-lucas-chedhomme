import type { Config } from 'tailwindcss';

export default {
  content: [
    './index.html', // Pour scanner le fichier HTML racine
    './src/**/*.{js,jsx,ts,tsx}', // Pour scanner tous les fichiers JS/TS/JSX/TSX dans src
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config; 