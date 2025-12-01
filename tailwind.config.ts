import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-merriweather)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      colors: {
        bricq: {
          terracotta: '#C05640',
          slate: '#1A2B3C',
          sage: '#8FA89B',
          cream: '#F7F5F2',
        }
      }
    },
  },
  plugins: [],
};
export default config;