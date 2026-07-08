import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{ts,tsx,mdx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{md,mdx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        linen: "#f6f1e8",
        ember: "#c46435",
        moss: "#2c4a3d",
        brass: "#af8a40"
      }
    }
  },
  plugins: [typography]
};

export default config;
