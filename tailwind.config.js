/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./layouts/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // MESSU-BOUW Style - Primary Cyan/Blue
        primary: {
          50: "#e0f7ff",
          100: "#b3ecff",
          200: "#80e1ff",
          300: "#4dd6ff",
          400: "#26ccff",
          500: "#0099FF", // Main MESSU-BOUW color
          600: "#0088e6",
          700: "#0077cc",
          800: "#0066b3",
          900: "#005599",
        },
        // Keep existing cyber colors for compatibility
        cyber: {
          400: "#00d9ff",
          500: "#00b8e6",
        },
        success: {
          400: "#00ff88",
          500: "#00cc66",
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-cyber": "linear-gradient(135deg, #00d9ff 0%, #0066ff 100%)",
        "gradient-success": "linear-gradient(135deg, #00ff88 0%, #00cc66 100%)",
        "gradient-premium": "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
      },
      boxShadow: {
        "glow-cyber": "0 0 20px rgba(0, 217, 255, 0.3)",
        "glow-success": "0 0 20px rgba(0, 255, 136, 0.3)",
        "glow-premium": "0 0 20px rgba(255, 107, 107, 0.3)",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in",
        slideUp: "slideUp 0.5s ease-out",
        slideIn: "slideIn 0.3s ease-out",
        shimmer: "shimmer 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
