import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Argon Dashboard primary palette
        argon: {
          primary: "#5e72e4",
          "primary-dark": "#4a5bd1",
          secondary: "#f4f5f7",
          success: "#2dce89",
          info: "#11cdef",
          warning: "#fb6340",
          danger: "#f5365c",
          light: "#adb5bd",
          dark: "#212529",
          default: "#344675",
          // Sidebar
          sidebar: "#1a1a2e",
          "sidebar-dark": "#16213e",
        },
        // Chart colors
        chart: {
          blue: "#5e72e4",
          green: "#2dce89",
          orange: "#fb6340",
          red: "#f5365c",
          teal: "#11cdef",
          purple: "#8965e0",
        },
      },
      fontFamily: {
        sans: ["Open Sans", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(50, 50, 93, 0.15), 0 1px 0 rgba(0, 0, 0, 0.02)",
        "card-hover": "0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)",
        lg: "0 15px 35px rgba(50, 50, 93, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07)",
        xl: "0 50px 100px rgba(50, 50, 93, 0.1), 0 15px 35px rgba(50, 50, 93, 0.15), 0 5px 15px rgba(0, 0, 0, 0.1)",
      },
      backgroundImage: {
        "gradient-argon": "linear-gradient(87deg, #172b4d 0, #1a174d 100%)",
        "gradient-primary": "linear-gradient(87deg, #5e72e4 0, #825ee4 100%)",
        "gradient-success": "linear-gradient(87deg, #2dce89 0, #2dcecc 100%)",
        "gradient-info": "linear-gradient(87deg, #11cdef 0, #1171ef 100%)",
        "gradient-warning": "linear-gradient(87deg, #fb6340 0, #fbb140 100%)",
        "gradient-danger": "linear-gradient(87deg, #f5365c 0, #f56036 100%)",
        "gradient-default": "linear-gradient(87deg, #344675 0, #263148 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
