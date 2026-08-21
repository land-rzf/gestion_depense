import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 60px -24px rgb(15 23 42 / 0.25)",
        card: "0 8px 30px -18px rgb(15 23 42 / 0.22)"
      },
      fontFamily: { sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"] }
    }
  },
  plugins: []
};

export default config;
