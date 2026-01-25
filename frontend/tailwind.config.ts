import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#912338", // Concordia Burgundy
        "primary-dark": "#631726", // Darker burgundy
        "accent-gold": "#C5B358", // Antique Gold for highlights
        "background-light": "#F5F1E1", // Vintage Cream
        "background-dark": "#1a1625", // Dark Burgundy Night
        "paper-light": "#F5F1E1", // Concordia Cream
        "paper-dark": "#2d2a3d",
        "wood-light": "#912338", // Deep Burgundy desk
        "wood-dark": "#5e1624", // Darker burgundy for shadows/borders
        "wood-face": "#A1887F", // Lighter wood for sign face
        "chain": "#546E7A", // Blue Grey
        "brick-red": "#7D3C3C",
        "ink": "#2c1810",
        "burgundy": "#912338",
        "burgundy-dark": "#5e1624",
        "cream": "#F5F1E1"
      },
      fontFamily: {
        display: ["'Press Start 2P'", "cursive"],
        handwriting: ["'VT323'", "monospace"],
      },
      backgroundImage: {
        'concordia-night': "linear-gradient(to bottom, #2E0F15 0%, #4A1A23 60%, #1A0508 100%)",
        'concordia-day': "linear-gradient(to bottom, #F5F1E1 0%, #E6DBC4 100%)",
        'lined-paper': "repeating-linear-gradient(transparent, transparent 31px, #912338 31px, #912338 32px)",
        'lined-paper-dark': "repeating-linear-gradient(transparent, transparent 31px, #4b5563 31px, #4b5563 32px)",
      },
      boxShadow: {
        'pixel': '4px 4px 0px 0px rgba(0,0,0,0.3)',
        'pixel-sm': '2px 2px 0px 0px rgba(0,0,0,0.3)',
        'inner-pixel': 'inset 3px 3px 0px 0px rgba(0,0,0,0.1)',
        'glow': '0 0 10px #912338, 0 0 20px #912338',
      }
    },
  },
  plugins: [],
};
export default config;
