import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "brand-dark": "#0a0a0f",
        "brand-card": "#12121a",
        "brand-border": "#1e1e2e",
        "brand-purple": "#9945FF",
        "brand-green": "#14F195",
      },
    },
  },
  plugins: [],
};

export default config;
