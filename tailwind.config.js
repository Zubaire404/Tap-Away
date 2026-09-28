/** @type {import('tailwindcss').Config} */
export default {
  // Scan all TypeScript/TSX source files for class names.
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // Custom keyframe animations used by the game.
      keyframes: {
        // Shake animation: wiggle left-right to signal a blocked train.
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%":      { transform: "translateX(-6px)" },
          "30%":      { transform: "translateX(6px)" },
          "45%":      { transform: "translateX(-5px)" },
          "60%":      { transform: "translateX(5px)" },
          "75%":      { transform: "translateX(-3px)" },
          "90%":      { transform: "translateX(3px)" },
        },

        // Fade + scale-up entrance for the win modal.
        fadeScaleIn: {
          "0%":   { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        shake:       "shake 0.5s ease-in-out",
        fadeScaleIn: "fadeScaleIn 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
